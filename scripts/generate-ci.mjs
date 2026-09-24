#!/usr/bin/env node
/**
 * Generate `.gitlab-ci.yml` from the plugin manifests under `plugins/`.
 *
 * The monorepo holds N independent, independently-versioned plugins, and GitLab has no
 * native notion of "one pipeline per subdirectory". What it does have is `extends` (job
 * inheritance) and `needs` (a DAG that ignores stage barriers) — so the pipeline this
 * writes is a **base job per kind of work**, instantiated once per plugin with that
 * plugin's id and version, wired into a private `test -> build -> publish` chain:
 *
 *     test:frontend:alt-editor ──> build:frontend:alt-editor ──┐
 *                                                              ├─> publish:alt-editor
 *     test:backend:alt-editor  ──> build:backend:alt-editor  ──┘
 *
 * Every job in a chain `needs:` only jobs from the same chain, so a plugin never waits on
 * — and is never blocked by — another plugin's failure. `needs: []` on the test jobs is
 * what drops the stage barrier at the front; `stages:` survives only to order the columns
 * in the pipeline view.
 *
 * **When a chain runs** is one rule set, generated per plugin because `rules:changes`
 * wants a literal path:
 *
 *   - on the default branch, when that commit touched `plugins/<id>/**` -> automatic
 *   - anywhere else (feature branch, unchanged plugin, re-run of an old commit) -> manual
 *
 * Manual jobs are `allow_failure: true` so an un-clicked chain leaves the pipeline green
 * instead of "blocked". A manual chain is clicked through in order: `test` unlocks
 * `build` unlocks `publish` (a job whose `needs` were skipped is not playable).
 *
 * ## Inputs
 *
 * `plugins/<id>/manifest.json` — the SPEC §6.2 manifest, the source of truth. Its
 * `frontend.module` / `backend.module` decide which halves get jobs; `version` is baked
 * into the artifact paths and the published package version.
 *
 * `plugins/<id>/ci.json` — optional, *not* part of the plugin package. Overrides for this
 * plugin's jobs, all keys optional:
 *
 * ```json
 * {
 *   "enabled": true,
 *   "image": "node:22-alpine",
 *   "tags": ["docker"],
 *   "variables": { "FOO": "bar" },
 *   "frontend": { "image": "...", "before_script": ["..."], "test": ["..."], "build": ["..."] },
 *   "backend":  { "image": "...", "before_script": ["..."], "test": ["..."], "build": ["..."],
 *                 "wasm": "target/wasm32-unknown-unknown/release/my_plugin.wasm" },
 *   "publish":  { "enabled": true, "image": "..." }
 * }
 * ```
 *
 * The overrides exist because the *shape* of a pipeline is derivable from a manifest but
 * the *commands* are not, and a plugin that needs a different build than the house one
 * should not need this script edited.
 *
 * ## Usage
 *
 *   node scripts/generate-ci.mjs            # write .gitlab-ci.yml
 *   node scripts/generate-ci.mjs --check    # exit 1 if the committed file is stale
 *   node scripts/generate-ci.mjs --stdout   # print, write nothing
 *
 * `.githooks/pre-commit` runs the first form and stages the result, so the file is never
 * hand-maintained. `--check` is there for when you want to ask the question by hand; the
 * pipeline does not run it, because a generated file that is wrong enough to matter is
 * also the file GitLab would have refused to start a pipeline from.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { defaultWasmPath, readPlugins, repoRoot } from "./plugins.mjs";

/** GitLab reads `.gitlab-ci.yml` and only that name unless the project overrides the path. */
const OUT_FILE = ".gitlab-ci.yml";

/**
 * The house defaults — the one place to change how *every* plugin is tested and built.
 *
 * The frontend commands are the repo's own `ci:test` / `ci:build` scripts, each taking a
 * plugin id and writing `$PLUGIN_DIST` (`dist/<id>/<version>/`: manifest + `frontend/**`).
 * The backend commands assume the plugin directory is its own cargo package whose
 * `cdylib` is built for `wasm32-unknown-unknown`, as `plugins/examples/hello-backend` is
 * in the life-manager repo — speculative until the first plugin here grows a wasm half.
 */
const DEFAULTS = {
  images: {
    node: "node:22-alpine",
    rust: "rust:1-slim",
    // Publishing needs curl and zip and nothing else; it must not depend on the plugin's
    // own toolchain, because it is the one job shared by every kind of plugin.
    publish: "alpine:3.21",
  },
  frontend: {
    before_script: ["npm ci --cache .npm --prefer-offline --no-audit --no-fund"],
    test: ['npm run ci:test -- "$PLUGIN_ID"'],
    build: ['npm run ci:build -- "$PLUGIN_ID"'],
  },
  backend: {
    before_script: ["rustup target add wasm32-unknown-unknown"],
    test: [
      'cargo fmt --manifest-path "$PLUGIN_DIR/Cargo.toml" --check',
      'cargo clippy --manifest-path "$PLUGIN_DIR/Cargo.toml" --all-targets --target wasm32-unknown-unknown -- -D warnings',
    ],
    build: [
      'cargo build --locked --release --target wasm32-unknown-unknown --manifest-path "$PLUGIN_DIR/Cargo.toml"',
      'mkdir -p "$PLUGIN_DIST"',
      // The manifest names the module the installer will look for; the cargo artifact is
      // named after the crate. Copying bridges the two, and keeps `$PLUGIN_DIST` the one
      // directory the publish job has to know about.
      'cp "$PLUGIN_WASM" "$PLUGIN_DIST/$PLUGIN_BACKEND_MODULE"',
    ],
  },
};

// ── a very small YAML writer ───────────────────────────────────────────────────────────
//
// Hand-rolled rather than a dependency: this script runs from a git hook on every commit,
// in a repo that may have no `node_modules` at all, so it has to work with nothing
// installed. The subset it emits is block maps, block sequences, scalars and `|` blocks,
// which is all a `.gitlab-ci.yml` is.

const PLAIN = /^[A-Za-z_][A-Za-z0-9_.\-/:@]*$/;
const RESERVED = /^(y|Y|yes|Yes|YES|n|N|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF|null|Null|NULL|~)$/;
const NUMERIC = /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;

function scalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const text = String(value);
  if (text === "") return '""';
  const plain =
    PLAIN.test(text) &&
    !RESERVED.test(text) &&
    !NUMERIC.test(text) &&
    !text.includes(":") &&
    !text.includes(" #");
  // JSON string escaping is a strict subset of YAML's double-quoted style, so this is
  // always safe — including for the `$VAR` and `"` that shell one-liners are made of.
  return plain ? text : JSON.stringify(text);
}

const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function emitMap(map, indent, out) {
  const pad = " ".repeat(indent);
  for (const [key, value] of Object.entries(map)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        out.push(`${pad}${key}: []`);
        continue;
      }
      out.push(`${pad}${key}:`);
      emitSeq(value, indent + 2, out);
    } else if (isMap(value)) {
      if (Object.keys(value).length === 0) {
        out.push(`${pad}${key}: {}`);
        continue;
      }
      out.push(`${pad}${key}:`);
      emitMap(value, indent + 2, out);
    } else if (typeof value === "string" && value.includes("\n")) {
      out.push(`${pad}${key}: |`);
      pushBlock(value, indent + 2, out);
    } else {
      out.push(`${pad}${key}: ${scalar(value)}`);
    }
  }
}

function emitSeq(seq, indent, out) {
  const pad = " ".repeat(indent);
  for (const item of seq) {
    if (isMap(item)) {
      const lines = [];
      emitMap(item, indent + 2, lines);
      // `- ` occupies the two columns the nested map was indented by, so the first line
      // moves onto the dash and the rest already line up under it.
      lines[0] = `${pad}- ${lines[0].slice(indent + 2)}`;
      out.push(...lines);
    } else if (typeof item === "string" && item.includes("\n")) {
      out.push(`${pad}- |`);
      pushBlock(item, indent + 2, out);
    } else {
      out.push(`${pad}- ${scalar(item)}`);
    }
  }
}

function pushBlock(text, indent, out) {
  const pad = " ".repeat(indent);
  for (const line of text.replace(/\n+$/, "").split("\n")) out.push(line ? pad + line : "");
}

/** One top-level block: an optional comment, then `name:` and its body. */
function block(comment, name, body) {
  const out = [];
  if (comment) for (const line of comment.split("\n")) out.push(line ? `# ${line}` : "#");
  if (name === null) emitMap(body, 0, out);
  else {
    out.push(`${name}:`);
    emitMap(body, 2, out);
  }
  return out.join("\n");
}

// ── the pipeline ───────────────────────────────────────────────────────────────────────

function generate(plugins) {
  const blocks = [];

  blocks.push(
    [
      "# ─────────────────────────────────────────────────────────────────────────────────",
      "# GENERATED FILE — do not edit by hand; your edit will be overwritten.",
      "#",
      "# Written by `scripts/generate-ci.mjs`, which `.githooks/pre-commit` runs on every",
      "# commit. The source of truth is each `plugins/<id>/manifest.json` (plus an optional",
      "# `plugins/<id>/ci.json` for per-plugin overrides) — change those, not this file.",
      "#",
      "#   regenerate:  node scripts/generate-ci.mjs",
      "#   verify:      node scripts/generate-ci.mjs --check",
      "#   install the hook in a fresh clone:  ./scripts/install-hooks.sh",
      "#",
      `# ${plugins.length} plugin(s): ${plugins.length ? plugins.map((p) => `${p.id}@${p.version}`).join(", ") : "none"}`,
      "# ─────────────────────────────────────────────────────────────────────────────────",
    ].join("\n"),
  );

  blocks.push(
    block(
      "Branch pipelines only. Every rule below keys off $CI_COMMIT_BRANCH, and letting\n" +
        "merge-request pipelines through as well would double every job for no new signal.",
      "workflow",
      { rules: [{ if: '$CI_PIPELINE_SOURCE == "merge_request_event"', when: "never" }, { when: "always" }] },
    ),
  );

  // `stages` is a bare sequence, which the map writer below cannot express, so it is the
  // one block written literally.
  blocks.push(
    [
      "# Column order in the pipeline view, and nothing more: every job declares `needs`,",
      "# which takes it out of the stage queue entirely (GitLab DAG). That is what keeps one",
      "# plugin's chain from waiting on another plugin's tests.",
      "stages:",
      ...["test", "build", "publish"].map((stage) => `  - ${stage}`),
    ].join("\n"),
  );

  blocks.push(
    block(null, "variables", {
      GIT_DEPTH: "50",
      // Both the build jobs (as an artifact path) and the publish job (as the thing it
      // packages) derive from this, so the layout is stated once.
      PLUGIN_DIST_ROOT: "dist",
      NODE_IMAGE: DEFAULTS.images.node,
      RUST_IMAGE: DEFAULTS.images.rust,
      PUBLISH_IMAGE: DEFAULTS.images.publish,
      // The npm cache lives in the project dir so GitLab's cache can actually see it.
      npm_config_cache: "$CI_PROJECT_DIR/.npm",
      CARGO_HOME: "$CI_PROJECT_DIR/.cargo",
      CARGO_TARGET_DIR: "$CI_PROJECT_DIR/target",
    }),
  );

  // ── base jobs ────────────────────────────────────────────────────────────────────────

  blocks.push(
    block(
      "── base jobs ─────────────────────────────────────────────────────────────────────\n" +
        "\n" +
        "Everything shared by every plugin. A concrete job is one of these plus two generated\n" +
        "fragments: `.vars:<id>` (which plugin) and `.rules:<id>` (when it runs).",
      ".plugin",
      {
        interruptible: true,
        variables: {
          PLUGIN_DIR: "plugins/$PLUGIN_ID",
          PLUGIN_DIST: "$PLUGIN_DIST_ROOT/$PLUGIN_ID/$PLUGIN_VERSION",
        },
      },
    ),
  );

  blocks.push(
    block("The frontend half: an ES module + assets, built with the repo's node toolchain.", ".plugin:frontend", {
      extends: ".plugin",
      image: "$NODE_IMAGE",
      cache: { key: "npm", paths: [".npm/"] },
      before_script: DEFAULTS.frontend.before_script,
    }),
  );

  blocks.push(
    block(
      "The backend half: a cargo package compiled to wasm32 for the Extism host (SPEC §6.3).",
      ".plugin:backend",
      {
        extends: ".plugin",
        image: "$RUST_IMAGE",
        cache: { key: "cargo", paths: [".cargo/registry/", "target/"] },
        before_script: DEFAULTS.backend.before_script,
      },
    ),
  );

  blocks.push(
    block(null, ".plugin:test:frontend", {
      extends: ".plugin:frontend",
      stage: "test",
      script: DEFAULTS.frontend.test,
    }),
  );

  blocks.push(
    block(
      "Artifacts are declared here with `$PLUGIN_DIST` rather than in each job with a literal\n" +
        "path: GitLab expands variables in `artifacts:paths`, so one declaration covers every\n" +
        "plugin and the version in the path stays wherever the manifest put it.",
      ".plugin:build:frontend",
      {
        extends: ".plugin:frontend",
        stage: "build",
        script: DEFAULTS.frontend.build,
        artifacts: { name: "$PLUGIN_ID-$PLUGIN_VERSION-frontend", paths: ["$PLUGIN_DIST/"], expire_in: "1 week" },
      },
    ),
  );

  blocks.push(
    block(null, ".plugin:test:backend", {
      extends: ".plugin:backend",
      stage: "test",
      script: DEFAULTS.backend.test,
    }),
  );

  blocks.push(
    block(null, ".plugin:build:backend", {
      extends: ".plugin:backend",
      stage: "build",
      script: DEFAULTS.backend.build,
      artifacts: { name: "$PLUGIN_ID-$PLUGIN_VERSION-backend", paths: ["$PLUGIN_DIST/"], expire_in: "1 week" },
    }),
  );

  blocks.push(
    block(
      "Package the built halves as the installable zip of SPEC §6.2 and PUT it into this\n" +
        "project's **generic** package registry, which is what the installer plugin reads:\n" +
        "\n" +
        "  <gitlab>/api/v4/projects/<id>/packages/generic/<plugin-id>/<version>/<plugin-id>-<version>.zip\n" +
        "\n" +
        "It zips a staging directory holding exactly the allowlist the installer accepts —\n" +
        "manifest.json, the declared wasm module, frontend/** — rather than the build output\n" +
        "wholesale, because the installer rejects any entry outside that set by design, and a\n" +
        "stray file from a build tool would fail the install naming a file nobody put there.\n" +
        "\n" +
        "$CI_JOB_TOKEN authenticates as the pipeline; no deploy token needed for the project's\n" +
        "own registry.",
      ".plugin:publish",
      {
        extends: ".plugin",
        stage: "publish",
        image: "$PUBLISH_IMAGE",
        script: [
          [
            "set -eu",
            "apk add --no-cache curl zip > /dev/null",
            "",
            'pkg="${PLUGIN_ID}-${PLUGIN_VERSION}.zip"',
            'base="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/${PLUGIN_ID}/${PLUGIN_VERSION}"',
            "",
            'if [ ! -d "$PLUGIN_DIST" ]; then',
            '  echo "no build output at $PLUGIN_DIST — the build job produced nothing" >&2',
            "  exit 1",
            "fi",
            "",
            "# The generic registry accepts a re-upload of a version it already has: it keeps",
            "# both files under the same name. Since this job runs automatically on every",
            "# default-branch commit that touches the plugin, an unbumped version would",
            "# silently publish *different bytes* under a version people already installed.",
            "# -fs, not -fsS: the 404 that means \"not published yet\" is the *expected*",
            "# answer here, and -S would print it as `curl: (22) ... error: 404` in the",
            "# middle of a job that is about to succeed.",
            'if [ -z "${FORCE_PUBLISH:-}" ] && curl -fs -o /dev/null -r 0-0 \\',
            '     --header "JOB-TOKEN: $CI_JOB_TOKEN" "$base/$pkg"; then',
            '  echo "$PLUGIN_ID@$PLUGIN_VERSION is already published — bump \\"version\\" in"',
            '  echo "$PLUGIN_DIR/manifest.json to release a new one, or run this job with"',
            '  echo "FORCE_PUBLISH=1 to overwrite it."',
            "  exit 0",
            "fi",
            "",
            'stage="$(mktemp -d)"',
            'cp "$PLUGIN_DIR/manifest.json" "$stage/manifest.json"',
            'if [ -d "$PLUGIN_DIST/frontend" ]; then cp -r "$PLUGIN_DIST/frontend" "$stage/frontend"; fi',
            'if [ -n "${PLUGIN_BACKEND_MODULE:-}" ]; then',
            '  cp "$PLUGIN_DIST/$PLUGIN_BACKEND_MODULE" "$stage/$PLUGIN_BACKEND_MODULE"',
            "fi",
            "",
            '( cd "$stage" && zip -qr "$CI_PROJECT_DIR/$pkg" . )',
            "# The 201 body carries no information the exit status does not, and printing",
            "# it runs into the line below (it has no trailing newline).",
            'curl -fsS --retry 3 -o /dev/null --header "JOB-TOKEN: $CI_JOB_TOKEN" \\',
            '     --upload-file "$CI_PROJECT_DIR/$pkg" "$base/$pkg"',
            "",
            'echo "published $base/$pkg"',
          ].join("\n"),
        ],
      },
    ),
  );

  // ── per-plugin jobs ──────────────────────────────────────────────────────────────────

  for (const plugin of plugins) blocks.push(...pluginBlocks(plugin));

  return blocks.join("\n\n") + "\n";
}

function pluginBlocks(plugin) {
  const { id, version, ci } = plugin;
  const dir = `plugins/${id}`;
  const out = [];

  const halves = [plugin.frontend && "frontend", plugin.backend && "backend"].filter(Boolean);

  out.push(
    [
      `# ${"═".repeat(2)} ${id}@${version} ${"═".repeat(Math.max(3, 86 - id.length - version.length))}`,
      `# halves: ${halves.join(" + ")}`,
    ].join("\n"),
  );

  // Which plugin. Kept separate from the rules so the three jobs share one definition of
  // each, and a diff of this file shows a version bump as a one-line change.
  const variables = {
    PLUGIN_ID: id,
    PLUGIN_VERSION: version,
    ...(plugin.backend ? { PLUGIN_BACKEND_MODULE: plugin.backendModule } : {}),
    ...(plugin.backend ? { PLUGIN_WASM: ci.backend?.wasm ?? defaultWasmPath(id) } : {}),
    ...(ci.variables ?? {}),
  };
  out.push(block(null, `.vars:${id}`, { variables }));

  // When the chain runs. `changes:` needs a literal path — which is the reason this file
  // is generated rather than written once with a matrix.
  out.push(
    block(
      "Automatic only for a default-branch commit that touched this plugin; manual everywhere\n" +
        "else, and `allow_failure` so an un-clicked chain still leaves the pipeline green.\n" +
        "`ci.json` and the plugin's own sources are both in scope; a regenerated .gitlab-ci.yml\n" +
        "deliberately is not, or every version bump would rebuild every plugin.",
      `.rules:${id}`,
      {
        rules: [
          {
            if: "$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH",
            changes: [`${dir}/**/*`],
            when: "on_success",
          },
          { when: "manual", allow_failure: true },
        ],
      },
    ),
  );

  const common = (overrides) => ({
    ...(overrides?.image || ci.image ? { image: overrides?.image ?? ci.image } : {}),
    ...(ci.tags ? { tags: ci.tags } : {}),
  });

  for (const half of halves) {
    const overrides = ci[half] ?? {};
    const extendsList = [`.plugin:test:${half}`, `.vars:${id}`, `.rules:${id}`];

    out.push(
      block(null, `test:${half}:${id}`, {
        extends: extendsList,
        needs: [],
        ...common(overrides),
        ...(overrides.before_script ? { before_script: overrides.before_script } : {}),
        ...(overrides.test ? { script: overrides.test } : {}),
      }),
    );

    out.push(
      block(null, `build:${half}:${id}`, {
        extends: [`.plugin:build:${half}`, `.vars:${id}`, `.rules:${id}`],
        needs: [{ job: `test:${half}:${id}`, artifacts: false }],
        ...common(overrides),
        ...(overrides.before_script ? { before_script: overrides.before_script } : {}),
        ...(overrides.build ? { script: overrides.build } : {}),
      }),
    );
  }

  if (ci.publish?.enabled !== false) {
    out.push(
      block(null, `publish:${id}`, {
        extends: [".plugin:publish", `.vars:${id}`, `.rules:${id}`],
        // Both halves' artifacts unpack into the same `$PLUGIN_DIST`, which is how one zip
        // ends up with both.
        needs: halves.map((half) => ({ job: `build:${half}:${id}`, artifacts: true })),
        ...common(ci.publish),
        ...(ci.publish?.before_script ? { before_script: ci.publish.before_script } : {}),
      }),
    );
  }

  return out;
}

// ── entry point ────────────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const plugins = readPlugins(`generate-ci: cannot generate ${OUT_FILE}`).filter((plugin) => plugin.enabled);
const yaml = generate(plugins);
const outPath = join(repoRoot, OUT_FILE);

if (args.has("--stdout")) {
  process.stdout.write(yaml);
} else if (args.has("--check")) {
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  if (current !== yaml) {
    console.error(
      `${OUT_FILE} is out of date with plugins/*/manifest.json.\n\n` +
        `  run:  node scripts/generate-ci.mjs\n` +
        `  then commit the result. (Install the hook once with ./scripts/install-hooks.sh\n` +
        `  and this cannot happen again.)`,
    );
    process.exit(1);
  }
  if (!args.has("--quiet")) console.log(`${OUT_FILE} is up to date (${plugins.length} plugin(s))`);
} else {
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (current === yaml) {
    if (!args.has("--quiet")) console.log(`${OUT_FILE} unchanged (${plugins.length} plugin(s))`);
  } else {
    writeFileSync(outPath, yaml);
    console.log(
      `${current === null ? "wrote" : "updated"} ${OUT_FILE} — ` +
        `${plugins.length} plugin(s): ${plugins.map((p) => `${p.id}@${p.version}`).join(", ") || "none"}`,
    );
  }
}
