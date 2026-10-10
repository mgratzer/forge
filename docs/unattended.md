# Unattended Shipping

How a prepared Issue becomes a review-ready PR while you do something else, and how ten of them run at once.

```
forge-batch  →  launcher  →  forge-ship --guard  →  review-ready | needs-human
 (which Issues     (one session       (implement → review → guard)
  in parallel)      per Issue)
```

The skills are portable; only the launcher knows your terminal. Skills report progress through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)) and read project settings from the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

The guard's steps are in [forge-guard](../skills/forge-guard/SKILL.md). It stops at `review-ready` and leaves merging to you; its summary lists the threads it left open.

## One Issue or ten

One Issue: `/forge-ship --guard 123` in any session, `claude -w 123 '/forge-ship --guard 123'` for a fresh checkout (needs the [worktree hooks](../contrib/worktree/)), or `contrib/launchers/cmux-claude.sh 123` for a named tab.

Ten: `/forge-batch <scope>` prints Waves. Paste a Wave's launch line into the launcher. Re-run `forge-batch` after a Wave merges, since later Waves shift as code lands.

## Setup

Once per user:

- [ ] Install the [worktree hooks](../contrib/worktree/) in `~/.claude/settings.json`, so every session gets its own bootstrapped checkout. Point them at a forge clone that stays on `main`, not the one you develop in
- [ ] Put a launcher on your `PATH`, e.g. `ln -s /path/to/forge/contrib/launchers/cmux-claude.sh ~/bin/forge-launch`
- [ ] Set `FORGE_LAUNCHER=forge-launch` so `forge-batch` prints launch lines you can paste as is
- [ ] Choose how sessions get past permission prompts: `"defaultMode": "auto"` in `~/.claude/settings.json`, or `--yes-skip-permissions` per launch for Issues you trust — see [launcher permissions](../contrib/launchers/README.md#permissions). Without either, each session waits at its first prompt

Once per project:

- [ ] Run `claude` in the repository once and accept the trust dialog — `claude --worktree` refuses an untrusted repository, and headless runs never show the dialog. A trusted parent directory covers every repository below it
- [ ] Add the `## Unattended Shipping` section to `AGENTS.md` — peer reviewer, security-sensitive paths, serialized resources, max rounds (see [unattended-config](../skills/_shared/unattended-config.md))
- [ ] Provide `scripts/bootstrap-worktree.sh` and `scripts/teardown-worktree.sh` when a fresh checkout needs more than a clone to run the tests
