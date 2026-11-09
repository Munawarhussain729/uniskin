import { expect, test } from "@playwright/test";

const PRIMARY_HEX = '[data-path="intents.primary.fill"].cf-hex';

test.beforeEach(async ({ page }) => {
  await page.goto("/builder/");
  await expect(page.locator("#out")).toContainText("defineAdapter");
});

test("starts clean: default state passes every contrast check", async ({ page }) => {
  await expect(page.locator("#audit")).toHaveAttribute("data-state", "pass");
  await expect(page.locator(".chk[data-state='fail']")).toHaveCount(0);
});

test("hex edits drive the live preview and flag low contrast, Fix repairs it by keyboard", async ({ page }) => {
  const hex = page.locator(PRIMARY_HEX);
  await hex.fill("#ffeb3b");
  await page.locator('[data-auto="primary"]').check();

  // preview iframe picked up the token
  const frame = page.frameLocator("#preview");
  await expect
    .poll(() =>
      frame.locator("html").evaluate((el) => getComputedStyle(el).getPropertyValue("--ui-primary").trim()),
    )
    .toBe("#ffeb3b");

  // "As text" check on a pale yellow fails and is announced
  await expect(page.locator("#audit")).toHaveAttribute("data-state", "fail");
  const chip = page.locator('[data-check="text:primary"]');
  await expect(chip).toHaveAttribute("data-state", "fail");
  await expect(chip).toHaveAttribute("aria-label", /fails, needs 4\.5:1/);

  // operate the Fix button with the keyboard only
  const fix = chip.locator(".fix");
  await fix.focus();
  await page.keyboard.press("Enter");
  await expect(chip).toHaveAttribute("data-state", "pass");

  // a pale fill can leave other checks failing; "Fix all" repairs the rest
  if ((await page.locator("#audit").getAttribute("data-state")) === "fail") {
    await page.locator("#fix-all").focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.locator("#audit")).toHaveAttribute("data-state", "pass");
});

test("invalid hex is rejected without touching the state", async ({ page }) => {
  const hex = page.locator(PRIMARY_HEX);
  const before = await hex.inputValue();
  await hex.fill("#zzz");
  await expect(hex).toHaveAttribute("aria-invalid", "true");
  await hex.blur();
  await expect(hex).toHaveValue(before);
  await expect(hex).not.toHaveAttribute("aria-invalid", "true");
});

test("mode radiogroup is arrow-key operable and edits dark values", async ({ page }) => {
  const light = page.locator('#mode [data-mode="light"]');
  await light.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('#mode [data-mode="dark"]')).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#mode-tag")).toContainText("dark");
  await expect(page.frameLocator("#preview").locator("html")).toHaveClass(/dark/);
});

test("keyboard focus is visible on builder controls", async ({ page }) => {
  await page.locator("#name").focus();
  await page.keyboard.press("Tab"); // moves into the next control via keyboard
  const info = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const cs = getComputedStyle(el);
    return { match: el.matches(":focus-visible"), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(info.match).toBe(true);
  expect(info.style).not.toBe("none");
  expect(info.width).toBeGreaterThan(0);
});

test("respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dur = await page
    .locator(".preset")
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(dur).toBe("0s");
});

test("exports an adapter file and CSS variables that contain the edits", async ({ page }) => {
  await page.locator(PRIMARY_HEX).fill("#0b7285");
  await page.locator('[data-auto="primary"]').check();
  await page.locator("#radius").fill("1");

  await expect(page.locator("#out")).toContainText('"--ui-primary": "#0b7285"');
  await expect(page.locator("#out")).toContainText('"--ui-radius": "1rem"');
  await expect(page.locator("#out")).toContainText('"darkTokens"');

  const download = page.waitForEvent("download");
  await page.locator("#download").click();
  expect((await download).suggestedFilename()).toBe("my-skin.mjs");

  // tablist: arrow keys move between formats
  await page.locator("#tab-mjs").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-ts")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-css")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#out")).toContainText("--ui-primary: #0b7285;");
  await expect(page.locator("#out")).toContainText("prefers-color-scheme: dark");
});

test("fits at 360px without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
