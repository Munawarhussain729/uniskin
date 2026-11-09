# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities **privately** through GitHub
security advisories:

<https://github.com/Munawarhussain729/uniskin/security/advisories/new>

Do not open a public issue for a security problem. A good report
includes:

- what you found and where (package, file, version)
- steps to reproduce, if you have them
- the impact you believe it has

We aim to acknowledge reports within a few days. If a report is
accepted, we work on a fix, credit the reporter in the advisory (unless
they'd rather stay anonymous) and coordinate disclosure timing before
anything is made public.

## Scope

Uniskin is a build-time Tailwind CSS plugin: it emits CSS, ships no
runtime JavaScript and makes no network calls. Reports about the
`uniskin` plugin, the `uniskin` CLI and the published adapters
(`@uniskin/shadcn`, `@uniskin/daisyui`) are in scope. Issues confined to
the private demo apps (`apps/playground`, `apps/site`) are still welcome
but lower priority — they are never published.

## Supported versions

Only the latest published `0.x` release line receives fixes. Please
reproduce against `latest` from npm before reporting.
