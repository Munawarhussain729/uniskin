import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/** ui-breadcrumb and ui-pagination (roadmap 0.8.0): separators, current page, sizes, contrast. */
for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("breadcrumb: separator between items only, current page is bold and not a link", async ({ page }) => {
        const items = page.locator('nav[aria-label="Breadcrumb"] li');
        expect(await items.first().evaluate((el) => getComputedStyle(el, "::before").content)).toMatch(/none|normal/);
        expect(await items.nth(1).evaluate((el) => getComputedStyle(el, "::before").content)).toContain("/");
        const w = await page.locator('nav[aria-label="Breadcrumb"] [aria-current="page"]').evaluate((el) => getComputedStyle(el).fontWeight);
        expect(Number(w)).toBeGreaterThanOrEqual(600);
      });

      test("breadcrumb sizes are ordered", async ({ page }) => {
        const fs = (l: string) => page.locator(`nav[aria-label="${l}"] ol`).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(await fs("Breadcrumb small")).toBeLessThan(await fs("Breadcrumb"));
        expect(await fs("Breadcrumb")).toBeLessThan(await fs("Breadcrumb large"));
      });

      test("pagination: the current page is filled, others are not; items are at least 44px apart or 24px wide", async ({ page }) => {
        const cur = await page.locator('nav[aria-label="Pagination"] [aria-current="page"]').evaluate((el) => getComputedStyle(el).backgroundColor);
        const other = await page.locator('nav[aria-label="Pagination"] li:nth-child(3) a').evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(cur).not.toBe("rgba(0, 0, 0, 0)");
        expect(other).toBe("rgba(0, 0, 0, 0)");
        const sizes = await page.locator('nav[aria-label="Pagination"] .ui-pagination-item').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
        for (const h of sizes) expect(h).toBeGreaterThanOrEqual(24); // WCAG 2.5.8
      });

      test("pagination: ui-active matches aria-current and a disabled item takes no pointer", async ({ page }) => {
        const a = await page.locator('nav[aria-label="Pagination primary"] .ui-active').evaluate((el) => getComputedStyle(el).backgroundColor);
        const c = await page.locator('nav[aria-label="Pagination primary"] [aria-current="page"]').evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(a).toBe(c);
        expect(await page.locator('nav[aria-label="Pagination"] .ui-disabled').first().evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
      });

      test("pagination: the current-page label contrast >= 4.5:1 except recorded palette values", async ({ page }) => {
        const KNOWN: Record<string, string[]> = {
          "shadcn/light": ["Pagination danger"],
          "daisyui/dark": ["Pagination primary"],
        };
        const low = await page.locator("nav ul.ui-pagination").evaluateAll((uls) => {
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
          const rgb = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
          const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          return uls.flatMap((ul) => {
            const el = ul.querySelector('[aria-current="page"]')!;
            const cs = getComputedStyle(el);
            const [hi, lo] = [lum(rgb(cs.color)), lum(rgb(cs.backgroundColor))].sort((x, y) => y - x);
            return (hi + 0.05) / (lo + 0.05) < 4.5 ? [ul.closest("nav")!.getAttribute("aria-label")!] : [];
          });
        });
        expect(low).toEqual(KNOWN[`${adapter}/${mode}`] ?? []);
      });
    });
  }
}
