import { ADAPTERS, RELEASED, type AdapterName } from "./config";
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

const releaseNote = document.getElementById("release-note");
if (releaseNote && !RELEASED) releaseNote.hidden = false;

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
