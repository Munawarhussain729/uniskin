import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-progress (roadmap 0.5.0): native <progress>. The bar and the track
 * are non-text graphics that carry the meaning, so the bar must keep 3:1
 * (WCAG 1.4.11) against the track, or against the page for ui-ghost.
 */

function ratios(el: Element) {
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
  const surface = (() => {
    let acc = [255, 255, 255];
    const layers: number[][] = [];
    for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    for (const l of layers.reverse()) acc = over(l, acc);
    return acc;
  })();
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
  const bar = rgba(cs.color);
  const trackRaw = rgba(cs.backgroundColor);
  const track = over(trackRaw, surface);
  return {
    barVsTrack: ratio(bar, track),
    barVsSurface: ratio(bar, surface),
    trackAlpha: trackRaw[3],
    height: parseFloat(cs.height),
  };
}

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("the bar keeps >= 3:1 against its track, for every intent", async ({ page }) => {
        const bars = page.locator("progress.ui-progress[value]:not(.ui-ghost)");
        const n = await bars.count();
        expect(n).toBeGreaterThan(5);
        for (let i = 0; i < n; i++) {
          const r = await bars.nth(i).evaluate(ratios);
          const cls = await bars.nth(i).getAttribute("class");
          expect(r.barVsTrack, `bar vs track (${cls})`).toBeGreaterThanOrEqual(3);
        }
      });

      test("ui-ghost has no track fill and the bar keeps >= 3:1 against the page", async ({ page }) => {
        const r = await page.locator("progress.ui-progress.ui-ghost").first().evaluate(ratios);
        expect(r.trackAlpha).toBe(0);
        expect(r.barVsSurface).toBeGreaterThanOrEqual(3);
      });

      test("sizes change the height", async ({ page }) => {
        const h = async (sel: string) => (await page.locator(sel).first().evaluate(ratios)).height;
        const sm = await h("progress.ui-progress.ui-sm");
        const md = await h("#prog-main");
        const lg = await h("progress.ui-progress.ui-lg");
        expect(sm).toBeLessThan(md);
        expect(md).toBeLessThan(lg);
      });

      test("an indeterminate progress animates, and is still a progress element", async ({ page }) => {
        const info = await page.locator("#prog-busy").evaluate((el) => ({
          matches: el.matches(":indeterminate"),
          anim: getComputedStyle(el).animationName,
          value: (el as HTMLProgressElement).value,
        }));
        expect(info.matches).toBe(true);
        expect(info.anim).toContain("progress-slide");
      });

      test("exposes the progressbar role with its value to assistive tech", async ({ page }) => {
        const bar = page.getByRole("progressbar", { name: "Upload progress" });
        await expect(bar).toHaveAttribute("value", "60");
      });
    });
  }
}
