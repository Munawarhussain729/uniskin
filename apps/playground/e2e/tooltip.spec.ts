import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-tooltip (roadmap 0.6.0, ADR-003 section 5): a CSS-only bubble shown on
 * hover and focus. Pins the behaviour Uniskin does provide (reveal on hover
 * and focus, hoverable bubble, placement, RTL) and the text contrast; the
 * documented limit (no Escape dismissal) is deliberately not tested.
 */

function textRatio(el: Element) {
  const ctx = el.ownerDocument.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const rgba = (css: string): number[] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3]));
  const layers: number[][] = [];
  for (let n: Element | null = el; n; n = n.parentElement) {
    const c = rgba(getComputedStyle(n).backgroundColor);
    if (c[3] > 0) layers.push(c);
    if (c[3] === 1) break;
  }
  let bg = [255, 255, 255];
  for (const l of layers.reverse()) bg = over(l, bg);
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const t = rgba(getComputedStyle(el).color);
  const [hi, lo] = [lum(over(t, bg)), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const visible = (el: Element) => {
  const cs = getComputedStyle(el);
  return cs.visibility === "visible" && cs.opacity === "1" && cs.display !== "none";
};

/**
 * Bubbles below 4.5:1 that are the upstream palette itself, not Uniskin's
 * mapping (see docs/qa/a11y-2026-11.md, "upstream exceptions"). The test
 * asserts this set exactly, so a fix or a regression both show up.
 */
const KNOWN_LOW: Record<string, string[]> = {
  "shadcn/light": ["ui-danger"],
  "daisyui/light": ["ui-secondary", "ui-soft ui-danger"],
  "daisyui/dark": ["ui-primary", "ui-secondary", "ui-soft ui-primary"],
};

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("is hidden until hovered, and stays while the pointer is on the bubble", async ({ page }) => {
        const bubble = page.locator("#tip-live-bubble");
        expect(await bubble.evaluate(visible)).toBe(false);
        await page.locator("#tip-live-btn").hover();
        expect(await bubble.evaluate(visible)).toBe(true);
        // WCAG 1.4.13 hoverable: moving onto the bubble must not close it
        const box = (await bubble.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
        expect(await bubble.evaluate(visible)).toBe(true);
        await page.mouse.move(2, 2);
        expect(await bubble.evaluate(visible)).toBe(false);
      });

      test("is shown on keyboard focus and hidden on blur", async ({ page }) => {
        const bubble = page.locator("#tip-live-bubble");
        await page.locator("#tip-live-btn").focus();
        expect(await bubble.evaluate(visible)).toBe(true);
        await page.locator("#tip-live-btn").blur();
        expect(await bubble.evaluate(visible)).toBe(false);
      });

      test("the trigger is described by the bubble", async ({ page }) => {
        await expect(page.locator("#tip-live-btn")).toHaveAccessibleDescription("Ctrl+S");
        await expect(page.locator("#tip-live-bubble")).toHaveAttribute("role", "tooltip");
      });

      test("[hidden] removes the bubble even while hovered", async ({ page }) => {
        const bubble = page.locator("#tip-live-bubble");
        await page.locator("#tip-live-btn").hover();
        await bubble.evaluate((el) => el.setAttribute("hidden", ""));
        expect(await bubble.evaluate((el) => getComputedStyle(el).display)).toBe("none");
      });

      test("data-placement puts the bubble on the named side", async ({ page }) => {
        const rect = async (sel: string) => (await page.locator(sel).boundingBox())!;
        for (const pl of ["top", "bottom", "start", "end"]) {
          const btn = await rect(`#tip-place-${pl}`.replace("#", "[aria-describedby='") + "']");
          const tip = await rect(`#tip-place-${pl}`);
          if (pl === "top") expect(tip.y + tip.height).toBeLessThanOrEqual(btn.y + 0.5);
          if (pl === "bottom") expect(tip.y).toBeGreaterThanOrEqual(btn.y + btn.height - 0.5);
          if (pl === "start") expect(tip.x + tip.width).toBeLessThanOrEqual(btn.x + 0.5);
          if (pl === "end") expect(tip.x).toBeGreaterThanOrEqual(btn.x + btn.width - 0.5);
        }
      });

      test("RTL flips start and end", async ({ page }) => {
        await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
        const rect = async (sel: string) => (await page.locator(sel).boundingBox())!;
        const btnS = await rect("[aria-describedby='tip-place-start']");
        const tipS = await rect("#tip-place-start");
        const btnE = await rect("[aria-describedby='tip-place-end']");
        const tipE = await rect("#tip-place-end");
        expect(tipS.x).toBeGreaterThanOrEqual(btnS.x + btnS.width - 0.5); // start is now the right
        expect(tipE.x + tipE.width).toBeLessThanOrEqual(btnE.x + 0.5); // end is now the left
      });

      test("bubble text >= 4.5:1, except the recorded upstream palette values", async ({ page }) => {
        const tips = page.locator("#tip-variants .ui-tooltip");
        const n = await tips.count();
        expect(n).toBe(12);
        const low: string[] = [];
        for (let i = 0; i < n; i++) {
          const r = await tips.nth(i).evaluate(textRatio);
          if (r < 4.5) {
            const cls = ((await tips.nth(i).getAttribute("class")) ?? "")
              .replace("ui-tooltip", "")
              .replace("ui-active", "")
              .trim();
            low.push(cls);
          }
        }
        // docs/qa/tooltip-2026-11.md: palette values mirrored from upstream
        expect(low.sort(), "bubbles under 4.5:1").toEqual((KNOWN_LOW[`${adapter}/${mode}`] ?? []).slice().sort());
      });
    });
  }
}
