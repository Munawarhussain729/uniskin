// Screenshots one playground section in every skin x mode x width.
// Usage (preview server on :4199): PORT=4199 node scripts/qa-shots.mjs <selector> <outDir> [pad]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [selector, out, pad = "40"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const adapter of (process.env.ADAPTERS ?? "default,shadcn,daisyui").split(",")) {
  for (const mode of ["light", "dark"]) {
    for (const width of [360, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`http://localhost:${process.env.PORT ?? 4199}/?adapter=${adapter}&theme=${mode}`);
      await page.waitForLoadState("networkidle");
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
      const box = await page.locator(selector).evaluate((n) => {
        const r = n.getBoundingClientRect();
        return { y: r.top + globalThis.scrollY, height: r.height };
      });
      await page.screenshot({
        path: `${out}/${adapter}-${mode}-${width}.png`,
        fullPage: true,
        clip: { x: 0, y: Math.max(box.y - 50, 0), width, height: Math.min(box.height + 50 + Number(pad), 1200) },
      });
      await page.close();
    }
  }
}
await browser.close();
