// Screenshots the ui-menu playground section in every skin x mode x width.
// Usage (preview server on :4199): PORT=4199 node scripts/qa-menu-shots.mjs <outDir>
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "../../docs/qa/menu";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const adapter of ["default", "shadcn", "daisyui"]) {
  for (const mode of ["light", "dark"]) {
    for (const width of [360, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`http://localhost:${process.env.PORT ?? 4199}/?adapter=${adapter}&theme=${mode}`);
      await page.waitForLoadState("networkidle");
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      await page.locator("#dd-details").evaluate((d) => (d.open = true));
      const el = page.locator("#menu-demo");
      const box = await el.evaluate((n) => {
        const r = n.getBoundingClientRect();
        return { y: r.top + globalThis.scrollY, height: r.height };
      });
      await page.screenshot({
        path: `${out}/${adapter}-${mode}-${width}.png`,
        fullPage: true,
        clip: { x: 0, y: Math.max(box.y - 60, 0), width, height: Math.min(box.height + 330, 1100) },
      });
      await page.close();
    }
  }
}
await browser.close();
