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

    // positive control: the skin does honour reduced-motion for the modal fade
    const modalTransition = await page.locator("dialog.ui-modal").evaluate(
      (el) => getComputedStyle(el).transitionProperty,
    );
    if (modalTransition === "none") modalTransitionOK.push(adapter);
  }

  expect(modalTransitionOK).toEqual([...ADAPTERS]);
  expect(stillAnimating, "docs/qa/a11y-2026-11.md").toEqual(EXPECTED_BROKEN);
});
