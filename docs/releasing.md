# Releasing

Releases are two phases: an automated **Version Packages** PR, then a
**manual** publish by the owner. Nothing publishes to npm from CI — there
is no npm token in the workflows and no `publish` step.

## What the automation does

`.github/workflows/release.yml` runs `changesets/action` in version-PR
mode on every push to `main`:

- If pending changesets exist, it runs `pnpm changeset version` — bumps
  versions, rewrites changelogs, applies internal `workspace:^` bumps
  (`updateInternalDependencies: "patch"` in `.changeset/config.json`) —
  and opens or updates a PR titled **"Version Packages"**.
- If nothing is pending, the PR closes itself / stays absent.

Feature PRs should include a changeset (`pnpm changeset`) when they
change published behaviour.

## The manual sequence (owner)

1. **Review the "Version Packages" PR.** Check the bumped versions and
   changelogs. To change a bump, push a commit editing the pending
   `.changeset/*.md` files; the action regenerates the PR on the next
   push to `main`.
2. **Merge the PR.** Squash or merge normally.
3. **Publish locally with 2FA.** Publishing happens from the owner's
   machine, in dependency order — `uniskin` first, because both adapters
   declare `uniskin` as a peer dependency:

   ```sh
   git checkout main && git pull
   pnpm install --frozen-lockfile
   pnpm lint && pnpm -r build && pnpm -r test

   pnpm --filter uniskin publish           # 1st — core plugin
   pnpm --filter @uniskin/shadcn publish   # 2nd — peers on uniskin
   pnpm --filter @uniskin/daisyui publish  # 3rd — peers on uniskin
   ```

   Each `pnpm publish` prompts for the npm OTP. `pnpm -r publish` also
   works — it publishes workspace packages in topological order — but
   doing them one at a time makes the order and the OTP prompts explicit.
4. **Tag the release** if you want git tags (`git tag uniskin@x.y.z &&
   git push --tags`) — changesets does not create tags in this repo's
   workflow.
5. **Smoke-test the published packages** with
   `scripts/release-smoke.sh <version>` — see
   [smoke-test.md](smoke-test.md).

## Dependency order

```
uniskin ──> @uniskin/shadcn ──> (peer) uniskin
        └─> @uniskin/daisyui ─> (peer) uniskin, (optional peer) daisyui
```

`uniskin` must reach the registry **before** the adapters so their
`"uniskin": "workspace:^"` peer range resolves against a published
version. Publishing an adapter first would succeed on npm's side (peers
aren't validated at publish time) but would leave a window where
installing it resolves an older — or no — compatible uniskin.
