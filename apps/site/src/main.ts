import { ADAPTERS, type AdapterName } from "./config";
import { buildExamples, KIND_LABEL, type Example } from "./examples";
import vocabularyMd from "../../../docs/vocabulary.md?raw";
import "./site.css";

const params = new URLSearchParams(location.search);

const urlAdapter = params.get("adapter");
const storedAppearance = localStorage.getItem("uniskin-appearance");

const state = {
  adapter: (ADAPTERS as readonly string[]).includes(urlAdapter ?? "")
    ? (urlAdapter as AdapterName)
    : "default",
  dark: params.has("dark")
    ? params.get("dark") === "1" || params.get("dark") === "true"
    : storedAppearance
      ? storedAppearance === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches,
} satisfies { adapter: AdapterName; dark: boolean };

const frames = () =>
  document.querySelectorAll<HTMLIFrameElement>("iframe[data-skin-frame]");

const frameObservers = new WeakMap<HTMLIFrameElement, ResizeObserver>();

/* Same-origin iframes size themselves to their content — no fixed-height
   guesses that could clip a taller skin. */
function sizeFrame(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  const body = doc?.body;
  if (!doc || !body) return;
  const set = () => {
    frame.style.height = `${doc.documentElement.scrollHeight}px`;
  };
  set();
  frameObservers.get(frame)?.disconnect();
  const ro = new ResizeObserver(() => requestAnimationFrame(set));
  ro.observe(body);
  frameObservers.set(frame, ro);
}

function applyToFrame(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc?.documentElement) return;
  /* data-pin frames (the per-adapter swatches) keep the skin their own
     ?adapter= param picked — the tour/demo frames follow the selection. */
  if (!frame.hasAttribute("data-pin")) {
    doc.getElementById("skin")?.setAttribute("href", `/adapters/${state.adapter}.css`);
  }
  doc.documentElement.classList.toggle("dark", state.dark);
  doc.documentElement.classList.toggle("light", !state.dark);
  doc.documentElement.setAttribute("data-theme", state.dark ? "dark" : "light");
}

/* ---- components section: entries generated from docs/vocabulary.md ---- */

/** The iframe document every example shares — only the <link> ever changes. */
function exampleSrcdoc(example: Example): string {
  /* dialog-based samples need real height; content-sized rows size to their body. */
  const minHeight = example.id === "modal" ? "min-height:15rem;" : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link id="skin" rel="stylesheet" href="/adapters/default.css">
<style>
  :root{color-scheme:light}html.dark{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;padding:0.9rem;background:var(--ui-surface);color:var(--ui-surface-fg);font-family:var(--ui-font-sans);${minHeight}}
  body.flex{display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center}
</style></head><body class="${example.layout}">${example.markup}</body></html>`;
}

/* The section is populated from the doc at load; markup text is set via
   textContent so nothing needs escaping. */
function renderExamples() {
  const list = document.getElementById("ex-list");
  if (!list) return;
  list.replaceChildren();
  let kind: Example["kind"] | "" = "";
  for (const example of buildExamples(vocabularyMd)) {
    if (example.kind !== kind) {
      kind = example.kind;
      const group = document.createElement("h3");
      group.className = "ex-group";
      group.textContent = KIND_LABEL[kind];
      list.append(group);
    }
    const entry = document.createElement("article");
    entry.className = "ex-entry";

    const meta = document.createElement("div");
    meta.className = "ex-meta";
    const chips = document.createElement("p");
    chips.className = "ex-classes";
    for (const cls of example.classes) {
      const chip = document.createElement("code");
      chip.textContent = cls;
      chips.append(chip, " ");
    }
    meta.append(chips);
    if (example.blurb) {
      const blurb = document.createElement("p");
      blurb.className = "ex-blurb";
      blurb.textContent = example.blurb;
      meta.append(blurb);
    }

    const frame = document.createElement("iframe");
    frame.className = "ex-frame";
    frame.setAttribute("data-skin-frame", "");
    frame.setAttribute("data-frame", `ex-${example.id}`);
    frame.title = `${example.classes.join(" ")} — rendered example`;
    frame.srcdoc = exampleSrcdoc(example);

    const pre = document.createElement("pre");
    pre.className = "code ex-code";
    const code = document.createElement("code");
    code.textContent = example.markup;
    pre.append(code);

    entry.append(meta, frame, pre);
    list.append(entry);
  }
}

renderExamples();

function apply() {
  document.documentElement.classList.toggle("dark", state.dark);
  for (const frame of frames()) applyToFrame(frame);
  for (const btn of document.querySelectorAll<HTMLButtonElement>(".seg [role='radio']")) {
    const selected = btn.dataset.adapter === state.adapter;
    btn.setAttribute("aria-checked", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  }
  const appearance = document.getElementById("appearance");
  appearance?.setAttribute("aria-checked", String(state.dark));
  const skinPath = document.getElementById("skin-path");
  if (skinPath) skinPath.textContent = `/adapters/${state.adapter}.css`;
}

/* Keep the URL shareable — ?adapter=&dark= deep-link the same state. */
function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set("adapter", state.adapter);
  url.searchParams.set("dark", state.dark ? "1" : "0");
  history.replaceState(null, "", url);
}

for (const frame of frames()) {
  frame.addEventListener("load", () => {
    applyToFrame(frame);
    sizeFrame(frame);
  });
  if (frame.contentDocument?.readyState === "complete") {
    applyToFrame(frame);
    sizeFrame(frame);
  }
}

/* ---- segmented adapter control (radiogroup + roving tabindex) ---- */

const seg = document.querySelector(".seg");
const radios = [...document.querySelectorAll<HTMLButtonElement>(".seg [role='radio']")];

seg?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-adapter]");
  if (!btn) return;
  state.adapter = btn.dataset.adapter as AdapterName;
  apply();
  syncUrl();
  btn.focus();
});

seg?.addEventListener("keydown", (e) => {
  if (!(e instanceof KeyboardEvent)) return;
  const current = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (current === -1) return;
  const last = radios.length - 1;
  const next =
    e.key === "ArrowRight" || e.key === "ArrowDown"
      ? current === last
        ? 0
        : current + 1
      : e.key === "ArrowLeft" || e.key === "ArrowUp"
        ? current === 0
          ? last
          : current - 1
        : e.key === "Home"
          ? 0
          : e.key === "End"
            ? last
            : -1;
  if (next === -1) return;
  e.preventDefault();
  state.adapter = radios[next].dataset.adapter as AdapterName;
  apply();
  syncUrl();
  radios[next].focus();
});

/* ---- appearance switch (site + every frame) ---- */

document.getElementById("appearance")?.addEventListener("click", () => {
  state.dark = !state.dark;
  localStorage.setItem("uniskin-appearance", state.dark ? "dark" : "light");
  apply();
  syncUrl();
});

/* ---- install snippet ---- */

const copyBtn = document.getElementById("copy-install");
copyBtn?.addEventListener("click", async () => {
  const code = document.querySelector("#install code")?.textContent ?? "";
  const text = code.replace(/^\$ /gm, "").replace(/\/\* app\.css \*\/\n/, "");
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  } catch {
    copyBtn.textContent = "Select + ⌘C";
  }
});

apply();
