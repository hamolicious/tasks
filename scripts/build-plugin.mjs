#!/usr/bin/env node
/**
 * Build one plugin's frontend half into `dist/<id>/<version>/` — the installed layout,
 * and exactly what the publish job zips.
 *
 *   node scripts/build-plugin.mjs extra-task-states     # one
 *   node scripts/build-plugin.mjs                       # every plugin with a frontend half
 *
 * The build itself is `vendor/vite.plugin-config.mjs`, copied unmodified from the
 * life-manager repo. That is the whole point: a plugin here is built by the same function
 * the base distribution is built by, with the same externals and the same output layout,
 * so the server cannot tell the two apart. Anything this script adds beyond calling it
 * would be a way for them to differ.
 *
 * The backend half, when a plugin grows one, is cargo's job and the pipeline's — see
 * `.plugin:build:backend` in the generated `.gitlab-ci.yml`. Nothing here touches it.
 */

import { relative } from "node:path";

import { build } from "vite";

import { pluginConfig } from "../vendor/vite.plugin-config.mjs";
import { distDir, readPlugins, repoRoot, requirePlugin } from "./plugins.mjs";

const [id] = process.argv.slice(2);

const targets = id
  ? [requirePlugin(id)]
  : readPlugins("cannot build").filter((plugin) => plugin.frontend);

if (targets.length === 0) {
  console.error("nothing to build: no plugin declares frontend.module");
  process.exit(1);
}

for (const plugin of targets) {
  if (!plugin.frontend) {
    // Asked for by name, so say why nothing happened rather than exiting 0 in silence —
    // a build job that produces no artifact is a confusing way to learn this.
    console.error(
      `${plugin.id}: no frontend.module in its manifest — there is no frontend half to build`,
    );
    process.exit(1);
  }

  const outDir = distDir(plugin);
  await build(pluginConfig({ root: plugin.dir, outDir }));
  console.log(`+ ${plugin.id}@${plugin.version} -> ${relative(repoRoot, outDir)}`);
}
