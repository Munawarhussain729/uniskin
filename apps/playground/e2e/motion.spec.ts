import { expect, test } from "@playwright/test";
import { ADAPTERS, openPlayground } from "./helpers.js";

const running = (name: string, duration: string): boolean =>
  name !== "none" && duration.split(",").some((d) => parseFloat(d) > 0);

/**
 * The loading spinner (`::after`, `ui-spin`) and every `ui-pulse` animation
 * must stop under `prefers-reduced-motion: reduce` in all three skins
 * (fixed: `buildRules` adds a reduced-motion override wherever a rule
 * declares an `animation`). The list stays so a regression fails loudly.
 */
const EXPECTED_BROKEN: string[] = [];

test("loading spin/pulse under prefers-reduced-motion: reduce", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  const stillAnimating: string[] = [];
  const modalTransitionOK: string[] = [];

  for (const adapter of ADAPTERS) {
    await openPlayground(page, adapter, "light");

    const busy = page.locator("button.ui-loading, button[aria-busy='true']");
    const labels = ["button.ui-loading", "button[aria-busy='true']"];
    for (let i = 0; i < (await busy.count()); i++) {
      const info = await busy.nth(i).evaluate((el) => ({
        name: getComputedStyle(el).animationName,
        dur: getComputedStyle(el).animationDuration,
        afterName: getComputedStyle(el, "::after").animationName,
        afterDur: getComputedStyle(el, "::after").animationDuration,
      }));
      if (running(info.name, info.dur))
        stillAnimating.push(`${adapter} | ${labels[i] ?? i} | element`);
      if (running(info.afterName, info.afterDur))
        stillAnimating.push(`${adapter} | ${labels[i] ?? i} | ::after`);
    }

    // ui-table.ui-loading pulses its tbody — must stop under reduce
    const busyTbody = page.locator(".ui-table.ui-loading tbody, .ui-table[aria-busy='true'] tbody");
    for (let i = 0; i < (await busyTbody.count()); i++) {
      const info = await busyTbody.nth(i).evaluate((el) => ({
        name: getComputedStyle(el).animationName,
        dur: getComputedStyle(el).animationDuration,
      }));
      if (running(info.name, info.dur))
        stillAnimating.push(`${adapter} | ui-table tbody[${i}] | element`);
    }

    // ui-accordion: the open panel fades in and the trigger/chevron transition
    // — all of it must stop under reduce
    const openPanels = page.locator(".ui-accordion-item[open] > .ui-accordion-panel");
    for (let i = 0; i < (await openPanels.count()); i++) {
      const info = await openPanels.nth(i).evaluate((el) => ({
        name: getComputedStyle(el).animationName,
        dur: getComputedStyle(el).animationDuration,
      }));
      if (running(info.name, info.dur))
        stillAnimating.push(`${adapter} | ui-accordion-panel[${i}] | element`);
    }
    const triggers = page.locator(".ui-accordion-trigger");
    for (let i = 0; i < (await triggers.count()); i++) {
      const t = await triggers.nth(i).evaluate((el) => ({
        own: getComputedStyle(el).transitionProperty,
        after: getComputedStyle(el, "::after").transitionProperty,
      }));
      if (t.own !== "none") stillAnimating.push(`${adapter} | ui-accordion-trigger[${i}] | transition`);
      if (t.after !== "none") stillAnimating.push(`${adapter} | ui-accordion-trigger[${i}] | ::after transition`);
    }

    // ui-progress: the indeterminate slide must stop under reduce
    const indeterminate = page.locator(".ui-progress:indeterminate");
    for (let i = 0; i < (await indeterminate.count()); i++) {
      const info = await indeterminate.nth(i).evaluate((el) => ({
        name: getComputedStyle(el).animationName,
        dur: getComputedStyle(el).animationDuration,
      }));
      if (running(info.name, info.dur))
        stillAnimating.push(`${adapter} | ui-progress[${i}] | element`);
    }

    // positive control: the skin does honour reduced-motion for the modal fade
    const modalTransition = await page.locator("dialog.ui-modal").evaluate(
      (el) => getComputedStyle(el).transitionProperty,
    );
    if (modalTransition === "none") modalTransitionOK.push(adapter);
  }

  expect(modalTransitionOK).toEqual([...ADAPTERS]);
  expect(stillAnimating, "docs/qa/a11y-2026-11.md").toEqual(EXPECTED_BROKEN);
});
