import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-radio and the checkbox / select gap fixes (docs/decisions/003, wave 1):
 * non-text contrast (WCAG 1.4.11), headless [aria-checked] rendering,
 * listbox selects without a chevron, and reduced motion.
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
  const border = over(rgba(cs.borderTopColor), surround);
  const dot = over(rgba(getComputedStyle(el, "::after").backgroundColor), own);
  return {
    borderVsSurround: ratio(border, surround),
    dotVsFill: ratio(dot, own),
    fillVsSurround: ratio(own, surround),
  };
}

/**
 * Intent colours that the upstream palette itself renders below 3:1 on the
 * page surface (shadcn dark `--destructive`, daisyUI light success). The
 * default `ui-primary` radio is still asserted in every skin below; these
 * extra intent/style combinations are only asserted where the palette allows.
 * Recorded in docs/qa/radio-contrast-2026-11.md.
 */
const KNOWN_PALETTE_LIMITS: Record<string, true> = {
  "shadcn/dark": true,
  "daisyui/light": true,
};

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("unchecked radio border is >= 3:1 against the surface", async ({ page }) => {
        const r = await page.locator("#radio-plan input").nth(1).evaluate(measure);
        expect(r.borderVsSurround).toBeGreaterThanOrEqual(3);
      });

      test("checked radio marks the choice with >= 3:1 contrast (dot and circle)", async ({ page }) => {
        const extras = KNOWN_PALETTE_LIMITS[`${adapter}/${mode}`]
          ? []
          : ["input.ui-radio.ui-success.ui-soft", "input.ui-radio.ui-danger.ui-outline"];
        for (const sel of ["#radio-plan input:checked", ...extras]) {
          const el = page.locator(sel).first();
          await el.check();
          const r = await el.evaluate(measure);
          expect(r.dotVsFill, `${sel} dot`).toBeGreaterThanOrEqual(3);
          expect(
            Math.max(r.borderVsSurround, r.fillVsSurround),
            `${sel} circle`,
          ).toBeGreaterThanOrEqual(3);
        }
      });

      test('role="radio" / role="checkbox" with aria-checked render checked', async ({ page }) => {
        const tf = (sel: string) =>
          page.locator(sel).first().evaluate((el) => getComputedStyle(el, "::after").transform);
        expect(await tf('button.ui-radio[aria-checked="true"]')).toMatch(/^matrix\(1,/);
        expect(await tf('button.ui-radio[aria-checked="false"]')).toMatch(/^matrix\(0,/);
        const h = (sel: string) =>
          page.locator(sel).first().evaluate((el) => getComputedStyle(el, "::after").height);
        // mixed draws the dash (2px high); true draws the tick (taller)
        expect(await h('button.ui-checkbox[aria-checked="mixed"]')).toBe("2px");
        expect(await h('button.ui-checkbox[aria-checked="true"]')).not.toBe("2px");
        expect(await tf('button.ui-checkbox[aria-checked="true"]')).not.toMatch(/scale\(0\)/);
      });

      test("disabled radios are announced and dimmed", async ({ page }) => {
        const d = page.locator("input.ui-radio[disabled]").first();
        await expect(d).toBeDisabled();
        expect(await d.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.5");
      });

      test("select[multiple] / select[size] have no chevron; a plain select keeps it", async ({ page }) => {
        const img = (sel: string) =>
          page.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(await img("select.ui-select[multiple]")).toBe("none");
        expect(await img('select.ui-select[size="3"]')).toBe("none");
        expect(await img("select.ui-select:not([multiple]):not([size])")).toContain("linear-gradient(");
        const height = await page
          .locator("select.ui-select[multiple]")
          .evaluate((el) => el.getBoundingClientRect().height);
        expect(height).toBeGreaterThan(50);
      });
    });
  }

  test(`${adapter}: radio transitions stop under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPlayground(page, adapter, "light");
    const radio = page.locator("input.ui-radio").first();
    const info = await radio.evaluate((el) => ({
      el: getComputedStyle(el).transitionProperty,
      dot: getComputedStyle(el, "::after").transitionProperty,
    }));
    expect(info).toEqual({ el: "none", dot: "none" });
    // control: without the preference the radio does transition
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await radio.evaluate((el) => getComputedStyle(el).transitionProperty)).not.toBe("none");
  });
}
