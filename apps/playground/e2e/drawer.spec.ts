import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-modal as a drawer (roadmap 0.8.0): data-placement docks the box to an
 * edge. Uses the real <dialog>: the docked edge, the slide-in, Escape and
 * RTL.
 */
const SIDES = ["start", "end", "top", "bottom"] as const;

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
      });

      for (const side of SIDES) {
        test(`${side}: the box is flush to its edge and fills the other axis`, async ({ page }) => {
          await page.locator(`[data-drawer="${side}"]`).click();
          const box = page.locator("#demo-drawer .ui-modal-box");
          // wait for the 0.25s slide to land
          await expect
            .poll(() => box.evaluate((el) => getComputedStyle(el).transform))
            .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
          const r = await box.evaluate((el) => {
            const b = el.getBoundingClientRect();
            return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight };
          });
          if (side === "start") { expect(r.l).toBe(0); expect(r.h).toBe(r.vh); expect(r.w).toBeLessThan(r.vw); }
          if (side === "end") { expect(r.r).toBe(r.vw); expect(r.h).toBe(r.vh); }
          if (side === "top") { expect(r.t).toBe(0); expect(r.w).toBe(r.vw); expect(r.h).toBeLessThan(r.vh); }
          if (side === "bottom") { expect(r.b).toBe(r.vh); expect(r.w).toBe(r.vw); }
        });
      }

      test("Escape closes the drawer and it slides out of the way", async ({ page }) => {
        await page.locator('[data-drawer="end"]').click();
        await page.keyboard.press("Escape");
        const dlg = page.locator("#demo-drawer");
        await expect(dlg).not.toHaveAttribute("open", "");
        await expect.poll(() => dlg.evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");
        const t = await page.locator("#demo-drawer .ui-modal-box").evaluate((el) => getComputedStyle(el).transform);
        expect(t).not.toBe("none");
      });

      test("in right-to-left, start docks to the right edge", async ({ page }) => {
        await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
        await page.locator('[data-drawer="start"]').click();
        const box = page.locator("#demo-drawer .ui-modal-box");
        await expect
          .poll(() => box.evaluate((el) => getComputedStyle(el).transform))
          .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
        const r = await box.evaluate((el) => ({ r: el.getBoundingClientRect().right, vw: innerWidth }));
        expect(r.r).toBe(r.vw);
      });

      test("a plain modal is unchanged: centred, no transform", async ({ page }) => {
        await page.locator("#open-modal").click();
        const t = await page.locator("#demo-modal .ui-modal-box").evaluate((el) => getComputedStyle(el).transform);
        expect(t).toBe("none");
      });
    });
  }
}
