#!/usr/bin/env node
/**
 * The gate a plugin passes before it is built: does it still compile against the
 * contract, and is its manifest telling the truth about its own files?
 *
 *   node scripts/test-plugin.mjs extra-task-states     # one
 *   node scripts/test-plugin.mjs                       # every plugin
 *
 * **One plugin at a time, by construction.** `tsc -p tsconfig.json` would typecheck every
 * plugin in the repo at once, which would mean a type error in plugin B failing plugin
 * A's pipeline — the exact coupling the per-plugin job chains exist to avoid. So this
 * writes a throwaway config that extends `tsconfig.json` and narrows `include` to one
 * plugin's sources, and runs tsc against that.
 *
 * What the typecheck is really checking is `vendor/kernel.d.ts`: the plugin is compiled
 * against the published contract and nothing else (SPEC §6.4), so a contract that dropped
 * a type this plugin uses fails here rather than at load time in someone's browser.
 */

import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { readPlugins, repoRoot, requirePlugin } from "./plugins.mjs";

const [id] = process.argv.slice(2);
const targets = id ? [requirePlugin(id)] : readPlugins("cannot test");

if (targets.length === 0) {
  console.error("nothing to test: no plugin directories");
  process.exit(1);
}

let failed = false;

for (const plugin of targets) {
  const problems = checkLayout(plugin);
  for (const problem of problems) console.error(`  ! ${plugin.id}: ${problem}`);
  if (problems.length > 0) {
    failed = true;
    continue;
  }

  if (!plugin.frontend) {
    console.log(`= ${plugin.id}@${plugin.version}: no frontend half, nothing to typecheck`);
    continue;
  }

  if (!typecheck(plugin)) failed = true;
  else console.log(`✓ ${plugin.id}@${plugin.version}`);
}

process.exit(failed ? 1 : 0);

/**
 * The manifest names files; this is where those names are checked against the disk. Cheap,
 * and it catches the class of mistake that otherwise surfaces as a plugin that installs
 * and then does nothing — a `frontend.module` the build never writes, a `style` the
 * kernel links and 404s on.
 */
function checkLayout(plugin) {
  const problems = [];
  const { manifest } = plugin;

  if (plugin.frontend) {
    const entry = join(plugin.dir, "src", "index.tsx");
    if (!existsSync(entry)) {
      problems.push(`declares frontend.module but has no src/index.tsx (the build's entry point)`);
    }
    if (!manifest.frontend.module.startsWith("frontend/")) {
      problems.push(
        `frontend.module is "${manifest.frontend.module}" — it must live under frontend/, ` +
          `which is the only directory the installer accepts assets from (SPEC §6.2)`,
      );
    }
    const style = manifest.frontend.style;
    if (style) {
      if (!style.startsWith("frontend/")) {
        problems.push(`frontend.style is "${style}" — it must live under frontend/`);
      } else if (!existsSync(join(plugin.dir, "src", basename(style)))) {
        problems.push(`declares frontend.style "${style}" but src/${basename(style)} does not exist`);
      }
    }
  }

  if (plugin.backend && !existsSync(join(plugin.dir, "Cargo.toml"))) {
    problems.push(`declares backend.module but has no Cargo.toml`);
  }

  return problems;
}

function typecheck(plugin) {
  const configPath = join(repoRoot, `.tsconfig.${plugin.id}.json`);
  writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        extends: "./tsconfig.json",
        include: [
          "vendor/kernel.d.ts",
          `${plugin.relDir}/src/**/*.ts`,
          `${plugin.relDir}/src/**/*.tsx`,
        ],
      },
      null,
      2,
    )}\n`,
  );

  try {
    const tsc = join(repoRoot, "node_modules", ".bin", "tsc");
    if (!existsSync(tsc)) {
      console.error("typescript is not installed — run `npm ci`");
      return false;
    }
    const result = spawnSync(tsc, ["--noEmit", "-p", configPath], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    return result.status === 0;
  } finally {
    rmSync(configPath, { force: true });
  }
}
