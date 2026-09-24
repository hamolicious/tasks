# `extra-task-states`

Adds `[/]` in progress, `[-]` dropped and `[?]` question to the markdown task-state
registry (SPEC §6.6).

Installing it changes the meaning of text that was already there: a client without it
renders `- [/] thing` as the literal text `[/] thing` and counts one fewer task. That is
the point of a marker registry, and the spec calls it out as risk 7.

`done` is the field worth reading twice. "In progress" and "Question" are **not** done;
"Dropped" is `done: true` — not because it was finished, but because `done` answers
"should this still be chased", which is what every task count is really asking.

| | |
|---|---|
| Contract | `kernel ^1.0` |
| Depends on | `markdown ^1.0` |
| Halves | frontend only |
| Published | `packages/generic/extra-task-states/<version>/extra-task-states-<version>.zip` |

Build it with `npm run ci:build -- extra-task-states`; see the repo README for the rest.
