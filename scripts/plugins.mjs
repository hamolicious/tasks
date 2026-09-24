/**
 * What a plugin directory is, and how to read one — the single definition, shared by the
 * pipeline generator, the builder and the typechecker.
 *
 * It lives apart from all three because they disagreed about it once already: a rule like
 * "a directory with no manifest is not a plugin" is only useful if every tool applies it
 * the same way, and the cost of two copies drifting is a pipeline that builds a directory
 * the packager then cannot package.
 *
 * Deliberately dependency-free: `generate-ci.mjs` imports this from a git hook, in a
 * clone that may have no `node_modules` at all.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const pluginsDir = join(repoRoot, "plugins");

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;

/**
 * Every plugin directory, plus everything wrong with the ones that are not.
 *
 * A directory with no `manifest.json` is not an error and not a plugin: the upstream repo
 * keeps Rust-only host fixtures beside real plugins and its build scripts skip them the
 * same way. Anything *with* a manifest is held to it.
 *
 * @returns {{ plugins: Plugin[], problems: string[] }}
 */
export function discoverPlugins() {
  if (!existsSync(pluginsDir)) return { plugins: [], problems: [] };

  const problems = [];
  const plugins = [];

  const names = readdirSync(pluginsDir)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."))
    .filter((name) => name !== "dist")
    .filter((name) => statSync(join(pluginsDir, name)).isDirectory())
    .sort();

  for (const name of names) {
    const dir = join(pluginsDir, name);
    const manifestPath = join(dir, "manifest.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = readJson(manifestPath, `plugins/${name}/manifest.json`, problems);
    if (manifest === undefined) continue;

    const ciPath = join(dir, "ci.json");
    const ci = existsSync(ciPath) ? readJson(ciPath, `plugins/${name}/ci.json`, problems) : {};
    if (ci === undefined) continue;

    if (manifest.id !== name) {
      problems.push(
        `plugins/${name}/manifest.json: id is ${JSON.stringify(manifest.id)} — ` +
          `the directory name is the plugin id`,
      );
      continue;
    }
    if (typeof manifest.version !== "string" || !SEMVER.test(manifest.version)) {
      problems.push(
        `plugins/${name}/manifest.json: version ${JSON.stringify(manifest.version)} is not x.y.z — ` +
          `it names the published package and its artifact paths`,
      );
      continue;
    }

    const frontend = Boolean(manifest.frontend?.module);
    const backend = Boolean(manifest.backend?.module);
    if (!frontend && !backend) {
      problems.push(
        `plugins/${name}/manifest.json: declares neither frontend.module nor backend.module — ` +
          `there is nothing to build`,
      );
      continue;
    }

    plugins.push({
      id: manifest.id,
      version: manifest.version,
      dir,
      relDir: `plugins/${name}`,
      manifest,
      frontend,
      backend,
      backendModule: manifest.backend?.module,
      ci,
      /** Excluded from the pipeline, but still a plugin as far as everything else goes. */
      enabled: ci.enabled !== false,
    });
  }

  return { plugins, problems };
}

function readJson(path, label, problems) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`${label}: not valid JSON — ${error.message}`);
    return undefined;
  }
}

/** `discoverPlugins`, but a malformed manifest is fatal. Prints every problem, not the first. */
export function readPlugins(context = "cannot continue") {
  const { plugins, problems } = discoverPlugins();
  if (problems.length > 0) {
    console.error(`${context}\n`);
    for (const problem of problems) console.error(`  ! ${problem}`);
    console.error("");
    process.exit(1);
  }
  return plugins;
}

/** One plugin by id, for the per-plugin CI jobs. Unknown ids list what there is. */
export function requirePlugin(id) {
  const plugins = readPlugins(`cannot read plugins/`);
  if (!id) {
    console.error(`usage: this script takes a plugin id\n\n  known: ${plugins.map((p) => p.id).join(", ") || "none"}`);
    process.exit(1);
  }
  const plugin = plugins.find((candidate) => candidate.id === id);
  if (!plugin) {
    console.error(`no plugin "${id}" in plugins/\n\n  known: ${plugins.map((p) => p.id).join(", ") || "none"}`);
    process.exit(1);
  }
  return plugin;
}

/**
 * Where a plugin's build output goes: `dist/<id>/<version>`, the installed layout, which
 * is also what the publish job zips.
 *
 * `$PLUGIN_DIST` wins when set, so the pipeline stays the one place that decides the
 * layout — if it ever moves, it moves in `generate-ci.mjs` and these scripts follow.
 */
export function distDir(plugin) {
  const override = process.env.PLUGIN_DIST;
  if (override) return resolve(repoRoot, override);
  return join(repoRoot, "dist", plugin.id, plugin.version);
}

/** Default cargo artifact for a wasm half: cargo snake-cases the package name. */
export function defaultWasmPath(id) {
  return `target/wasm32-unknown-unknown/release/${id.replaceAll("-", "_")}.wasm`;
}
