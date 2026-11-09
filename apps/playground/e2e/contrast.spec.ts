import { expect, test } from "@playwright/test";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

/**
 * Non-text contrast (WCAG 1.4.11, >= 3:1) for the intent x style palette of
 * the form controls, in every skin and mode. Recorded in
 * docs/qa/palette-contrast-2026-11.md.
 *
 * Not asserted (design decisions, listed in that doc): the `ui-ghost` style
 * (no boundary by design), shadcn `ui-secondary` (a near-white tint), and the
 * neutral field border of the default and shadcn skins.
 */

const INTENTS = ["primary", "success", "warning", "danger"];
const STYLES = ["", "ui-outline", "ui-soft"];

/** Runs in the browser: resolved colours via canvas, so oklch()/color-mix() work. */
function measure(el: Element) {
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
  let surround = [255, 255, 255];
  const layers: number[][] = [];
  for (let n = el.parentElement; n; n = n.parentElement) {
    const c = rgba(getComputedStyle(n).backgroundColor);
    if (c[3] > 0) layers.push(c);
    if (c[3] === 1) break;
  }
  for (const l of layers.reverse()) surround = over(l, surround);
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const cs = getComputedStyle(el);
  const own = over(rgba(cs.backgroundColor), surround);
  const border = over(rgba(cs.borderTopColor), surround);
  const edge = Math.max(ratio(border, surround), ratio(own, surround));
  const r: { edge: number; border: number; dot: number | null } = {
    edge,
    border: ratio(border, surround),
    dot: null,
  };
  if (el.matches("input[type=radio]")) {
    r.dot = ratio(over(rgba(getComputedStyle(el, "::after").backgroundColor), own), own);
  }
  return r;
}

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test(`${adapter}/${mode}: control boundaries and indicators are >= 3:1`, async ({ page }) => {
      await openPlayground(page, adapter, mode);
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
      const cases: Array<{ name: string; html: string; kind: "checked" | "unchecked" | "field" }> = [];
      for (const i of INTENTS) {
        for (const s of STYLES) {
          const c = `ui-${i} ${s}`;
          cases.push({ name: `checkbox ${c}`, kind: "checked", html: `<input type="checkbox" checked class="ui-checkbox ${c}">` });
          cases.push({ name: `radio ${c}`, kind: "checked", html: `<input type="radio" checked class="ui-radio ${c}">` });
          cases.push({ name: `radio unchecked ${c}`, kind: "unchecked", html: `<input type="radio" class="ui-radio ${c}">` });
        }
        for (const t of ["input", "textarea"]) {
          cases.push({ name: `${t} ui-${i}`, kind: "field", html: `<${t} class="ui-${t} ui-${i}">` });
        }
      }
      if (adapter === "daisyui") {
        cases.push({ name: "input", kind: "field", html: '<input class="ui-input">' });
        cases.push({ name: "checkbox unchecked", kind: "unchecked", html: '<input type="checkbox" class="ui-checkbox">' });
      }
      const results = await page.evaluate(
        ({ cases, fn }) => {
          const measureFn = eval(`(${fn})`) as (el: Element) => { edge: number; border: number; dot: number | null };
          const host = document.createElement("div");
          host.style.cssText = "padding:16px;background:var(--ui-surface,#fff)";
          document.body.prepend(host);
          return cases.map((c) => {
            host.innerHTML = c.html;
            const r = measureFn(host.firstElementChild!);
            return { name: c.name, kind: c.kind, ...r };
          });
        },
        { cases, fn: measure.toString() },
      );
      for (const r of results) {
        const v = r.kind === "field" ? r.border : r.edge;
        expect(v, `${adapter}/${mode} ${r.name} boundary`).toBeGreaterThanOrEqual(3);
        if (r.dot != null && r.kind === "checked") {
          expect(r.dot, `${adapter}/${mode} ${r.name} dot`).toBeGreaterThanOrEqual(3);
        }
      }
    });
  }
}
