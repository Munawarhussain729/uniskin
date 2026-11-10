import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/** ui-avatar, ui-skeleton, ui-separator (roadmap 0.8.0): geometry and motion. */
for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
      });

      test("avatar sizes are square circles in three steps", async ({ page }) => {
        const sizes = await page.locator("#small-demo .ui-avatar").evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { w: r.width, h: r.height, radius: getComputedStyle(el).borderRadius, cls: el.className };
          }),
        );
        for (const s of sizes) {
          expect(s.w, s.cls).toBe(s.h);
          expect(parseFloat(s.radius), s.cls).toBeGreaterThan(100);
        }
        const by = (c: string) => sizes.find((s) => s.cls === c)!.w;
        expect(by("ui-avatar ui-sm")).toBeLessThan(by("ui-avatar"));
        expect(by("ui-avatar")).toBeLessThan(by("ui-avatar ui-lg"));
      });

      test("an avatar image fills the circle", async ({ page }) => {
        const [a, i] = await page.locator("#avatar-img").evaluate((el) => [
          el.getBoundingClientRect().width,
          el.querySelector("img")!.getBoundingClientRect().width,
        ]);
        expect(i).toBe(a - 2);
      });

      test("avatar initials are legible (>= 4.5:1) on solid and soft fills", async ({ page }) => {
        // upstream palette values (docs/qa/a11y-2026-11.md), asserted exactly
        const KNOWN: Record<string, string[]> = {
          "shadcn/light": ["ui-avatar ui-danger 3.60"],
          "daisyui/light": ["ui-avatar ui-soft ui-danger 4.47"],
          "daisyui/dark": ["ui-avatar ui-primary 4.13", "ui-avatar ui-soft ui-primary 4.18"],
        };
        const bad = await page.locator("#small-demo .ui-avatar:not(.ui-outline)").evaluateAll((els) => {
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
          const rgb = (c: string) => {
            ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
          };
          const lum = (c: number[]) => {
            const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          return els
            .filter((el) => !el.querySelector("img"))
            .map((el) => {
              const cs = getComputedStyle(el);
              const [hi, lo] = [lum(rgb(cs.color)), lum(rgb(cs.backgroundColor))].sort((x, y) => y - x);
              return { cls: el.className, ratio: (hi + 0.05) / (lo + 0.05) };
            })
            .filter((r) => r.ratio < 4.5)
            .map((r) => `${r.cls} ${r.ratio.toFixed(2)}`);
        });
        expect(bad).toEqual(KNOWN[`${adapter}/${mode}`] ?? []);
      });

      test("the separator is a 1px rule, horizontal and vertical", async ({ page }) => {
        const h = await page.locator("hr.ui-separator").evaluate((el) => el.getBoundingClientRect().height);
        expect(h).toBe(1);
        const v = await page.locator('.ui-separator[aria-orientation="vertical"]').evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height };
        });
        expect(v.w).toBe(1);
        expect(v.h).toBeGreaterThan(10);
      });

      test("the skeleton shows a visible block", async ({ page }) => {
        const bg = await page.locator("#skeleton-demo .ui-skeleton").first().evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgba(0, 0, 0, 0)");
      });
    });
  }
}
