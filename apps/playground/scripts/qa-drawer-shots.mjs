import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = "../../docs/qa/drawer"; mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const a of ["default","shadcn","daisyui"]) for (const m of ["light","dark"]) for (const w of [360,768,1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 640 } });
  await p.goto(`http://localhost:4199/?adapter=${a}&theme=${m}`); await p.waitForLoadState("networkidle");
  await p.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
  await p.locator('[data-drawer="end"]').click();
  await p.screenshot({ path: `${out}/${a}-${m}-${w}.png` }); await p.close();
}
await b.close();
