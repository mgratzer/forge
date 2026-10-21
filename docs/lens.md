# Lens

The lens is an optional Claude Code view over a forge run. It lives in `lens/` and ships with the skills in the Claude Code plugin. The skills don't depend on it: it only reads text they already print, so they stay portable and every other agent keeps working without it.

## Install

```
/plugin install forge --marketplace mgratzer/forge
```

The plugin brings the skills and the lens. It carries no `version`, so an install is keyed by commit and an update brings whatever `main` holds: `claude plugin update forge@forge`, or turn on auto-update for the marketplace under `/plugin`. Pick one channel per machine: the plugin for Claude Code, or `npx skills add mgratzer/forge` for other agents. With both, Claude Code lists every skill twice, once as `/forge-ship` and once as `/forge:forge-ship`.

## What It Shows

| View | Opens with | Shows |
|------|------------|-------|
| Pipeline pane | a forge skill starting, `/forge pane` (toggles) | the pipeline with the current step (setup-project only until the repo has `AGENTS.md`), the latest status, the PR's CI and review state, review findings as a checklist, the `## Risk` card, a timeline |
| Status line | always, while a run is open | skill, phase, state, guard round, CI count |
| Next step | a band above the prompt, and the prompt suggestion (Tab) | the command that most likely comes next, and why |
| Config pane | `/forge config` | the `## Unattended Shipping` settings with defaults filled in, the Issue tracker, `FORGE_STATUS_CMD` and `FORGE_LAUNCHER` |
| Waves pane | `forge-batch` output, `/forge waves` | each Wave's Issues, touch sets, adjacency and serialized notes, excluded Issues |

`/forge` says where the run is and what to run next, `/forge map` explains the pipeline, and `/forge demo` replays a guarded ship run (`demo stuck` ends at `needs-human`, `demo batch` fills the Waves pane) without touching GitHub. A terminal state also sends a notification, and a repository without `AGENTS.md`, or with the old `## Shipping` heading, gets one toast.

A pane the person closes stays closed for later runs until they open it again.

## The Text It Reads

The lens has no channel into the skills: it parses what they write. These formats are its contract:

| Format | Defined in | Parsed by |
|--------|------------|-----------|
| The status call in a Bash command: `"$FORGE_STATUS_CMD" <state> "<detail>"` and its `echo "[forge] <state>: <detail>"` fallback | `skills/_shared/status-reporting.md` | `statusCalls` |
| `### <file>` over `- [P0] <finding>` | `skills/_shared/roles/forge-reviewer.md` | `findings` |
| The `## Risk` section and `**Result:**` line | `skills/_shared/risk-rubric.md`, `skills/forge-land/SKILL.md` | `riskSection`, `resultLine` |
| `## Batch:` with one table per Wave | `skills/forge-batch/SKILL.md` | `batch` |
| `## Unattended Shipping` settings | `skills/_shared/unattended-config.md` | `unattended` |

Changing one of these formats means updating `lens/hooks/parse.ts` and `lens/tests/` in the same PR.

The lens reads status from the command a skill wrote, never from command output, which any file or tool can fill, and a terminal state counts only when that command succeeded. It follows PR links only into the session's repository, and it treats a `## Risk` verdict as valid only on the PR's head commit: the card says when the verdict is stale. It suggests merging only after forge-land reported `merge-ready` and the low risk verdict is on the head, and the suggested `gh pr merge` carries `--match-head-commit`, so a head that moved since cannot be merged.

## Working on It

```bash
claude --plugin-dir .   # load this checkout's skills and lens for one session
tsc -p .                # type-check, once a session has loaded the plugin
```

Biome, `claude plugin validate` and `claude plugin test` run in CI; [Testing](testing.md) has the commands.

The lens is TypeScript run by Claude Code itself: no build step and no dependencies. Claude Code writes its API types to `.claude-plugin/types/` and a `tsconfig.json` when a session loads the plugin from a folder (both git-ignored), so type-checking is local only; CI runs Biome, `validate` and `test`. Hooks may only change the state model through pure functions in `lens/hooks/model.ts`, because Claude Code refuses a module that passes `$` to a helper; side effects (`gh`, notifications, the status line, the demo) run in the one-second loop in `register.tsx`.

The mod API is early access and may change between Claude Code releases. `validate` and `test` show a break first.
