import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-slider (roadmap 0.8.0): a native range input. Pins keyboard operation,
 * the size steps, the live fill hook and the thumb's non-text contrast
 * (WCAG 1.4.11) against the page.
 */
for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
      });

      test("arrow keys change the value and the demo updates the fill", async ({ page }) => {
        const s = page.locator("#slider-live");
        await s.focus();
        await page.keyboard.press("ArrowRight");
        expect(await s.inputValue()).toBe("26");
        expect(await s.evaluate((el) => el.style.getPropertyValue("--ui-slider-fill"))).toBe("26%");
        await page.keyboard.press("End");
        expect(await s.inputValue()).toBe("100");
      });

      test("the focused slider has a visible ring", async ({ page }) => {
        const s = page.locator("#slider-live");
        await page.keyboard.press("Tab"); // ensure keyboard modality
        await s.focus();
        await page.keyboard.press("ArrowLeft");
        const o = await s.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, w: getComputedStyle(el).outlineWidth }));
        expect(o.style).not.toBe("none");
        expect(parseFloat(o.w)).toBeGreaterThanOrEqual(2);
      });

      test("sizes are ordered (the input height follows the thumb)", async ({ page }) => {
        const h = (l: string) => page.locator(`#slider-demo input[aria-label="${l}"]`).evaluate((el) => el.getBoundingClientRect().height);
        expect(await h("Small")).toBeLessThan(await h("Volume"));
        expect(await h("Volume")).toBeLessThan(await h("Large"));
      });

      test("a disabled slider is dimmed and cannot be focused", async ({ page }) => {
        const d = page.locator("#slider-demo input[disabled]");
        expect(Number(await d.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
        await d.focus();
        expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).not.toBe("Disabled");
      });

      test("the thumb colour is at least 3:1 against the page, except recorded palette values", async ({ page }) => {
        // pseudo-elements cannot be read, so resolve the colour the thumb uses
        // (--ui-slider-color, default --ui-c-text) through a temporary `color`
        const KNOWN: Record<string, string[]> = {};
        const low = await page.locator("#slider-demo input:not([disabled])").evaluateAll((els) => {
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
          const rgb = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
          const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const bg = getComputedStyle(document.body).backgroundColor;
          return els.flatMap((el) => {
            const input = el as HTMLElement;
            input.style.color = "var(--ui-slider-color, var(--ui-c-text))";
            const thumb = getComputedStyle(input).color;
            input.style.color = "";
            const [hi, lo] = [lum(rgb(thumb)), lum(rgb(bg))].sort((x, y) => y - x);
            return (hi + 0.05) / (lo + 0.05) < 3 ? [input.getAttribute("aria-label")!] : [];
          });
        });
        expect(low).toEqual(KNOWN[`${adapter}/${mode}`] ?? []);
      });
    });
  }
}
