# Upgrading to 1.0

1.0.0 is the 0.9 release candidate with the stability promise in
[stability.md](stability.md) switched on. **There are no breaking changes
between 0.9 and 1.0**, and none of the changelog entries since 0.1.0 records
a removed or renamed class, modifier, token, option or CLI flag. This page is
what to check, and what changes in how you depend on Uniskin.

## If you use a built-in skin

1. Update the three packages together (`uniskin`, and `@uniskin/shadcn` or
   `@uniskin/daisyui`). They are released together and the adapters depend on
   `uniskin` as a peer at `^1.0.0`:

   ```sh
   npm install uniskin@^1 @uniskin/shadcn@^1
   ```

2. Rebuild your CSS. Nothing in your stylesheet changes: the `@plugin`
   lines `npx uniskin init` wrote keep working.
3. Look at your visuals. Colours, spacing and shadows are not part of the
   stability promise, and the 0.5 to 0.9 releases tuned several for
   contrast; the QA notes in `docs/qa/` list each change.

## If you wrote an adapter

- **Peer range.** Change your `uniskin` peer dependency to `^1.0.0` (or
  `>=0.9.0 <2.0.0` if you support both). An adapter that declares
  `>=0.1.0 <1.0.0` is refused or warned about at install against 1.0.
- **Nothing else is required.** The adapter interface, the five slots and
  the closed modifier sets are frozen. New components arrive in minors and
  fall back to the default style until your adapter covers them.
- **See how far you got.** `checkAdapter` from `uniskin/conformance`
  reports what your adapter leaves to the default style
  ([writing adapters](writing-adapters.md#checking-an-adapter)).
- **The coverage matrix.** `ui-table` no longer lists `disabled` and
  `active`: those are row (`<tr>`) selectors inside the table's base rule,
  never slots. Remove them from the table's `states` if you defined them.
- **`--ui-c-*` variables.** The composition variables are documented for
  adapter authors, but they are internal to the skins (see
  [stability](stability.md#what-is-not-stable)); pin your `uniskin` range if
  you rely on them beyond the documented model.

## Coming from 0.x vocabulary labels

The vocabulary label (`v1.15` at 0.9) is separate from the package version.
It counts additions, so a label that goes up never means a break. From 1.0,
new components add to it in minor releases.

## Where things stand per release

| You were on | Read |
|-------------|------|
| 0.1 to 0.4 | The [changelog](../packages/uniskin/CHANGELOG.md) entries from your version up: components added in 0.5 to 0.7 (accordion, progress, tooltip, toast, menu, avatar, skeleton, separator, breadcrumb, pagination, slider, the drawer placement) are new classes only. |
| 0.5 to 0.8 | Nothing to change. |
| 0.9 | Nothing to change. |
