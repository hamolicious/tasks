# Extra task states

A ddd plugin that adds three task markers to notes:

| Marker | Means | Counts as done |
| --- | --- | --- |
| `- [/]` | In progress | no |
| `- [-]` | Dropped | yes |
| `- [?]` | Question | no |

Without the plugin, these lines show as plain text and are not counted as tasks.

## Installing

Download `extra-task-states-<version>.zip` from
[public-artifacts/ddd-plugins](https://gitlab.slayhouse.net/public-artifacts/ddd-plugins/-/packages)
and upload it as an admin in Settings → Plugins. It needs the `markdown` plugin, which ships
with ddd.

## Developing

```bash
npm install
npm run check    # type-check
npm run build    # the installed layout, in dist/
npm run types -- --server https://your-server   # refresh types/ after the server changes
```

- `manifest.json`: id, version and dependencies.
- `src/index.tsx`: the plugin.
- `types/`: `@kernel` and `plugin:markdown`, as the server serves them.
- `tools/`: the reference build from the ddd repository. Do not edit.

## Releasing

Pushing to `main` tests, builds and publishes the plugin. Bump `version` in `manifest.json`
to release; a version that is already published is not replaced.
