import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, inspectElement, openPlayground } from "./helpers.js";

/**
 * ui-field (docs/decisions/003, component 4): label/hint/error wiring,
 * error text contrast (WCAG 1.4.3), aria-invalid border (1.4.11),
 * focus ring, disabled, RTL and reduced motion.
 */

/** Runs in the browser: resolved colours via canvas, so oklch()/color-mix() work. */
function measure(el: Element) {
  const doc = el.ownerDocument;
  const cnv = doc.createElement("canvas");
  cnv.width = cnv.height = 1;
  const ctx = cnv.getContext("2d", { willReadFrequently: true })!;
  const rgba = (css: string): number[] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top: number[], bottom: number[]) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a));
  };
  const backdrop = (from: Element | null): number[] => {
    const layers: number[][] = [];
    for (let n = from; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let acc: number[] = [255, 255, 255];
    for (const l of layers.reverse()) acc = over(l, acc);
    return acc;
  };
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const cs = getComputedStyle(el);
  const surround = backdrop(el.parentElement);
  const own = over(rgba(cs.backgroundColor), surround);
  const text = over(rgba(cs.color), own);
  const border = over(rgba(cs.borderTopColor), surround);
  return { textRatio: ratio(text, own), borderRatio: ratio(border, surround) };
}

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("label, hint and error are wired with for/id and aria-describedby", async ({ page }) => {
        const wiring = await page.locator("#f-email").evaluate((el) => {
          const doc = el.ownerDocument;
          const label = doc.querySelector('label[for="' + el.id + '"]');
          const described = (el.getAttribute("aria-describedby") ?? "")
            .split(" ")
            .map((id) => doc.getElementById(id)?.className);
          return { label: label?.className, described, invalid: el.getAttribute("aria-invalid") };
        });
        expect(wiring.label).toContain("ui-field-label");
        expect(wiring.described).toEqual(["ui-field-hint", "ui-field-error"]);
        expect(wiring.invalid).toBe("true");
        await expect(page.getByLabel("Email")).toBeVisible();
      });

      test("error text is >= 4.5:1 and hint text is >= 4.5:1 (WCAG 1.4.3)", async ({ page }) => {
        const err = await page.locator("#f-email-error").evaluate(measure);
        expect(err.textRatio, "error text").toBeGreaterThanOrEqual(4.5);
        for (const id of ["#f-name-hint", "#f-off-hint"]) {
          const hint = await page.locator(id).evaluate(measure);
          expect(hint.textRatio, id).toBeGreaterThanOrEqual(4.5);
        }
        const label = await page.locator('label[for="f-name"]').evaluate(measure);
        expect(label.textRatio, "label").toBeGreaterThanOrEqual(4.5);
      });

      test("aria-invalid border differs from the valid border and is >= 3:1", async ({ page }) => {
        for (const id of ["#f-email", "#f-plan", "#f-msg", "#f-ghost"]) {
          const r = await page.locator(id).evaluate(measure);
          expect(r.borderRatio, `${id} invalid border`).toBeGreaterThanOrEqual(3);
        }
        const valid = await page.locator("#f-name").evaluate((el) => getComputedStyle(el).borderTopColor);
        const invalid = await page.locator("#f-email").evaluate((el) => getComputedStyle(el).borderTopColor);
        expect(invalid).not.toBe(valid);
      });

      test("keyboard focus on an invalid input keeps a ring >= 3:1", async ({ page }) => {
        await page.locator("#f-email").focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        const info = await page.locator("#f-email").evaluate(inspectElement);
        expect(info.ring.kind).not.toBe("none");
        expect(info.ringRatio ?? 0).toBeGreaterThanOrEqual(3);
      });

      test("disabled field control is disabled and its hint still reads", async ({ page }) => {
        await expect(page.locator("#f-off")).toBeDisabled();
        expect(await page.locator("#f-off").evaluate((el) => getComputedStyle(el).opacity)).toBe("0.5");
        await expect(page.locator("#f-off-hint")).toBeVisible();
      });

      test("an empty error slot takes no space", async ({ page }) => {
        const display = await page.locator("#f-live-error").evaluate((el) => getComputedStyle(el).display);
        expect(display).toBe("none");
        await page.locator("#f-live-error").evaluate((el) => (el.textContent = "Required."));
        await expect(page.locator("#f-live-error")).toBeVisible();
      });

      test("RTL: text aligns to the right and the field uses no physical offsets", async ({ page }) => {
        const info = await page.locator("#f-rtl-error").evaluate((el) => {
          const cs = getComputedStyle(el);
          const field = el.closest(".ui-field")!.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return { dir: cs.direction, align: cs.textAlign, gapEnd: Math.round(field.right - r.right) };
        });
        expect(info.dir).toBe("rtl");
        expect(["start", "right"]).toContain(info.align);
        expect(info.gapEnd).toBeLessThanOrEqual(1);
      });
    });
  }

  test(`${adapter}: field transitions stop under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPlayground(page, adapter, "light");
    const t = await page.locator("#f-email").evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(t).toBe("none");
    // control: without the preference the invalid control does transition
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await page.locator("#f-email").evaluate((el) => getComputedStyle(el).transitionProperty)).toContain(
      "border-color",
    );
  });
}
