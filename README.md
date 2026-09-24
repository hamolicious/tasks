# life-manager-plugins

Third-party plugins for [life-manager](../life-manager), one directory per plugin, each
independently versioned and independently published to this project's GitLab **generic**
package registry — which is where the in-app installer plugin reads them from.

```
plugins/<id>/
├── manifest.json     # SPEC §6.2 — the source of truth for the plugin *and* its pipeline
├── ci.json           # optional, not packaged — per-plugin pipeline overrides
└── src/
```

## Setup (once per clone)

```bash
./scripts/install-hooks.sh
```

This points `core.hooksPath` at `.githooks/`, which git cannot do for you. Without it the
pre-commit hook does not run, and `.gitlab-ci.yml` quietly goes stale — nothing in the
pipeline checks for that, so the hook is the whole mechanism.

## The pipeline is generated, not written

`.gitlab-ci.yml` is **generated** from the plugin manifests by `scripts/generate-ci.mjs`,
which the pre-commit hook runs and stages on every commit. Do not edit it; edit the
manifest, or `plugins/<id>/ci.json`, and commit.

```bash
node scripts/generate-ci.mjs            # regenerate
node scripts/generate-ci.mjs --check    # fail if stale
node scripts/generate-ci.mjs --stdout   # preview
```

Each plugin gets its own `test -> build -> publish` chain, wired with `needs:` so it never
waits on — and is never blocked by — another plugin's jobs:

```
test:frontend:<id> ──> build:frontend:<id> ──┐
                                             ├─> publish:<id>
test:backend:<id>  ──> build:backend:<id>  ──┘
```

A chain runs **automatically** only on a default-branch commit that touched
`plugins/<id>/**`. Everywhere else — feature branches, plugins the commit did not touch —
every job is **manual** and `allow_failure`, so the pipeline stays green until someone
clicks. Click in order: `test` unlocks `build` unlocks `publish`.

Which halves a plugin gets is read from its manifest: `frontend.module` gives it the node
jobs, `backend.module` the wasm32 cargo jobs, and a plugin with both gets both, joined at
`publish`.

## Publishing

`publish:<id>` packages the built halves as the installable zip of SPEC §6.2 — exactly
`manifest.json`, `frontend/**` and the declared wasm module, nothing else — and PUTs it at:

```
<gitlab>/api/v4/projects/<project id>/packages/generic/<id>/<version>/<id>-<version>.zip
```

The version comes from `manifest.json`. Publishing a version that already exists is a
no-op with a message rather than an overwrite, because the generic registry would
otherwise happily store different bytes under a version people have already installed —
bump `version` to release. (`FORCE_PUBLISH=1` as a pipeline variable overrides that.)

## Per-plugin overrides — `plugins/<id>/ci.json`

The *shape* of a pipeline is derivable from a manifest; the *commands* are not. Everything
below is optional, and the file is never part of the published package:

```json
{
  "enabled": true,
  "image": "node:22-alpine",
  "tags": ["docker"],
  "variables": { "FOO": "bar" },
  "frontend": { "image": "…", "before_script": ["…"], "test": ["…"], "build": ["…"] },
  "backend":  { "image": "…", "before_script": ["…"], "test": ["…"], "build": ["…"],
                "wasm": "target/wasm32-unknown-unknown/release/my_plugin.wasm" },
  "publish":  { "enabled": false }
}
```

House defaults live in one place — `DEFAULTS` at the top of `scripts/generate-ci.mjs`.

## How a plugin is built

```bash
npm ci
npm run ci:test  -- extra-task-states     # manifest/layout checks + tsc against the contract
npm run ci:build -- extra-task-states     # -> dist/<id>/<version>/
npm run ci:test                            # omit the id for every plugin
```

`scripts/build-plugin.mjs` is a thin wrapper around `vendor/vite.plugin-config.mjs`, which
is copied unmodified from life-manager's `plugins/base/_shared/`. Same builder, same
externals, same output layout as a base plugin — the server is not supposed to be able to
tell them apart, and the build of `extra-task-states` here is byte-identical to the one
upstream produces apart from a source-path comment.

`scripts/test-plugin.mjs` typechecks **one plugin at a time**, against a throwaway
tsconfig that narrows `include` to that plugin's sources. `tsc -p tsconfig.json` would
check them all at once, which would let a type error in plugin B fail plugin A's
pipeline — the coupling the per-plugin job chains exist to avoid. It also checks the
manifest against the disk: a declared `frontend.module` outside `frontend/`, a `style`
with no file, a `backend.module` with no `Cargo.toml`.

What the typecheck is really testing is `vendor/kernel.d.ts` — the plugin compiles against
the published contract and nothing else (SPEC §6.4), so a contract that dropped a type it
uses fails in CI rather than at load time in a browser. See `vendor/README.md`.

## Layout

```
.githooks/pre-commit        regenerates .gitlab-ci.yml and stages it
scripts/plugins.mjs         what a plugin directory is — one definition, three consumers
scripts/generate-ci.mjs     manifests -> .gitlab-ci.yml
scripts/build-plugin.mjs    one plugin -> dist/<id>/<version>/
scripts/test-plugin.mjs     layout checks + tsc, per plugin
vendor/                     kernel.d.ts and the reference Vite config, copied upstream
```
