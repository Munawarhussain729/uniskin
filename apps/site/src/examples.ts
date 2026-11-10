/**
 * Build the Components section's example list from docs/vocabulary.md.
 *
 * Pure function over the markdown text so it can run in the browser
 * (the doc is inlined by Vite's `?raw` import) and in vitest (the test
 * passes the real file), keeping the section generated from the same
 * source the package's vocabulary-docs test guards.
 */

export type ExampleKind = "component" | "intent" | "style" | "size" | "state";

export interface Example {
  /** Slug used for ids/titles. */
  id: string;
  kind: ExampleKind;
  /** The public classes this entry exemplifies. */
  classes: string[];
  /** First paragraph under the doc heading, markdown stripped. */
  blurb: string;
  /** The snippet — displayed verbatim and rendered inside the iframe. */
  markup: string;
  /** Iframe body layout: flex row for small controls, block for composites. */
  layout: "row" | "block";
}

/** `ui-` not preceded by `-`/word char — same rule as vocabulary-docs.test. */
export const CLASS_RE = /(?<![\w-])ui-[a-z0-9-]+/g;

/* Headings like `### `ui-card`, `ui-card-header`, …` start a component
   section; the first ```html fence under it is the canonical snippet. */
const HEADING_RE = /^###\s+((?:`ui-[a-z0-9-]+`(?:,\s*)?)+)\s*$/gm;
const FENCE_RE = /```html\n([\s\S]*?)```/;

/* The doc's `<dialog>` sample isn't `open`, and its `:target` variant is
   hidden until clicked — neither shows anything in a small frame. The
   documented `<dialog open>` path renders statically. */
const MARKUP_OVERRIDES: Record<string, string> = {
  modal: `<dialog class="ui-modal" open>
  <div class="ui-modal-box ui-sm">
    <p style="margin: 0 0 1rem">Delete this file?</p>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end">
      <button class="ui-button ui-ghost ui-sm">Cancel</button>
      <button class="ui-button ui-danger ui-sm">Delete</button>
    </div>
  </div>
</dialog>`,
};

/* A closed dropdown shows only its trigger, so the example opens it with
   `ui-active` (one of the documented open mechanisms) and leaves room for
   the panel. */
MARKUP_OVERRIDES.dropdown = `<div style="min-height: 11.5rem">
  <div class="ui-dropdown ui-active" data-placement="bottom-start">
    <button class="ui-button" aria-haspopup="menu" aria-expanded="true">Options</button>
    <div class="ui-menu" role="menu" aria-label="Options">
      <div class="ui-menu-label" role="presentation">File</div>
      <button class="ui-menu-item" role="menuitem">Rename</button>
      <button class="ui-menu-item ui-disabled" role="menuitem" aria-disabled="true">Archive</button>
      <hr class="ui-menu-separator" role="separator">
      <button class="ui-menu-item ui-danger" role="menuitem">Delete</button>
    </div>
  </div>
</div>`;

/* Composites read better un-centered. */
const BLOCK_LAYOUT = new Set(["card", "modal", "tabs", "dropdown"]);

/** First doc paragraph under a heading, markdown formatting stripped. */
function blurbOf(section: string): string {
  const paragraph: string[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) {
      if (paragraph.length) break;
      continue;
    }
    if (line.startsWith("```") || line.startsWith("-") || line.startsWith("|")) break;
    paragraph.push(line);
  }
  return paragraph
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .trim();
}

/** Row label → kind for the doc's modifier table. */
const TABLE_KIND: Record<string, ExampleKind> = {
  Intent: "intent",
  Style: "style",
  Size: "size",
  State: "state",
};

/** Exemplar markup for a modifier class — a single focused control. */
function modifierMarkup(kind: ExampleKind, cls: string): string {
  const button = (extra: string) => `<button class="ui-button ${extra}">${cls}</button>`;
  switch (kind) {
    case "intent":
      return button(cls);
    case "style":
      return button(`ui-primary ${cls}`);
    case "size":
      return button(`ui-primary ${cls}`);
    case "state":
      return button(`ui-primary ${cls}`);
    default:
      return button(cls);
  }
}

const KIND_ORDER: ExampleKind[] = ["component", "intent", "style", "size", "state"];

export const KIND_LABEL: Record<ExampleKind, string> = {
  component: "Components",
  intent: "Intents",
  style: "Styles",
  size: "Sizes",
  state: "States",
};

/**
 * Every class documented in the modifier table (`| Intent | ui-… |`) and
 * in `### ui-…` headings — the list the Components section must cover.
 */
export function documentedClasses(markdown: string): string[] {
  const found = new Set<string>();
  for (const m of markdown.matchAll(/`ui-[a-z0-9-]+`/g)) found.add(m[0].slice(1, -1));
  for (const m of markdown.matchAll(CLASS_RE)) found.add(m[0]);
  return [...found].sort();
}

export function buildExamples(markdown: string): Example[] {
  const examples: Example[] = [];

  /* Only the "## Components" region — later `### ui-…` headings under
     Accessibility reuse the same names with different snippets. */
  const compStart = markdown.indexOf("## Components");
  const compRest = compStart === -1 ? "" : markdown.slice(compStart);
  const compEnd = compRest.search(/^## (?!Components)/m);
  const componentsRegion = compStart === -1 ? "" : compEnd === -1 ? compRest : compRest.slice(0, compEnd);

  /* ---- components: one entry per ### `ui-…` heading ---- */
  const headings = [...componentsRegion.matchAll(HEADING_RE)];
  headings.forEach((heading, i) => {
    const classes = [...heading[1].matchAll(/`ui-[a-z0-9-]+`/g)].map((m) => m[0].slice(1, -1));
    const id = classes[0].replace(/^ui-/, "");
    const start = heading.index! + heading[0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index! : componentsRegion.length;
    const section = componentsRegion.slice(start, end);
    const fence = section.match(FENCE_RE);
    const markup = MARKUP_OVERRIDES[id] ?? fence?.[1].trim();
    if (!markup) return;
    examples.push({
      id,
      kind: "component",
      classes,
      blurb: blurbOf(section),
      markup,
      layout: BLOCK_LAYOUT.has(id) ? "block" : "row",
    });
  });

  /* ---- modifiers: one entry per class in the "Modifier kinds" table ---- */
  for (const m of markdown.matchAll(/^\|\s*(Intent|Style|Size|State)\s*\|([^|]+)\|/gm)) {
    const kind = TABLE_KIND[m[1]];
    const classes = [...m[2].matchAll(/`ui-[a-z0-9-]+`/g)].map((c) => c[0].slice(1, -1));
    for (const cls of classes) {
      examples.push({
        id: cls.replace(/^ui-/, ""),
        kind,
        classes: [cls],
        blurb: "",
        markup: modifierMarkup(kind, cls),
        layout: "row",
      });
    }
  }

  return examples.sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
}
