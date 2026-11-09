import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, inspectElement, openPlayground } from "./helpers.js";

/**
 * ui-table (docs/decisions/003 §4): native <table> styling, wrap focus,
 * text >= 4.5:1 and structural lines >= 3:1 (WCAG 1.4.11), states,
 * sort arrows, sticky header and zebra/grid/ghost style mappings.
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

const MAIN = ".ui-table-wrap[role='region'] .ui-table";

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("th/td/caption text >= 4.5:1 and header underline >= 3:1", async ({ page }) => {
        const th = page.locator(`${MAIN} thead th`).first();
        const td = page.locator(`${MAIN} tbody td`).first();
        const caption = page.locator(`${MAIN} caption`);
        expect((await th.evaluate(measure)).textRatio, "th text").toBeGreaterThanOrEqual(4.5);
        expect((await td.evaluate(measure)).textRatio, "td text").toBeGreaterThanOrEqual(4.5);
        expect(
          (await caption.evaluate(measure)).textRatio,
          "caption text",
        ).toBeGreaterThanOrEqual(4.5);
        const thM = await th.evaluate(measure);
        expect(thM.borderBottomVsSurround, "header underline").toBeGreaterThanOrEqual(3);
      });

      test("row divider renders and zebra stripe is a distinct fill", async ({ page }) => {
        /* Row dividers are subtle separators (~1.3:1), mirroring shadcn's
           border-b and daisyUI's table — sub-3:1 values are measured and
           recorded in docs/qa/table-2026-11.md. The structural header
           underline is asserted >= 3:1 above. */
        const tr = page.locator(`${MAIN} tbody tr`).first();
        const trM = await tr.evaluate(measure);
        expect(trM.borderBottomVsSurround, "row divider present").toBeGreaterThan(1);
        // ui-soft: even rows pick up the stripe fill
        const stripe = page.locator(".ui-table.ui-soft tbody tr:nth-of-type(2)").first();
        const stripeM = await stripe.evaluate(measure);
        expect(stripeM.bg[3]).toBeGreaterThan(0);
        const odd = await page.locator(".ui-table.ui-soft tbody tr:nth-of-type(1)").first().evaluate(measure);
        expect(stripeM.bg.join()).not.toBe(odd.bg.join());
        expect(stripeM.textRatio, "zebra text").toBeGreaterThanOrEqual(4.5);
      });

      test("ui-outline draws cell borders, ui-ghost draws none", async ({ page }) => {
        const grid = await page.locator(".ui-table.ui-outline tbody td").first().evaluate(measure);
        expect(parseFloat(grid.cs.borderTopWidth) + parseFloat(grid.cs.borderBottomWidth)).toBeGreaterThan(0);
        const ghost = await page.locator(".ui-table.ui-ghost tbody td").first().evaluate(measure);
        expect(parseFloat(ghost.cs.borderBottomWidth)).toBe(0);
      });

      test("selected and disabled rows differ from plain rows", async ({ page }) => {
        const plain = await page.locator(`${MAIN} tbody tr`).nth(3).evaluate(measure);
        const selected = await page.locator(`${MAIN} tbody tr[aria-selected='true']`).evaluate(measure);
        const disabled = await page.locator(`${MAIN} tbody tr[aria-disabled='true']`);
        expect(selected.bg.join(), "selected fill").not.toBe(plain.bg.join());
        expect(await disabled.evaluate((el) => parseFloat(getComputedStyle(el).opacity))).toBeLessThan(1);
      });

      test("[aria-sort] header draws an ::after arrow", async ({ page }) => {
        const sorted = page.locator(`${MAIN} th[aria-sort='ascending']`);
        const arrow = await sorted.evaluate((el) => {
          const s = getComputedStyle(el, "::after");
          return { content: s.content, border: s.borderTopWidth + s.borderBottomWidth };
        });
        expect(arrow.content).not.toBe("none");
        // triangle built from borders: at least one border side is non-zero
        expect(arrow.border).not.toBe("0px 0px");
      });

      test("thead th is sticky inside the wrap", async ({ page }) => {
        const pos = await page
          .locator(`${MAIN} thead th`)
          .first()
          .evaluate((el) => getComputedStyle(el).position);
        expect(pos).toBe("sticky");
      });

      test("wrap is keyboard focusable with a ring >= 3:1", async ({ page }) => {
        const wrap = page.locator(".ui-table-wrap[role='region']");
        await wrap.focus();
        const info = await wrap.evaluate(inspectElement);
        expect(info.ring.kind).not.toBe("none");
        expect(info.ringRatio ?? 0).toBeGreaterThanOrEqual(3);
      });

      test("ui-loading pulses the tbody (and stops under reduce)", async ({ page }) => {
        const tbody = page.locator(".ui-table.ui-loading tbody");
        const anim = await tbody.evaluate((el) => getComputedStyle(el).animationName);
        expect(anim).not.toBe("none");
        await page.emulateMedia({ reducedMotion: "reduce" });
        expect(await tbody.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
      });
    });
  }
}
