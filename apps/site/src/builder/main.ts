import "../site.css";
import "./builder.css";
import { parseColor } from "./color";
import {
  adapterFileName,
  coerceHex,
  previewCss,
  renderAdapterFile,
  renderCssSnippet,
  slug,
  type AdapterFormat,
} from "./export";
import {
  DEFAULT_FONT,
  INTENT_KEYS,
  PRESETS,
  audit,
  defaultState,
  failures,
  fixCheck,
  resolveFg,
  derive,
  type IntentKey,
  type Mode,
  type Palette,
  type SkinState,
} from "./model";

/* ------------------------------------------------------------------ state */

const STORE_KEY = "uniskin-builder-v1";
type Fmt = AdapterFormat | "css";

let state: SkinState = defaultState();
let mode: Mode = "light";
let preset: string | null = "default";
let fmt: Fmt = "mjs";

function isPalette(p: unknown): p is Palette {
  const v = p as Palette | undefined;
  return (
    !!v &&
    typeof v.surface === "string" &&
    !!parseColor(v.surface) &&
    !!v.intents &&
    INTENT_KEYS.every((k) => typeof v.intents[k]?.fill === "string" && !!parseColor(v.intents[k].fill)) &&
    !!v.neutral &&
    typeof v.neutral.fill === "string"
  );
}

function load(): void {
  const q = new URLSearchParams(location.search);
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { state?: SkinState; mode?: Mode; preset?: string | null };
      const s = saved.state;
      if (
        s &&
        isPalette(s.light) &&
        isPalette(s.dark) &&
        typeof s.radius === "number" &&
        typeof s.borderWidth === "number" &&
        typeof s.density === "number" &&
        typeof s.font === "string" &&
        typeof s.name === "string"
      ) {
        state = s;
        preset = saved.preset ?? null;
        if (saved.mode === "dark" || saved.mode === "light") mode = saved.mode;
      }
    }
  } catch {
    /* storage unavailable or corrupt — start from the default */
  }
  if (q.get("mode") === "dark" || q.get("mode") === "light") mode = q.get("mode") as Mode;
  const p = PRESETS.find((x) => x.id === q.get("preset"));
  if (p) {
    state = p.apply(state);
    preset = p.id;
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ state, mode, preset }));
  } catch {
    /* per-viewer convenience only */
  }
}

const pal = (): Palette => state[mode];

/* ------------------------------------------------------------- path access */

type Bag = Record<string, unknown>;

function getPath(p: Palette, path: string): string | null {
  let cur: unknown = p;
  for (const seg of path.split(".")) cur = (cur as Bag)[seg];
  return (cur as string | null) ?? null;
}

function setPath(p: Palette, path: string, value: string | null): void {
  const segs = path.split(".");
  let cur = p as unknown as Bag;
  for (const seg of segs.slice(0, -1)) cur = cur[seg] as Bag;
  cur[segs[segs.length - 1]] = value;
  /* a new fill invalidates colours pinned against the old one */
  if (segs[0] === "intents" && segs[2] === "fill") {
    const sw = p.intents[segs[1] as IntentKey];
    sw.text = null;
    sw.softFg = null;
  }
}

/* -------------------------------------------------------------------- DOM */

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
};

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

function field(label: string, path: string, who: string, extra = ""): string {
  const name = `${who} ${label.toLowerCase()}`;
  return `<div class="cf" data-field="${path}">
    <span class="cf-l">${label}</span>
    <span class="cf-in">
      <input type="color" class="cf-pick" data-path="${path}" aria-label="${name}, colour picker" />
      <input type="text" class="cf-hex" data-path="${path}" aria-label="${name}, hex value" maxlength="7" spellcheck="false" autocomplete="off" />
    </span>
    ${extra}
  </div>`;
}

function chip(id: string, label: string, title: string): string {
  return `<li class="chk" data-check="${id}" tabindex="-1" title="${title}">
    <span class="chk-l">${label}</span>
    <span class="chk-r"></span>
    <span class="chk-s"></span>
    <button type="button" class="fix" data-fix="${id}" hidden>Fix</button>
  </li>`;
}

const LABEL: Record<string, string> = {
  neutral: "Neutral",
  primary: "Primary",
  secondary: "Secondary",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
};

function intentRow(key: IntentKey | "neutral"): string {
  const who = LABEL[key];
  const isN = key === "neutral";
  const fillP = isN ? "neutral.fill" : `intents.${key}.fill`;
  const fgP = isN ? "neutral.fg" : `intents.${key}.fg`;
  const auto = isN
    ? ""
    : `<label class="auto"><input type="checkbox" data-auto="${key}" /> Auto</label>`;
  const more = isN
    ? `<div class="crow-more">${field("Soft tint", "neutral.soft", who)}${field("Soft text", "neutral.softFg", who)}</div>`
    : "";
  const checks = isN
    ? chip("solid:neutral", "On fill", "Neutral: text on fill, needs 4.5:1") +
      chip("soft:neutral", "On soft", "Neutral: text on soft tint, needs 4.5:1")
    : chip(`solid:${key}`, "On fill", `${who}: text on fill, needs 4.5:1`) +
      chip(`text:${key}`, "As text", `${who}: used as text on the surface, needs 4.5:1`) +
      chip(`soft:${key}`, "On soft", `${who}: text on its soft tint, needs 4.5:1`);
  return `<div class="crow" role="group" aria-label="${who}" data-row="${key}">
    <div class="crow-main">
      <div class="sw" data-sw="${key}" aria-hidden="true"><span>Aa</span></div>
      <div class="crow-body">
        <p class="crow-name">${who.toLowerCase()}</p>
        <div class="crow-fields">${field("Fill", fillP, who)}${field("On fill", fgP, who, auto)}</div>
        ${more}
      </div>
    </div>
    <ul class="checks" aria-label="${who} contrast checks">${checks}</ul>
  </div>`;
}

function surfaceRow(): string {
  return `<div class="crow" role="group" aria-label="Surface" data-row="surface">
    <div class="crow-main">
      <div class="sw sw-surface" data-sw="surface" aria-hidden="true"><span>Aa</span></div>
      <div class="crow-body">
        <p class="crow-name">surface</p>
        <div class="crow-fields">
          ${field("Background", "surface", "Surface")}
          ${field("Text", "surfaceFg", "Surface")}
          ${field("Muted", "surfaceMuted", "Surface")}
          ${field("Border", "border", "Surface")}
          ${field("Focus ring", "ring", "Surface")}
        </div>
      </div>
    </div>
    <ul class="checks" aria-label="Surface contrast checks">
      ${chip("body", "Body text", "Surface text on surface, needs 4.5:1")}
      ${chip("ring", "Focus ring", "Focus ring on surface, needs 3:1")}
    </ul>
  </div>`;
}

const FONTS: { id: string; label: string; stack: string }[] = [
  { id: "system", label: "System sans (default)", stack: DEFAULT_FONT },
  {
    id: "humanist",
    label: "Humanist sans",
    stack: 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
  },
  {
    id: "geometric",
    label: "Geometric sans",
    stack: 'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
  },
  {
    id: "serif",
    label: "Transitional serif",
    stack: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  },
  {
    id: "mono",
    label: "Monospace",
    stack: 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
  },
];

function presetDots(p: (typeof PRESETS)[number]): string {
  const s = p.apply(defaultState()).light;
  return [s.surface, s.intents.primary.fill, s.surfaceFg].map((c) => `<i style="background:${c}"></i>`).join("");
}

function buildControls(): void {
  $("#presets").innerHTML = PRESETS.map(
    (p) => `<button type="button" role="radio" class="preset" data-preset="${p.id}" aria-checked="false">
      <span class="preset-dots" aria-hidden="true">${presetDots(p)}</span>
      <span class="preset-name">${p.label}</span>
      <span class="preset-blurb">${p.blurb}</span>
    </button>`,
  ).join("");

  $("#rows").innerHTML =
    surfaceRow() + intentRow("neutral") + INTENT_KEYS.map((k) => intentRow(k)).join("");

  const slider = (id: string, label: string, min: number, max: number, step: number, hint: string) => `
    <div class="rng">
      <label class="rng-l" for="${id}">${label}</label>
      <output class="rng-o" id="${id}-o" for="${id}"></output>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
      <p class="rng-h">${hint}</p>
    </div>`;
  $("#shape").innerHTML =
    slider("radius", "Corner radius", 0, 1.5, 0.0625, "Drives --ui-radius; cards and modals use 1.5×, checkboxes 0.5×.") +
    slider("border", "Border width", 0, 4, 1, "Applied to buttons, fields, cards, badges and alerts.") +
    slider("density", "Density", 0.75, 1.5, 0.05, "Scales padding on every component and size.");

  $("#type").innerHTML = `
    <label class="fld">
      <span class="fld-l">Font stack</span>
      <select class="txt" id="font-pick">
        ${FONTS.map((f) => `<option value="${f.id}">${f.label}</option>`).join("")}
        <option value="custom">Custom…</option>
      </select>
    </label>
    <label class="fld" id="font-custom-wrap" hidden>
      <span class="fld-l">Custom <code>font-family</code></span>
      <input class="txt" id="font-custom" type="text" spellcheck="false" autocomplete="off" />
    </label>
    <p class="type-sample" id="type-sample">The quick brown fox jumps over the lazy dog — 0123456789</p>
    <p class="rng-h">System stacks only: nothing to download, nothing to host. Webfonts can be added in your own CSS and referenced here as a custom stack.</p>`;
}

/* -------------------------------------------------------------------- sync */

const frame = $<HTMLIFrameElement>("#preview");

function syncPreview(): void {
  const doc = frame.contentDocument;
  if (!doc?.head) return;
  let style = doc.getElementById("builder-override");
  if (!style) {
    style = doc.createElement("style");
    style.id = "builder-override";
    doc.head.append(style);
  }
  style.textContent = previewCss(state);
  const dark = mode === "dark";
  doc.documentElement.classList.toggle("dark", dark);
  doc.documentElement.classList.toggle("light", !dark);
  doc.documentElement.setAttribute("data-theme", mode);
}

function fmtRatio(n: number): string {
  return `${(Math.floor(n * 10) / 10).toFixed(1)}:1`;
}

function syncChecks(): void {
  const checks = audit(pal());
  for (const c of checks) {
    const el = document.querySelector<HTMLElement>(`[data-check="${CSS.escape(c.id)}"]`);
    if (!el) continue;
    el.dataset.state = c.pass ? "pass" : "fail";
    $(".chk-r", el).textContent = fmtRatio(c.ratio);
    $(".chk-s", el).textContent = c.pass ? "Pass" : "Low";
    const fix = $<HTMLButtonElement>(".fix", el);
    fix.hidden = c.pass;
    fix.setAttribute("aria-label", `Fix ${el.title.split(",")[0]} contrast`);
    el.setAttribute(
      "aria-label",
      `${el.title.split(",")[0]}: ${fmtRatio(c.ratio)}, ${c.pass ? "passes" : `fails, needs ${c.min}:1`}`,
    );
  }
}

function summary(): { light: number; dark: number } {
  return { light: failures(state.light).length, dark: failures(state.dark).length };
}

function syncAudit(): void {
  const s = summary();
  const total = s.light + s.dark;
  const box = $("#audit");
  const other: Mode = mode === "light" ? "dark" : "light";
  if (total === 0) {
    box.dataset.state = "pass";
    box.innerHTML = `<span class="audit-ic" aria-hidden="true">&#10003;</span>
      <span>Every contrast check passes in light and dark (WCAG AA — 4.5:1 text, 3:1 focus ring).</span>`;
  } else {
    box.dataset.state = "fail";
    const here = s[mode];
    const there = s[other];
    box.innerHTML = `<span class="audit-ic" aria-hidden="true">!</span>
      <span><strong>${total} contrast warning${total === 1 ? "" : "s"}</strong> —
      ${here} in ${mode}${there ? `, ${there} in <button type="button" class="linkish" data-goto="${other}">${other}</button>` : ""}.
      Below 4.5:1, text is hard to read for many people.</span>
      <button type="button" class="act act-solid" id="fix-all">Fix all</button>`;
  }
  const status = $("#export-status");
  status.dataset.state = total === 0 ? "pass" : "fail";
  status.textContent =
    total === 0
      ? "No contrast warnings in this export."
      : `${total} contrast warning${total === 1 ? "" : "s"} in this export (light ${s.light}, dark ${s.dark}).`;
}

function syncFields(): void {
  const p = pal();
  for (const el of document.querySelectorAll<HTMLInputElement>("[data-path]")) {
    const path = el.dataset.path ?? "";
    const raw = getPath(p, path);
    let value = raw;
    if (value === null && path.endsWith(".fg")) value = resolveFg(p.intents[path.split(".")[1] as IntentKey]);
    if (value === null) continue;
    const hex = coerceHex(value) ?? "#000000";
    if (el.type === "color") el.value = hex;
    else if (document.activeElement !== el) {
      el.value = hex;
      el.removeAttribute("aria-invalid");
    }
  }
  for (const el of document.querySelectorAll<HTMLInputElement>("[data-auto]")) {
    el.checked = p.intents[el.dataset.auto as IntentKey].fg === null;
  }
  /* swatches show the real on-colour on the real fill */
  for (const k of ["neutral", ...INTENT_KEYS] as const) {
    const sw = $(`[data-sw="${k}"]`);
    const fill = k === "neutral" ? p.neutral.fill : p.intents[k].fill;
    const fg = k === "neutral" ? p.neutral.fg : resolveFg(p.intents[k]);
    sw.style.background = fill;
    sw.style.color = fg;
    if (k !== "neutral") sw.style.setProperty("--soft", `#${hexOf(derive(p, k).soft)}`);
  }
  const sws = $("[data-sw='surface']");
  sws.style.background = p.surface;
  sws.style.color = p.surfaceFg;
  sws.style.outlineColor = p.ring;
}

function hexOf(rgb: readonly number[]): string {
  return rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

function syncShape(): void {
  const set = (id: string, v: number, text: string) => {
    const el = $<HTMLInputElement>(`#${id}`);
    if (document.activeElement !== el || el.value !== String(v)) el.value = String(v);
    $(`#${id}-o`).textContent = text;
  };
  set("radius", state.radius, `${state.radius}rem`);
  set("border", state.borderWidth, `${state.borderWidth}px`);
  const word = state.density < 0.95 ? "compact" : state.density > 1.05 ? "roomy" : "default";
  set("density", state.density, `${state.density.toFixed(2)}× · ${word}`);

  const known = FONTS.find((f) => f.stack === state.font);
  $<HTMLSelectElement>("#font-pick").value = known ? known.id : "custom";
  $("#font-custom-wrap").hidden = !!known;
  const custom = $<HTMLInputElement>("#font-custom");
  if (document.activeElement !== custom) custom.value = state.font;
  $("#type-sample").style.fontFamily = state.font;
}

function syncChrome(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>("#mode [role=radio]")) {
    const on = b.dataset.mode === mode;
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on ? 0 : -1;
  }
  const presetBtns = [...document.querySelectorAll<HTMLButtonElement>("#presets [role=radio]")];
  presetBtns.forEach((b, i) => {
    const on = b.dataset.preset === preset;
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on || (preset === null && i === 0) ? 0 : -1;
  });
  $("#mode-tag").innerHTML = `Editing <strong>${mode}</strong> values`;
}

function currentOutput(): { text: string; file: string; use: string } {
  const name = slug(state.name);
  if (fmt === "css") {
    return {
      text: renderCssSnippet(state),
      file: `${name}.css`,
      use: "Plain CSS — paste it after your <code>@plugin \"uniskin\"</code> line. Works with the default adapter; border width and density need the adapter file.",
    };
  }
  const file = adapterFileName(state, fmt);
  const node = fmt === "mjs" ? "Node 20.19+ / 22.12+" : "Node 22.18+";
  return {
    text: renderAdapterFile(state, fmt),
    file,
    use: `Save as <code>${esc(file)}</code>, then <code>@plugin "uniskin" { adapter: "./${esc(file)}"; }</code>. Needs <code>uniskin</code> installed; loads on ${node}.`,
  };
}

function syncExport(): void {
  const name = slug(state.name);
  $("#tab-mjs").textContent = `${name}.mjs`;
  $("#tab-ts").textContent = `${name}.ts`;
  $("#tab-css").textContent = "CSS variables";
  for (const t of document.querySelectorAll<HTMLButtonElement>("[role=tab][data-fmt]")) {
    const on = t.dataset.fmt === fmt;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (on) $("#panel-x").setAttribute("aria-labelledby", t.id);
  }
  const out = currentOutput();
  $("#out").textContent = out.text;
  $("#use").innerHTML = out.use;
}

function syncAll(): void {
  syncChrome();
  syncFields();
  syncChecks();
  syncAudit();
  syncShape();
  syncExport();
  syncPreview();
  persist();
}

/* ------------------------------------------------------------------ events */

const controls = $("#controls");

controls.addEventListener("input", (e) => {
  const t = e.target as HTMLInputElement;
  const path = t.dataset.path;
  if (path) {
    if (t.type === "color") {
      setPath(pal(), path, t.value);
    } else {
      const v = t.value.trim().startsWith("#") ? t.value.trim() : `#${t.value.trim()}`;
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? coerceHex(v) : null;
      if (!hex) {
        t.setAttribute("aria-invalid", "true");
        return;
      }
      t.removeAttribute("aria-invalid");
      setPath(pal(), path, hex);
    }
    preset = null;
    syncAll();
    return;
  }
  if (t.id === "radius") state.radius = parseFloat(t.value);
  else if (t.id === "border") state.borderWidth = parseInt(t.value, 10);
  else if (t.id === "density") state.density = Math.round(parseFloat(t.value) * 100) / 100;
  else if (t.id === "font-custom") state.font = t.value || DEFAULT_FONT;
  else return;
  preset = null;
  syncAll();
});

controls.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (t instanceof HTMLInputElement && t.dataset.auto) {
    const sw = pal().intents[t.dataset.auto as IntentKey];
    sw.fg = t.checked ? null : resolveFg(sw);
    preset = null;
  } else if (t.id === "font-pick") {
    const f = FONTS.find((x) => x.id === t.value);
    if (f) state.font = f.stack;
    else {
      state.font = state.font || DEFAULT_FONT;
      /* reveal the custom field with the current stack, then move focus into it */
      $("#font-custom-wrap").hidden = false;
      $<HTMLInputElement>("#font-custom").focus();
    }
    preset = null;
  } else if (t.dataset.path) {
    /* hex text committed: snap the display back to the stored value */
  } else return;
  syncAll();
});

controls.addEventListener("focusout", (e) => {
  const t = e.target as HTMLInputElement;
  if (t.dataset?.path && t.type === "text") syncFields();
});

function focusAfterFix(el: HTMLElement | null): void {
  el?.focus();
}

document.addEventListener("click", (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>(
    "[data-fix],[data-preset],#fix-all,[data-goto]",
  );
  if (!t) return;
  if (t.dataset.fix) {
    const li = t.closest<HTMLElement>("[data-check]");
    state[mode] = fixCheck(pal(), t.dataset.fix);
    preset = null;
    syncAll();
    focusAfterFix(li);
  } else if (t.id === "fix-all") {
    for (const m of ["light", "dark"] as const) {
      for (let i = 0; i < 12 && failures(state[m]).length; i++) {
        state[m] = fixCheck(state[m], failures(state[m])[0].id);
      }
    }
    preset = null;
    syncAll();
    focusAfterFix($("#audit"));
  } else if (t.dataset.goto) {
    mode = t.dataset.goto as Mode;
    syncAll();
  } else if (t.dataset.preset) {
    const p = PRESETS.find((x) => x.id === t.dataset.preset);
    if (!p) return;
    const keep = state.name;
    state = { ...p.apply(defaultState()), name: keep };
    preset = p.id;
    syncAll();
    t.focus();
  }
});

/** Shared roving-tabindex arrow-key behaviour for radiogroups / tablists. */
function roving(container: HTMLElement, itemSel: string, onPick: (el: HTMLElement) => void): void {
  container.addEventListener("keydown", (e) => {
    const items = [...container.querySelectorAll<HTMLElement>(itemSel)];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i === -1) return;
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % items.length
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i - 1 + items.length) % items.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next === -1) return;
    e.preventDefault();
    items[next].focus();
    onPick(items[next]);
  });
}

$("#mode").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-mode]");
  if (!b) return;
  mode = b.dataset.mode as Mode;
  syncAll();
});
roving($("#mode"), "[role=radio]", (el) => {
  mode = el.dataset.mode as Mode;
  syncAll();
});
roving($("#presets"), "[role=radio]", (el) => el.click());

const tabs = $(".tabs-x");
tabs.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-fmt]");
  if (!b) return;
  fmt = b.dataset.fmt as Fmt;
  syncExport();
});
roving(tabs, "[role=tab]", (el) => {
  fmt = el.dataset.fmt as Fmt;
  syncExport();
});

const nameInput = $<HTMLInputElement>("#name");
nameInput.addEventListener("input", () => {
  state.name = nameInput.value;
  syncExport();
  persist();
});
nameInput.addEventListener("blur", () => {
  nameInput.value = state.name;
});

$("#copy").addEventListener("click", async () => {
  const btn = $("#copy");
  try {
    await navigator.clipboard.writeText(currentOutput().text);
    btn.textContent = "Copied";
  } catch {
    $("#out").parentElement?.focus();
    btn.textContent = "Select + ⌘C";
  }
  setTimeout(() => (btn.textContent = "Copy"), 1800);
});

$("#download").addEventListener("click", () => {
  const out = currentOutput();
  const url = URL.createObjectURL(new Blob([out.text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = out.file;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* page appearance (site chrome only — the preview follows Light/Dark above) */
const appearance = $("#page-appearance");
function syncAppearance(): void {
  appearance.setAttribute("aria-checked", String(document.documentElement.classList.contains("dark")));
}
appearance.addEventListener("click", () => {
  const dark = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("uniskin-appearance", dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
  syncAppearance();
});

frame.addEventListener("load", syncPreview);

/* ------------------------------------------------------------------- boot */

load();
buildControls();
nameInput.value = state.name;
syncAppearance();
syncAll();
if (frame.contentDocument?.readyState === "complete") syncPreview();
