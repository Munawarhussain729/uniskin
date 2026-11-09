// Screenshots the ui-field playground section in every skin x mode.
// Usage (preview server on :4199): PORT=4199 node scripts/qa-field-shots.mjs <outDir>
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "../../docs/qa/field";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const adapter of ["default", "shadcn", "daisyui"]) {
  for (const mode of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${process.env.PORT ?? 4199}/?adapter=${adapter}&theme=${mode}`);
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
    const el = page.locator("#field-section");
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${out}/field-${adapter}-${mode}.png` });
    await page.close();
  }
}
await browser.close();
