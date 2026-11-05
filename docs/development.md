# Development

You need Git, a coding agent that supports Agent Skills, and [`gh`](https://cli.github.com/) where GitHub is the Issue tracker. The skills install nothing. The [lens](lens.md) needs only Claude Code (`claude --plugin-dir .`).

## Adding a Skill

1. Create `skills/forge-<name>/SKILL.md`, following [Coding Guidelines](coding-guidelines.md), then run `scripts/sync-shared.sh` to copy the shared layer in.
2. Link it from the Related Skills section of the skill before it in the workflow.
3. Add it to the Skills table and the skill count in `README.md`, and to `docs/architecture.md` if it changes the workflow.
4. If it joins the pipeline, update the lens by hand: `PIPELINE` and the next-step switch in `lens/hooks/parse.ts`, and `MAP` in `lens/hooks/views.tsx`.

## Modifying a Skill

- Read the whole `SKILL.md` first, and prefer a targeted edit.
- When changing a convention, grep every skill that states it (see [Shared Conventions](coding-guidelines.md#shared-conventions)).
- A `(delegate)` step has to work when run inline too.
- When changing a role, check every skill that delegates to it.
- After editing `skills/_shared/`, run `scripts/sync-shared.sh`. A grep also hits the copies under `skills/forge-*/_shared/`; never edit those.
- Exercise the change in a sandbox: see [Testing](testing.md#exercise-a-skill-change).
