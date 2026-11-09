import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * ui-toast / ui-toast-region (roadmap 0.6.0, ADR-003 section 6): a fixed
 * stacking region and the messages in it. Pins the placement, the
 * click-through region, insertion into a persistent live region and the
 * text contrast. What CSS cannot do (timers, removal, announcing) is the
 * consumer's and is documented, not tested.
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

/**
 * Toasts under 4.5:1 that are the upstream palette itself (see
 * docs/qa/a11y-2026-11.md); asserted exactly so a fix or a regression both
 * fail. Details in docs/qa/toast-2026-11.md.
 */
const KNOWN_LOW: Record<string, string[]> = {
  "shadcn/light": ["ui-danger"],
  "daisyui/light": ["ui-soft ui-danger"],
  "daisyui/dark": ["ui-primary", "ui-loading ui-primary"],
};

const PLACEMENTS = [
  "top-start",
  "top-center",
  "top-end",
  "bottom-start",
  "bottom-center",
  "bottom-end",
] as const;

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test.describe(`${adapter}/${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await openPlayground(page, adapter, mode);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      });

      test("data-placement pins the region to the named corner or edge", async ({ page }) => {
        for (const placement of PLACEMENTS) {
          const r = await page.evaluate((pl) => {
            const reg = document.createElement("div");
            reg.className = "ui-toast-region";
            reg.setAttribute("data-placement", pl);
            reg.innerHTML = '<div class="ui-toast">x</div>';
            document.body.appendChild(reg);
            const b = reg.getBoundingClientRect();
            const out = { l: b.left, t: b.top, r: b.right, b: b.bottom, w: innerWidth, h: innerHeight };
            reg.remove();
            return out;
          }, placement);
          const [v, h] = placement.split("-");
          if (v === "top") expect(r.t, placement).toBeLessThanOrEqual(1);
          else expect(r.h - r.b, placement).toBeLessThanOrEqual(1);
          if (h === "start") expect(r.l, placement).toBeLessThanOrEqual(1);
          else if (h === "end") expect(r.w - r.r, placement).toBeLessThanOrEqual(1);
          else expect(Math.abs((r.l + r.r) / 2 - r.w / 2), placement).toBeLessThanOrEqual(1);
        }
      });

      test("the default placement is bottom-end, and RTL flips start and end", async ({ page }) => {
        const place = (attr: string | null) =>
          page.evaluate((pl) => {
            const reg = document.createElement("div");
            reg.className = "ui-toast-region";
            if (pl) reg.setAttribute("data-placement", pl);
            reg.innerHTML = '<div class="ui-toast">x</div>';
            document.body.appendChild(reg);
            const b = reg.getBoundingClientRect();
            const out = { l: b.left, r: b.right, w: innerWidth };
            reg.remove();
            return out;
          }, attr);
        const dflt = await place(null);
        expect(dflt.w - dflt.r).toBeLessThanOrEqual(1);
        await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
        const endRtl = await place("bottom-end");
        expect(endRtl.l).toBeLessThanOrEqual(1); // end is the left edge in RTL
        const startRtl = await place("bottom-start");
        expect(startRtl.w - startRtl.r).toBeLessThanOrEqual(1);
      });

      test("the region does not block the page, but a toast takes the pointer", async ({ page }) => {
        const r = await page.evaluate(() => {
          const reg = document.createElement("div");
          reg.className = "ui-toast-region";
          reg.id = "t-reg";
          reg.innerHTML = '<div class="ui-toast" id="t-toast">hello</div>';
          document.body.appendChild(reg);
          const rb = reg.getBoundingClientRect();
          const tb = document.getElementById("t-toast")!.getBoundingClientRect();
          // a point inside the region's padding, outside the toast
          const empty = document.elementFromPoint(rb.left + 4, rb.top + 4);
          const onToast = document.elementFromPoint(tb.left + tb.width / 2, tb.top + tb.height / 2);
          const out = {
            regionPe: getComputedStyle(reg).pointerEvents,
            toastPe: getComputedStyle(document.getElementById("t-toast")!).pointerEvents,
            emptyIsRegion: !!empty && reg.contains(empty),
            onToastInside: !!onToast && document.getElementById("t-toast")!.contains(onToast),
          };
          reg.remove();
          return out;
        });
        expect(r.regionPe).toBe("none");
        expect(r.toastPe).toBe("auto");
        expect(r.emptyIsRegion).toBe(false);
        expect(r.onToastInside).toBe(true);
      });

      test("a toast inserted into the persistent live region appears, and its dismiss removes it", async ({ page }) => {
        const status = page.locator("#toast-live-status");
        await expect(status).toHaveAttribute("role", "status");
        await expect(status.locator(".ui-toast")).toHaveCount(0);
        await page.locator("#toast-show").click();
        const toast = status.locator(".ui-toast").first();
        await expect(toast).toBeVisible();
        await expect(toast).toContainText("Saved (1)");
        await toast.getByRole("button", { name: "Dismiss" }).click();
        await expect(status.locator(".ui-toast")).toHaveCount(0);
      });

      test("[hidden] removes a toast", async ({ page }) => {
        const t = page.locator("#toast-static .ui-toast").first();
        await t.evaluate((el) => el.setAttribute("hidden", ""));
        expect(await t.evaluate((el) => getComputedStyle(el).display)).toBe("none");
      });

      test("the neutral toast keeps a visible edge", async ({ page }) => {
        const w = await page
          .locator("#toast-static .ui-toast")
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
        expect(w).toBeGreaterThan(0);
      });

      test("toast text >= 4.5:1, except the recorded upstream palette values", async ({ page }) => {
        const toasts = page.locator("#toast-static .ui-toast");
        const n = await toasts.count();
        expect(n).toBe(11);
        const low: string[] = [];
        for (let i = 0; i < n; i++) {
          if ((await textRatio_(toasts.nth(i))) < 4.5) {
            const cls = ((await toasts.nth(i).getAttribute("class")) ?? "").replace("ui-toast", "").trim();
            low.push(cls);
          }
        }
        expect(low.sort(), "toasts under 4.5:1").toEqual((KNOWN_LOW[`${adapter}/${mode}`] ?? []).slice().sort());
      });
    });
  }
}

async function textRatio_(loc: import("@playwright/test").Locator): Promise<number> {
  return loc.evaluate(textRatio);
}
