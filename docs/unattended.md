# Unattended Shipping

How a prepared Issue becomes a review-ready PR while you do something else, and how ten of them run at once.

```
forge-batch  →  launcher  →  forge-ship --guard  →  review-ready | needs-human
 (which Issues     (one session       (implement → review → guard)
  in parallel)      per Issue)
```

The skills are portable; only your launcher knows your terminal, and forge ships none. Skills report progress through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)) and read their settings from `## Shipping` sections in `AGENTS.md` and in your own `~/.config/forge/shipping.md` ([project-config](../skills/_shared/project-config.md)).

The guard's steps are in [forge-guard](../skills/forge-guard/SKILL.md). It stops at `review-ready` with the PR still a draft, and leaves marking it ready and merging to you; its summary lists the threads it left open.

## One Issue or ten

One Issue: `/forge-ship --guard 123` in any session, or `claude -w 123 '/forge-ship --guard 123'` for a fresh checkout.

Ten: `/forge-batch <scope>` prints Waves. Start each Issue in a Wave with your launcher, or by hand. Re-run `forge-batch` after a Wave merges, since later Waves shift as code lands.

## Setup

Once per user:

- [ ] If you write a launcher, set `FORGE_LAUNCHER` to its command so `forge-batch` prints launch lines you can paste as is
- [ ] Choose how sessions get past permission prompts: `"defaultMode": "auto"` in `~/.claude/settings.json`, or the agent's skip-permissions flag for Issues you trust (the Issue text then directs the agent unchecked). Without either, each session waits at its first prompt

Once per project:

- [ ] Run `claude` in the repository once and accept the trust dialog: `claude --worktree` refuses an untrusted repository, and headless runs never show the dialog. A trusted parent directory covers every repository below it
- [ ] Make sure CI and the peer reviewers run on draft PRs: skills never mark a PR ready, so a workflow gated on `draft == false` or a bot that skips drafts leaves the guard waiting until `needs-human`. Otherwise declare `Pull requests: ready`
- [ ] Put personal settings (assignee, labels, `After create`) in `~/.config/forge/shipping.md`, scoped per remote where they differ
- [ ] Add the `## Shipping` section to `AGENTS.md` (only what forge acts on; other conventions stay prose in `AGENTS.md`): PR state (forge opens drafts by default), peer reviewers, security-sensitive paths, serialized resources, max rounds, and optionally extra passes ([quality-passes](../skills/_shared/quality-passes.md)), including a project's own sign-off skill marked `(each push)`; see [project-config](../skills/_shared/project-config.md). An existing `## Unattended Shipping` section keeps working
- [ ] Say in `AGENTS.md` how a fresh checkout gets ready to run the tests (dependencies, its own test database and ports). Parallel runs that share one database or fixed ports break each other's tests; when they must share, list the service under `Serialized resources`, which makes `forge-batch` run one Issue per Wave

## Writing a launcher

A launcher is yours, for your terminal. It does three things:

1. Gives each Issue an isolated checkout, such as `claude -w <issue>` or `git worktree add`.
2. Starts the agent with `/forge-ship --guard <issue>`, with `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"` ([status-reporting](../skills/_shared/status-reporting.md)).
3. Makes the session findable: a tab name, a window title, a tmux session name.

Keep it to starting sessions. Anything smarter belongs in a skill.
