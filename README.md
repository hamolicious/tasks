# Extra task states

A ddd plugin that adds task markers beyond to do and done. It comes with three:

| Marker | Means | Counts as done |
| --- | --- | --- |
| `- [/]` | In progress | no |
| `- [-]` | Dropped | yes |
| `- [?]` | Question | no |

Without the plugin, these lines show as plain text and are not counted as tasks.

## Changing the states

Settings → Task states starts with the built-in **to do** (`- [ ]`) and **done** (`- [x]`).
You can change their name, icon, colours and text style (bold, italic, underline,
strikethrough); their markers stay `[ ]` and `[x]`. **Reset** returns one to its built-in
look.

Below them are the extra states. For each one you pick the marker (one character), its
name, its icon, its colours and text style, and whether it counts as done. Delete any you
don't want, including the three above, or add your own. "Restore the defaults" brings back
the three. The settings are per user.

Restyling to do and done needs ddd's `markdown` plugin 3.2 or newer.

Icons come from the `icons` plugin. Without it, the states show a plain character instead.

## Installing

Download `extra-task-states-<version>.zip` from
[public-artifacts/ddd-plugins](https://gitlab.slayhouse.net/public-artifacts/ddd-plugins/-/packages)
and upload it as an admin in Settings → Plugins. It needs the `markdown` plugin, which ships
with ddd.

## Developing

```bash
npm install
npm run check    # type-check
npm test         # unit tests
npm run build    # the installed layout, in dist/
npm run types -- --server https://your-server   # refresh types/ after the server changes
```

- `manifest.json`: id, version and dependencies.
- `src/index.tsx`: the plugin.
- `src/Settings.tsx`: the Task states settings section.
- `types/`: `@kernel`, `plugin:markdown`, `plugin:icons` and `plugin:settings`, as the server serves them.
- `tools/`: the reference build from the ddd repository. Do not edit.

## Releasing

Pushing to `main` tests, builds and publishes the plugin. Bump `version` in `manifest.json`
to release; a version that is already published is not replaced.
