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

## What the default commands expect

Not yet built — the repo has no toolchain of its own so far:

- **frontend**: a root `package.json` with `ci:test` and `ci:build` scripts, each taking a
  plugin id and writing `$PLUGIN_DIST` (`dist/<id>/<version>/`: `manifest.json` +
  `frontend/**`), mirroring `web/scripts/build-examples.mjs` in the life-manager repo.
  The jobs export `PLUGIN_ID`, `PLUGIN_VERSION`, `PLUGIN_DIR` and `PLUGIN_DIST`.
- **backend**: the plugin directory is its own cargo package producing a `cdylib` for
  `wasm32-unknown-unknown`.
