import { stripComments } from "./project.js";

export type AdapterChoice = "default" | "shadcn" | "daisyui" | "bootstrap" | "flowbite" | "radix";
export const ADAPTERS: readonly AdapterChoice[] = ["default", "shadcn", "daisyui", "bootstrap", "flowbite", "radix"];

/** Packages each adapter choice needs in the project. */
export const ADAPTER_PACKAGES: Record<AdapterChoice, string[]> = {
  default: ["uniskin"],
  shadcn: ["uniskin", "@uniskin/shadcn"],
  // daisyUI is a peer of the adapter: the adapter maps --ui-* onto daisyUI's
  // --color-* variables, which only exist once daisyUI itself is loaded.
  daisyui: ["uniskin", "@uniskin/daisyui", "daisyui"],
  // Bootstrap is optional: the adapter carries Bootstrap's own values as
  // fallbacks, and follows --bs-* when Bootstrap's stylesheet is also loaded.
  bootstrap: ["uniskin", "@uniskin/bootstrap"],
  // Flowbite is Tailwind utilities: the adapter reads Tailwind's --color-* theme
  // variables with the palette values as fallbacks, so no extra library.
  flowbite: ["uniskin", "@uniskin/flowbite"],
  // Radix Themes is optional: the adapter carries the Radix scale values as
  // fallbacks and follows --<scale>-<step> when Radix Themes' CSS is loaded.
  radix: ["uniskin", "@uniskin/radix"],
};

/** The `@plugin` lines for a choice. Only the documented `adapter` option is used. */
export function pluginLines(adapter: AdapterChoice): string[] {
  switch (adapter) {
    case "default":
      return ['@plugin "uniskin";'];
    case "shadcn":
      return ['@plugin "uniskin" { adapter: "shadcn"; }'];
    case "daisyui":
      return ['@plugin "daisyui";', '@plugin "uniskin" { adapter: "daisyui"; }'];
    case "bootstrap":
      return ['@plugin "uniskin" { adapter: "bootstrap"; }'];
    case "flowbite":
      return ['@plugin "uniskin" { adapter: "flowbite"; }'];
    case "radix":
      return ['@plugin "uniskin" { adapter: "radix"; }'];
  }
}

const UNISKIN_PLUGIN = /@plugin\s+["']uniskin["']/;
const DAISY_PLUGIN = /@plugin\s+["']daisyui["']/;

export function hasUniskinPlugin(css: string): boolean {
  return UNISKIN_PLUGIN.test(stripComments(css));
}

export interface InsertResult {
  /** New file content (identical to the input when nothing changed). */
  content: string;
  changed: boolean;
  /** 1-based line number of the first inserted line. */
  line?: number;
  added: string[];
}

/**
 * Inserts the plugin line(s) after the last single-line `@import` so that
 * `@import` statements stay first, as CSS requires. Idempotent: a file that
 * already has `@plugin "uniskin"` is returned untouched. Existing content is
 * never modified or reordered.
 */
export function insertPlugin(css: string, adapter: AdapterChoice): InsertResult {
  if (hasUniskinPlugin(css)) return { content: css, changed: false, added: [] };
  const eol = css.includes("\r\n") ? "\r\n" : "\n";
  const hasDaisy = DAISY_PLUGIN.test(stripComments(css));
  const lines = pluginLines(adapter).filter((l) => !(hasDaisy && DAISY_PLUGIN.test(l)));
  const masked = stripComments(css).split(/\r?\n/);
  let after = -1;
  masked.forEach((l, i) => {
    if (/^\s*@import\b[^;{]*;\s*$/.test(l)) after = i;
  });
  if (after === -1) {
    return { content: lines.join(eol) + eol + css, changed: true, line: 1, added: lines };
  }
  const src = css.split(/\r?\n/);
  src.splice(after + 1, 0, ...lines);
  return { content: src.join(eol), changed: true, line: after + 2, added: lines };
}

/** Minimal unified-style diff for a pure insertion of `added` at 1-based `line`. */
export function insertionDiff(file: string, before: string, line: number, added: string[]): string {
  const b = before.replace(/\r?\n$/, "").split(/\r?\n/);
  const start = Math.max(0, line - 3);
  const ctxBefore = b.slice(start, line - 1);
  const ctxAfter = b.slice(line - 1, line + 1);
  const oldLen = ctxBefore.length + ctxAfter.length;
  return [
    `--- ${file}`,
    `+++ ${file}`,
    `@@ -${start + 1},${oldLen} +${start + 1},${oldLen + added.length} @@`,
    ...ctxBefore.map((l) => ` ${l}`),
    ...added.map((l) => `+${l}`),
    ...ctxAfter.map((l) => ` ${l}`),
  ].join("\n");
}
