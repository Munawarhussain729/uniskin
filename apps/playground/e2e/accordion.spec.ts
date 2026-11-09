import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-accordion (roadmap 0.5.0, ADR-003 section 8): native <details>/<summary>.
 * The browser owns open/close and the keyboard; these tests pin what Uniskin
 * adds: text >= 4.5:1 closed and open, the chevron, the style mappings and
 * that Enter and Space toggle the native control.
 */

/** Resolved-color measurement for borders/backgrounds (canvas resolves oklch/color-mix). */
function measure(el: Element) {
  const doc = el.ownerDocument;
  const ctx = doc.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const rgba = (css: string): number[] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3]));
  // backdrop compositing from el upward until an opaque layer
  const composited = (from: Element | null, extra?: number[]): number[] => {
    const layers: number[][] = extra ? [extra] : [];
    for (let n = from; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let acc = [255, 255, 255];
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
  const surround = composited(el.parentElement);
  const own = composited(el);
  const text = rgba(cs.color);
  return {
    textRatio: ratio(text, own),
    borderTopVsSurround: ratio(over(rgba(cs.borderTopColor), surround), surround),
    borderBottomVsSurround: ratio(over(rgba(cs.borderBottomColor), surround), surround),
    bg: rgba(cs.backgroundColor),
    own,
    cs: { position: cs.position, borderTopWidth: cs.borderTopWidth, borderBottomWidth: cs.borderBottomWidth },
  };
}

const MAIN = "#acc-main";

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
      });

      test("trigger and panel text >= 4.5:1, closed and open", async ({ page }) => {
        const open = page.locator(`${MAIN} .ui-accordion-item[open] > .ui-accordion-trigger`).first();
        const closed = page.locator(`${MAIN} .ui-accordion-item:not([open]) > .ui-accordion-trigger`).first();
        const panel = page.locator(`${MAIN} .ui-accordion-item[open] > .ui-accordion-panel`).first();
        expect((await open.evaluate(measure)).textRatio, "open trigger").toBeGreaterThanOrEqual(4.5);
        expect((await closed.evaluate(measure)).textRatio, "closed trigger").toBeGreaterThanOrEqual(4.5);
        expect((await panel.evaluate(measure)).textRatio, "panel").toBeGreaterThanOrEqual(4.5);
      });

      test("soft and intent variants keep the open trigger >= 4.5:1", async ({ page }) => {
        const triggers = page.locator(".ui-accordion[class*='ui-'] .ui-accordion-item[open] > .ui-accordion-trigger");
        const n = await triggers.count();
        expect(n).toBeGreaterThan(3);
        for (let i = 0; i < n; i++) {
          const m = await triggers.nth(i).evaluate(measure);
          expect(m.textRatio, `open trigger #${i}`).toBeGreaterThanOrEqual(4.5);
        }
      });

      test("open panels inside soft lists keep text >= 4.5:1", async ({ page }) => {
        const panels = page.locator(".ui-accordion.ui-soft .ui-accordion-item[open] > .ui-accordion-panel");
        const n = await panels.count();
        expect(n).toBeGreaterThan(1);
        for (let i = 0; i < n; i++) {
          const m = await panels.nth(i).evaluate(measure);
          expect(m.textRatio, `soft panel #${i}`).toBeGreaterThanOrEqual(4.5);
        }
      });

      test("Enter and Space toggle the native details", async ({ page }) => {
        // second item starts closed; address it by position, since a
        // :not([open]) locator would re-resolve to another item once opened
        const item = page.locator(`${MAIN} .ui-accordion-item`).nth(1);
        await expect(item).not.toHaveAttribute("open", "");
        const trigger = item.locator("summary");
        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(item).toHaveAttribute("open", "");
        await page.keyboard.press("Space");
        await expect(item).not.toHaveAttribute("open", "");
        await page.keyboard.press("Space");
        await expect(item).toHaveAttribute("open", "");
      });

      test("the chevron is drawn, and turns when open", async ({ page }) => {
        const info = async (sel: string) =>
          page.locator(sel).first().evaluate((el) => {
            const a = getComputedStyle(el, "::after");
            return { content: a.content, transform: a.transform, display: getComputedStyle(el).display };
          });
        const closed = await info(`${MAIN} .ui-accordion-item:not([open]) > .ui-accordion-trigger`);
        const open = await info(`${MAIN} .ui-accordion-item[open] > .ui-accordion-trigger`);
        expect(closed.content).not.toBe("none");
        expect(closed.transform).not.toBe("none");
        expect(open.transform).not.toBe(closed.transform);
      });

      test("the native marker is hidden", async ({ page }) => {
        const style = await page
          .locator(`${MAIN} .ui-accordion-trigger`)
          .first()
          .evaluate((el) => getComputedStyle(el).listStyleType);
        expect(style).toBe("none");
      });

      test("ui-outline draws bordered items, ui-ghost draws none", async ({ page }) => {
        const outline = await page
          .locator(".ui-accordion.ui-outline .ui-accordion-item")
          .first()
          .evaluate(measure);
        expect(parseFloat(outline.cs.borderTopWidth)).toBeGreaterThan(0);
        const ghost = await page.locator(".ui-accordion.ui-ghost").first().evaluate(measure);
        expect(parseFloat(ghost.cs.borderTopWidth)).toBe(0);
      });
    });
  }
}
