import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-dropdown / ui-menu / ui-menu-item (roadmap 0.7.0, ADR-003 section 7):
 * a CSS-only floating panel. Pins what Uniskin provides (closed until one of
 * the open mechanisms holds, placement, the item states, text contrast) and
 * runs the demo's own keyboard handler to prove the markup is operable.
 * The keyboard contract itself is the consumer's and is documented.
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


const shown = (el: Element) => {
  const cs = getComputedStyle(el);
  return cs.visibility === "visible" && cs.opacity === "1" && cs.display !== "none";
};

/**
 * Items under 4.5:1 that are the upstream palette itself (the same intent
 * text colour the badge, tab and tooltip tests already record; see
 * docs/qa/a11y-2026-11.md). Asserted exactly so a fix or a regression both fail.
 */
const KNOWN_LOW: Record<string, string[]> = {
  "daisyui/dark": ["ui-menu-item ui-primary rest 3.40", "ui-menu-item ui-primary hover 3.20"],
};

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
      });


      test("the panel is closed until an open mechanism holds", async ({ page }) => {
        const closed = await page.locator("#dd-live-menu").evaluate(shown);
        expect(closed, "closed panel").toBe(false);
        await expect.poll(() => page.locator("#dd-open-menu").evaluate(shown), "aria-expanded + ui-active").toBe(true);
        expect(await page.locator("#dd-details .ui-menu").evaluate(shown), "closed <details>").toBe(false);
        await page.locator("#dd-details summary").click();
        await expect.poll(() => page.locator("#dd-details .ui-menu").evaluate(shown), "open <details>").toBe(true);
      });

      test("aria-expanded alone opens the panel, and closed items are not tabbable", async ({ page }) => {
        await page.locator("#dd-live-trigger").evaluate((el) => el.setAttribute("aria-expanded", "true"));
        await expect.poll(() => page.locator("#dd-live-menu").evaluate(shown)).toBe(true);
        await page.locator("#dd-live-trigger").evaluate((el) => el.setAttribute("aria-expanded", "false"));
        await expect.poll(() => page.locator("#dd-live-menu").evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");
        await page.locator("#dd-live-trigger").focus();
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => document.activeElement?.closest("#dd-live-menu") !== null)).toBe(false);
      });

      test("placement: below by default, above for top-*, aligned to the end for *-end", async ({ page }) => {
        const box = async (sel: string) => page.locator(sel).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        });
        const bt = await box("#dd-open .ui-button"), bm = await box("#dd-open-menu");
        expect(bm.top).toBeGreaterThan(bt.bottom - 1);
        expect(Math.abs(bm.left - bt.left)).toBeLessThan(2);
        const tt = await box("#dd-top .ui-button"), tm = await box("#dd-top-menu");
        expect(tm.bottom).toBeLessThan(tt.top + 1);
        await page.locator("#dd-details summary").click();
        const dt = await box("#dd-details summary"), dm = await box("#dd-details .ui-menu");
        expect(Math.abs(dm.right - dt.right)).toBeLessThan(2);
      });

      test("an unfloated ui-menu is a plain in-flow list", async ({ page }) => {
        const pos = await page.locator("#menu-static").evaluate((el) => getComputedStyle(el).position);
        expect(pos).toBe("static");
        expect(await page.locator("#menu-static").evaluate(shown)).toBe(true);
      });

      test("the demo handler: open, arrows wrap, Home/End, Escape returns focus", async ({ page }) => {
        const trigger = page.locator("#dd-live-trigger");
        await trigger.click();
        const label = () => page.evaluate(() => document.activeElement?.textContent);
        expect(await label()).toBe("Rename");
        await page.keyboard.press("ArrowDown");
        expect(await label()).toBe("Duplicate");
        await page.keyboard.press("ArrowDown"); // Archive is aria-disabled: skipped
        expect(await label()).toBe("Delete");
        await page.keyboard.press("ArrowDown");
        expect(await label()).toBe("Rename");
        await page.keyboard.press("End");
        expect(await label()).toBe("Delete");
        await page.keyboard.press("Home");
        expect(await label()).toBe("Rename");
        await page.keyboard.press("Escape");
        await expect(trigger).toBeFocused();
        await expect.poll(() => page.locator("#dd-live-menu").evaluate(shown)).toBe(false);
      });

      test("the focused item shows a visible ring and a tint", async ({ page }) => {
        await page.locator("#dd-live-trigger").focus();
        await page.keyboard.press("Enter");
        const item = page.locator("#dd-live-menu .ui-menu-item").first();
        await expect(item).toBeFocused();
        // the tint fades in over 0.15s, so wait for it rather than sample mid-transition
        await expect.poll(() => item.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
        const ring = await item.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { outline: cs.outlineStyle, width: cs.outlineWidth };
        });
        expect(ring.outline).not.toBe("none");
        expect(parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
      });

      test("a disabled item takes no pointer and is dimmed", async ({ page }) => {
        const cs = await page.locator("#dd-live-menu .ui-disabled").evaluate((el) => {
          const s = getComputedStyle(el);
          return { events: s.pointerEvents, opacity: s.opacity };
        });
        expect(cs.events).toBe("none");
        expect(Number(cs.opacity)).toBeLessThan(1);
      });

      test("a checked item shows a trailing mark that is not in its accessible name", async ({ page }) => {
        const after = await page
          .locator('#dd-top-menu [aria-checked="true"]')
          .evaluate((el) => getComputedStyle(el, "::after").content);
        expect(after).toContain("\u2713");
        const none = await page
          .locator('#dd-top-menu [aria-checked="false"]')
          .evaluate((el) => getComputedStyle(el, "::after").content);
        expect(none === "none" || none === "normal").toBe(true);
      });

      test("item text contrast is at least 4.5:1 (open demo menus, hovered and resting)", async ({ page }) => {
        // hover tints fade in; sample the settled colours, not a frame in the middle
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
        const bad: string[] = [];
        const items = page.locator("#dd-open-menu .ui-menu-item, #dd-top-menu .ui-menu-item, #menu-static .ui-menu-item, #menu-soft .ui-menu-item");
        for (let i = 0; i < (await items.count()); i++) {
          const it = items.nth(i);
          const rest = await it.evaluate(textRatio);
          await it.hover();
          const hov = await it.evaluate(textRatio);
          const cls = await it.evaluate((el) => el.className);
          for (const [state, r] of [["rest", rest], ["hover", hov]] as const)
            if (r < 4.5) bad.push(`${cls} ${state} ${r.toFixed(2)}`);
        }
        expect(bad, "items under 4.5:1").toEqual(KNOWN_LOW[`${adapter}/${mode}`] ?? []);
      });
    });
  }
}
