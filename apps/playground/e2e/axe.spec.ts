import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { ADAPTERS, MODES, openPlayground } from "./helpers.js";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "__out__");

interface AllowEntry {
  adapters: readonly string[];
  modes: readonly string[];
  rule: string;
  /** css selector an axe node target must resolve to and match */
  selector: string;
  /** "upstream" = intentional, mirrors the upstream design system;
      "defect" = real bug tracked in docs/qa/a11y-2026-11.md */
  kind: "upstream" | "defect";
  why: string;
}

/**
 * Documented allowlist — anything not matched by an entry fails the test.
 * Every node suppressed by an entry is enumerated in docs/qa/a11y-2026-11.md
 * with its measured ratio.
 */
const ALLOWLIST: AllowEntry[] = [
  // ── Intentional exceptions (mirror the upstream design system) ────────────
  {
    adapters: ["shadcn"],
    modes: ["light", "dark"],
    rule: "color-contrast",
    selector: ".ui-button.ui-danger:not(.ui-outline):not(.ui-ghost):not(.ui-soft)",
    kind: "upstream",
    why: "shadcn solid destructive button ≈3.6:1 — shadcn's own destructive colour",
  },
  {
    adapters: ["daisyui"],
    modes: ["light"],
    rule: "color-contrast",
    selector:
      ".ui-success.ui-soft, .ui-warning.ui-soft, .ui-success.ui-outline, .ui-warning.ui-outline",
    kind: "upstream",
    why: "daisyUI light success/warning soft & outline ≈1.7–2:1 — mirrors upstream daisyUI",
  },
  {
    adapters: ["daisyui"],
    modes: ["light"],
    rule: "color-contrast",
    selector:
      ".ui-secondary, .ui-danger, .ui-success.ui-ghost, .ui-warning.ui-ghost, " +
      ".ui-tabs.ui-ghost .ui-tab",
    kind: "upstream",
    why: "daisyUI light secondary/danger and ghost text are daisyUI's own colours",
  },
  {
    adapters: ["daisyui"],
    modes: ["dark"],
    rule: "color-contrast",
    selector: ".ui-primary, .ui-secondary, .ui-tab",
    kind: "upstream",
    why: "daisyUI dark primary/secondary/tab colours mirror upstream daisyUI dark",
  },
  {
    adapters: ["shadcn"],
    modes: ["light", "dark"],
    rule: "color-contrast",
    selector:
      ".ui-badge.ui-danger:not(.ui-outline):not(.ui-ghost):not(.ui-soft), " +
      ".ui-alert.ui-danger:not(.ui-outline):not(.ui-ghost):not(.ui-soft), " +
      ".ui-tabs .ui-tab[aria-selected='false']",
    kind: "upstream",
    why: "shadcn destructive badge/alert and muted-foreground inactive tabs mirror upstream",
  },
  // ── Known defects in the default skin's light palette (see report) ────────
  {
    adapters: ["default"],
    modes: ["light"],
    rule: "color-contrast",
    selector:
      ".ui-success, .ui-warning.ui-outline, .ui-warning.ui-ghost, " +
      ".ui-danger:not(.ui-outline):not(.ui-ghost):not(.ui-soft), " +
      ".ui-tabs.ui-ghost.ui-success .ui-tab",
    kind: "defect",
    why: "default light: success (all), warning outline/ghost, danger solid < 4.5:1",
  },
  {
    adapters: ["shadcn"],
    modes: ["light"],
    rule: "color-contrast",
    selector: ".ui-success",
    kind: "defect",
    why: "shadcn light inherits the default skin's low-contrast success tokens",
  },
];

/** `incomplete` (needs-review) results we verified manually — see the report. */
const INCOMPLETE_ALLOW: AllowEntry[] = [
  {
    adapters: ["default", "shadcn", "daisyui"],
    modes: ["light", "dark"],
    rule: "color-contrast",
    selector: "select.ui-select",
    kind: "upstream",
    why: "select chevron is an inline-SVG background image — axe cannot resolve the background; contrast verified manually",
  },
];

const SERIOUS = new Set(["serious", "critical"]);

interface NodeLite {
  target: string;
  impact: string | null;
  html: string;
  failureSummary: string;
}
interface ViolationLite {
  id: string;
  impact: string | null;
  help: string;
  nodes: NodeLite[];
}

for (const adapter of ADAPTERS) {
  for (const mode of MODES) {
    test(`axe: ${adapter} / ${mode}`, async ({ page }) => {
      await openPlayground(page, adapter, mode);
      const results = await new AxeBuilder({ page }).analyze();

      const allow = [...ALLOWLIST, ...INCOMPLETE_ALLOW]
        .filter((a) => a.adapters.includes(adapter) && a.modes.includes(mode))
        .map(({ rule, selector }) => ({ rule, selector }));

      // Resolve every result node target to its element; mark allowlist hits.
      const mark = (list: typeof results.violations) => {
        const flat: Array<{ rule: string; target: string }> = [];
        list.forEach((v) =>
          v.nodes.forEach((n) => flat.push({ rule: v.id, target: n.target.join(" ") })),
        );
        return flat;
      };
      const flat = [...mark(results.violations), ...mark(results.incomplete)];
      const hits = await page.evaluate(
        ({ flat, allow }) =>
          flat.map(({ rule, target }) => {
            const el = document.querySelector(target);
            return (
              !!el && allow.some((a) => a.rule === rule && el.matches(a.selector))
            );
          }),
        { flat, allow },
      );
      const hit = new Map<string, boolean>();
      flat.forEach((f, i) => hit.set(`${f.rule}${f.target}`, hits[i]));

      const split = (list: typeof results.violations) => {
        const remaining: ViolationLite[] = [];
        const allowed: Array<{
          rule: string;
          target: string;
          failureSummary: string;
        }> = [];
        for (const v of list) {
          const kept: NodeLite[] = [];
          for (const n of v.nodes) {
            if (hit.get(`${v.id}${n.target.join(" ")}`))
              allowed.push({
                rule: v.id,
                target: n.target.join(" "),
                failureSummary: n.failureSummary ?? "",
              });
            else
              kept.push({
                target: n.target.join(" "),
                impact: n.impact ?? v.impact ?? null,
                html: n.html,
                failureSummary: n.failureSummary ?? "",
              });
          }
          if (kept.length)
            remaining.push({
              id: v.id,
              impact: v.impact ?? null,
              help: v.help,
              nodes: kept,
            });
        }
        return { remaining, allowed };
      };

      const violations = split(results.violations);
      const incomplete = split(results.incomplete);

      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        join(outDir, `axe-${adapter}-${mode}.json`),
        JSON.stringify(
          {
            adapter,
            mode,
            allowlisted: violations.allowed,
            violations: violations.remaining,
            incompleteAllowlisted: incomplete.allowed,
            incomplete: incomplete.remaining,
          },
          null,
          2,
        ),
      );

      const serious = (v: ViolationLite) =>
        v.nodes.some((n) => SERIOUS.has(n.impact ?? ""));
      const failing = [
        ...violations.remaining.filter(serious),
        ...incomplete.remaining.filter(serious),
      ];
      expect(failing, JSON.stringify(failing, null, 2)).toEqual([]);
    });
  }
}
