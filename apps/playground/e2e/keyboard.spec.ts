import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, inspectElement, openPlayground } from "./helpers.js";

const FOCUSABLE = [
  "button:not([disabled])",
  "a[href]",
  // native radios: Tab only enters a group once, at the checked radio —
  // the others are reached with arrow keys (asserted separately below)
  "input:not([disabled]):not([type='radio'])",
  "input[type='radio']:checked:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[role='tab']:not([disabled])",
  "[role='switch']:not([disabled]):not([aria-disabled='true'])",
].join(",");

const DISABLED_LOOKING = '.ui-disabled, :disabled, [aria-disabled="true"]';

/**
 * Known focus-ring defects (ring < 3:1 or invisible) — each maps to an entry
 * in docs/qa/a11y-2026-11.md. When a skin is fixed the list shrinks, this
 * test fails, and both must be updated. Keys: adapter/mode.
 */
const KNOWN_RING_DEFECTS: Record<string, string[]> = {
  "default/light": [],
  "shadcn/light": [],
  "daisyui/light": [],
  "daisyui/dark": [],
};
KNOWN_RING_DEFECTS["default/dark"] = KNOWN_RING_DEFECTS["default/light"];
KNOWN_RING_DEFECTS["shadcn/dark"] = KNOWN_RING_DEFECTS["shadcn/light"];

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test(`${adapter}/${mode}: Tab reaches every interactive element with a visible focus ring`, async ({
      page,
    }) => {
      await openPlayground(page, adapter, mode);
      // settle focus-ring transitions so computed styles are the final state
      await page.addStyleTag({
        content: "*,*::before,*::after{transition:none!important}",
      });

      const count = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)].filter(
          (el) => (el as HTMLElement).checkVisibility({ checkVisibilityCSS: true }),
        );
        els.forEach((el, i) => el.setAttribute("data-kbd-i", String(i)));
        return els.length;
      }, FOCUSABLE);

      const seen = new Set<number>();
      const failures: string[] = [];
      const badRings: string[] = [];

      // count + 2 wraps past the end so every element is offered focus once.
      for (let i = 0; i < count + 2; i++) {
        await page.keyboard.press("Tab");
        const handle = await page.evaluateHandle(() => document.activeElement);
        const idx = await handle.evaluate((el) =>
          el instanceof Element ? el.getAttribute("data-kbd-i") : null,
        );
        if (idx === null) {
          await handle.dispose();
          continue;
        }
        if (!seen.has(Number(idx))) {
          seen.add(Number(idx));
          const info = await handle.evaluate(inspectElement);
          if (info.ring.kind === "none" || (info.ringRatio ?? 0) < 3)
            badRings.push(
              `${info.descriptor}  [${info.ring.kind} ${info.ring.color} ` +
                `on ${info.background} = ${info.ringRatio?.toFixed(2) ?? "?"}:1]`,
            );
          const disabled = await handle.evaluate(
            (el, sel) => ({
              looks: !!el && el.matches(sel),
              announced:
                !!el &&
                (el.matches(":disabled") ||
                  el.getAttribute("aria-disabled") === "true"),
            }),
            DISABLED_LOOKING,
          );
          if (disabled.looks && !disabled.announced)
            failures.push(
              `disabled-looking but not announced: ${info.descriptor}`,
            );
        }
        await handle.dispose();
      }

      if (count - seen.size > 0)
        failures.push(
          `${count - seen.size} interactive element(s) never received focus`,
        );
      expect(failures).toEqual([]);
      expect(
        badRings.map((b) => b.split("  [")[0]),
        `focus rings < 3:1 (docs/qa/a11y-2026-11.md):\n${badRings.join("\n")}`,
      ).toEqual(KNOWN_RING_DEFECTS[`${adapter}/${mode}`] ?? []);
    });
  }

  test(`${adapter}: radio group follows native keyboard behaviour`, async ({ page }) => {
    await openPlayground(page, adapter, "light");
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
    const radios = page.locator("#radio-plan input[type='radio']");
    await radios.nth(0).focus();
    await expect(radios.nth(0)).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeFocused();
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(0)).not.toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(radios.nth(2)).toBeChecked();
    // wraps around
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(0)).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(radios.nth(2)).toBeChecked();
    // one tab stop in the group: Tab leaves it
    await page.keyboard.press("Tab");
    const stillInGroup = await page.evaluate(
      () => !!document.activeElement?.closest("#radio-plan"),
    );
    expect(stillInGroup).toBe(false);
    // Shift+Tab returns to the checked radio, not the first
    await page.keyboard.press("Shift+Tab");
    await expect(radios.nth(2)).toBeFocused();
    // disabled radios are natively unfocusable and announced as disabled
    const disabled = page.locator("input.ui-radio[disabled]");
    expect(await disabled.count()).toBeGreaterThan(0);
    for (const el of await disabled.all()) await expect(el).toBeDisabled();
  });

  test(`${adapter}: busy buttons keep a readable label`, async ({ page }) => {
    await openPlayground(page, adapter, "light");

    const bad: string[] = [];
    const busy = page.locator("button.ui-loading, button[aria-busy='true']");
    for (let i = 0; i < (await busy.count()); i++) {
      const btn = busy.nth(i);
      const info = await btn.evaluate(inspectElement);
      const name = (await btn.evaluate((el) => (el.textContent ?? "").trim()))
        .length;
      if (name === 0) bad.push(`${info.descriptor}: no accessible name`);
      if ((info.textRatio ?? 0) < 4.5)
        bad.push(
          `${info.descriptor}: label ${info.textRatio?.toFixed(2) ?? "?"}:1 ` +
            `on ${info.elementBg}`,
        );
    }
    expect(bad, "docs/qa/a11y-2026-11.md").toEqual(
      adapter === "daisyui"
        ? [
            'button.ui-button.ui-secondary.ui-loading ".ui-loading": label 3.04:1 on oklch(0.65 0.241 354.308)',
            'button.ui-button.ui-secondary "aria-busy": label 3.04:1 on oklch(0.65 0.241 354.308)',
          ]
        : [],
    );
  });

  test(`${adapter}: tabs and modal use the documented ARIA`, async ({ page }) => {
    await openPlayground(page, adapter, "light");

    const tabIssues = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll(".ui-tabs").forEach((list, li) => {
        if (list.getAttribute("role") !== "tablist")
          issues.push(`ui-tabs[${li}] missing role=tablist`);
        const tabs = list.querySelectorAll(".ui-tab");
        if (![...tabs].some((t) => t.getAttribute("aria-selected") === "true"))
          issues.push(`ui-tabs[${li}] has no selected tab`);
        tabs.forEach((t, ti) => {
          if (t.getAttribute("role") !== "tab")
            issues.push(`ui-tabs[${li}] .ui-tab[${ti}] missing role=tab`);
          if (!["true", "false"].includes(t.getAttribute("aria-selected") ?? ""))
            issues.push(`ui-tabs[${li}] .ui-tab[${ti}] missing aria-selected`);
        });
      });
      return issues;
    });
    expect(tabIssues).toEqual([]);

    // modal is a real <dialog> opened with showModal(); Esc closes it.
    const modal = page.locator("dialog.ui-modal#demo-modal");
    await expect(modal).toHaveAttribute("aria-label", "Delete project");
    await page.locator("#open-modal").click();
    await expect(modal).toBeVisible();
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector("dialog.ui-modal");
      return (
        document.activeElement === d || !!d?.contains(document.activeElement)
      );
    });
    expect(focusInside, "focus must be inside the open dialog").toBe(true);
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    const restored = await page.evaluate(
      () => document.activeElement?.id === "open-modal",
    );
    expect(restored, "focus returns to the opener on close").toBe(true);
  });
}
