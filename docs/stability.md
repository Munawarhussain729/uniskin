# Stability and support policy

From 1.0.0, Uniskin follows [semantic versioning](https://semver.org). This
page lists what is **stable** (breaking it needs 2.0), what is **not**, how
deprecations are announced, and what is supported. It is the result of the
0.9.0 freeze review: every public surface below was walked and either marked
stable or left out on purpose.

## The stable surface

Changing any of these in a way that breaks existing consumers is a major
release.

| Surface | What is frozen |
|---------|----------------|
| **Class names** | Every component and part class in the [vocabulary](vocabulary.md), and the modifier words `ui-primary`, `ui-secondary`, `ui-success`, `ui-warning`, `ui-danger`, `ui-outline`, `ui-ghost`, `ui-soft`, `ui-sm`, `ui-lg`, `ui-disabled`, `ui-loading`, `ui-active`. The prefix is configurable; the names after it are not. |
| **Modifier sets** | The [coverage matrix](vocabulary.md#coverage-matrix): which modifier kinds each component accepts. Support for more modifiers can be added in a minor; none is removed. |
| **Native state hooks** | The attributes that mean a state: `aria-disabled`, `:disabled`, `aria-busy`, `aria-selected`, `aria-pressed`, `[open]`, `aria-current="page"`, `aria-expanded`, `data-placement` and the documented `data-highlighted` / `data-orientation`. |
| **Plugin options** | `adapter`, `prefix`, `dark` (`"media"`, `"class"`, `false`), `debug`, and the `@plugin "uniskin"` form. |
| **Adapter interface** | `defineAdapter`, the `Adapter` fields (`name`, `tokens`, `rootSelector`, `darkTokens`, `darkRootSelector`, `keyframes`, `components`), the five slots (`base`, `intents`, `styles`, `sizes`, `states`) and the closed modifier sets. The `uniskin/adapter` and `uniskin/conformance` exports. |
| **Design tokens** | The `--ui-*` colour, radius, font and text tokens listed in [writing adapters](writing-adapters.md#the---ui-c-composition-model) (`--ui-primary`, `--ui-surface`, `--ui-border`, `--ui-ring`, `--ui-radius`, `--ui-font-sans`, `--ui-text-sm|md|lg`, ...) and the intent pins (`--ui-<intent>-text|soft|soft-fg|hover|border|soft-hover`). |
| **Documented hooks** | The per-component custom properties listed in [writing adapters](writing-adapters.md#per-component-hooks) (`--ui-menu-w`, `--ui-toast-gap`, ...). Their names and meaning are stable; their defaults may be tuned in a minor. |
| **CLI** | `uniskin init` (`--adapter`, `--css`, `--yes`, `--dry-run`) and `uniskin new-adapter <name>` (`--file`). |
| **Behaviour** | Prefixing renames classes, keyframes and animation references together; intents only set variables where the docs say so; nothing in the core package needs JavaScript at runtime. |

## What is not stable

- **Visual values.** Colours, spacing, radii, shadows, font sizes and
  timings of the default skin and the shadcn and daisyUI adapters can change
  in a minor or patch release (a contrast fix, a closer match to upstream).
  The accessibility results in `docs/qa/` are the contract, not the pixels.
- **Emitted CSS structure.** Selector order, how rules are grouped, and
  the exact selectors generated for a modifier. Do not target `.ui-*`
  selectors from your own stylesheet beyond the documented classes and hooks.
- **Undocumented variables.** Any `--ui-*` custom property not listed in the
  docs (for example the `--ui-c-*` composition variables) is internal to the
  skins. The `--ui-c` model is documented for adapter authors, but adapters
  that depend on it should pin their `uniskin` range.
- **The default theme's exports.** `uniskin` exports the plugin; the default
  theme object is not a supported import.
- **Playground, site and examples** under `apps/`.

## Deprecation

A deprecation is announced in the changelog of a minor release and, where it
can be detected, as a build warning. The deprecated surface keeps working for
at least one further minor release and is removed only in the next major. A
bug fix that makes a skin match its documented behaviour is not a breaking
change.

## Versions

| | Supported |
|-|-----------|
| **Node.js** | 20 and 22 (both run in CI on every change). Node 20.19 / 22.12 or later is recommended, because ESM adapters can then be loaded with `require`. |
| **Tailwind CSS** | v4, from 4.3.3 (`peerDependencies`: `^4.3.3`). CI runs 4.3.3, 4.3.5 and the latest 4.x; a failure on `latest` does not block a release but is looked at before the next one. |
| **daisyUI** | v5, for `@uniskin/daisyui` (optional peer). |
| **Browsers** | Current evergreen browsers. The few newer features (`@starting-style`, `:has()`, `color-mix()`, `:dir()`) degrade to the plain state, not to a broken layout; the docs say so where it matters. |

The three packages (`uniskin`, `@uniskin/shadcn`, `@uniskin/daisyui`) are
released together. The adapters depend on `uniskin` as a peer at `^1.0.0`, so
a major of `uniskin` is a major of the adapters.

## Reporting a problem

Security issues go through [SECURITY.md](../SECURITY.md). Anything that looks
like a break of the list above is a bug: please open an issue with the two
versions involved.
