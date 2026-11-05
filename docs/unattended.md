# Unattended Shipping

How a prepared Issue becomes a merged or review-ready PR while you do something else, and how ten of them run at once.

```
forge-batch  →  launcher  →  forge-ship --guard  →  merged | merge-ready | review-ready | needs-human
 (which Issues     (one session       (implement → review → guard → land)
  in parallel)      per Issue)
```

Forge ships no launcher, since only yours knows your terminal. Skills report progress through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)) and read project settings from the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

[forge-guard](../skills/forge-guard/SKILL.md) stops at `review-ready`, and its summary lists what it left open. What it posts ends in a hidden `<!-- forge -->` marker, so a comment you post from the agent's `gh` account counts as yours.

[forge-land](../skills/forge-land/SKILL.md) then writes what the PR needs from you into its `## Risk` section, judged on the head commit:

- `merge-ready`: the [risk rubric](../skills/_shared/risk-rubric.md)'s checks found nothing and the verdict is low risk, so you can merge without reading the diff.
- `review-ready`: read the PR, starting from its Where to look list.
- `merged`: only with `Auto-merge: low-risk`. A push after the verdict stops the merge.

Run `/forge-land <pr>` on its own for any green PR. Unattended runs skip plan approval, so the PR carries the Plan as first made and says why ([pr-body](../skills/_shared/pr-body.md)). A deviation it doesn't state sends the PR to review, and so does a HITL Issue shipped this way.

## When the runtime watches the PR

Claude Code desktop's Auto-fix wakes the session on CI failures, merge conflicts and review comments. Nothing reports CI turning green, so without a wait of its own a clean PR would never reach land. Guard and land therefore keep one CI wait, in the background when the runtime can wake the session, and land writes no verdict while checks are pending. For events after a terminal state, see [forge-guard](../skills/forge-guard/SKILL.md) Steps 3 and 5.

The desktop app's own instructions say not to poll CI with `gh`, and a skill can't override them. A session may still follow the app and end its turn waiting for an event; a clean PR then sits until something wakes it.

## One Issue or ten

One Issue: `/forge-ship --guard 123` in any session, or `claude -w 123 '/forge-ship --guard 123'` for a fresh checkout.

Ten: `/forge-batch <scope>` prints Waves. Start each Issue in a Wave with your launcher or by hand, and re-run `forge-batch` after a Wave merges, since later Waves shift as code lands.

Or `/forge-batch --start <scope>` starts every ready Issue as its own `forge-ship --guard` session and prints a status table. Each run reads the scope from GitHub, acts once and ends. Run it again to continue: when a started session ends (the runtime wakes the session that started it), by hand, or on a schedule such as `/loop`. It comments on each Issue it starts, so a re-run doesn't start it twice; delete the comment to start it again. It never merges. Once every PR waits on you, it test-merges them in a scratch worktree and reports a merge order. See [start](../skills/forge-batch/references/start.md).

## Finding out a PR waits on you

GitHub doesn't notify you about your own account's activity, and an agent under your account acts as you: land's review request reaches only a linked Issue's assignee or author who didn't open the PR, and an @mention or an assignment would notify nobody. So land can label the PR with its outcome. Forge never adds labels to your repository, so this is opt-in: create both once, and land applies them from then on.

```bash
gh label create forge:merge-ready && gh label create forge:review-ready
```

Your queue is then a saved filter. These work as written in a repository's pull requests tab; in global search or the GitHub mobile app, add `user:<you>` or `org:<org>`, or they match every public repository:

```text
is:open is:pr label:forge:merge-ready
is:open is:pr label:forge:review-ready
```

Land's next run replaces the label. Any other end of land, a guard push, or a guard re-entry ending in `needs-human` removes it. A push from anywhere else leaves it until land runs again; the PR's `## Risk` section names the commit it judged.

For a push instead of a queue, have your launcher's `FORGE_STATUS_CMD` turn `merge-ready` and `review-ready` into a desktop notification, or give the agent a bot account of its own so GitHub notifies you.

## Setup

Once per user:

- [ ] If you write a launcher, set `FORGE_LAUNCHER` to its command so `forge-batch` prints launch lines you can paste as is (and `--start` falls back to them)
- [ ] Choose how sessions get past permission prompts: `"defaultMode": "auto"` in `~/.claude/settings.json`, or the agent's skip-permissions flag for Issues you trust (the Issue text then directs the agent unchecked). Without either, each session waits at its first prompt

Once per project (`/forge-setup-project` covers the `## Unattended Shipping` section, the fresh-checkout step, and the run recipe):

- [ ] Run `claude` in the repository once and accept the trust dialog: `claude --worktree` refuses an untrusted repository, and headless runs never show the dialog. A trusted parent directory covers every repository below it
- [ ] Add the `## Unattended Shipping` section to `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md))
- [ ] Say in `AGENTS.md` how a fresh checkout gets ready to run the tests (dependencies, its own test database and ports)
- [ ] Give agents a way to run the app: a run skill (Claude Code: `/run`) or run commands in `AGENTS.md` ([exercise](../skills/_shared/exercise.md)). Without one, code PRs report `not exercised` and never reach `merge-ready`
- [ ] Optionally, create the labels above to get a queue of PRs waiting on you
- [ ] Optionally, add `REVIEW.md` files (at the root or in a directory) saying what there always needs a person; land's verdict reads them
- [ ] Later, once you have agreed with several of land's `merge-ready` verdicts on real PRs, optionally add `Auto-merge: low-risk` to the section. Try it in a sandbox repository first

## What guard and land don't see

Guard and land judge one PR at a time, so neither sees erosion: structure that gets worse across PRs while each step looks reasonable. `low risk` means unlikely to break anything now, not that the code stays easy to change, and `Auto-merge: low-risk` merges on that same verdict. [SlopCodeBench](https://arxiv.org/abs/2603.24755) found explicit quality guidance improves where agent code starts but not how fast it degrades.

After several feature PRs land in one area, review its structure before starting the next feature there. Forge ships no skill for this; use any architecture review, such as [improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture). Ask it for:

- One reviewer per hot area, judging the code as it stands rather than a diff
- Git evidence for each finding: the PRs that built it up, and the next change it makes harder
- The modules it looked at and cleared, since the number of findings says little on its own
- A check against open Issues, so it doesn't report what is already filed
- A challenge to any documented decision that doesn't record a real trade-off
- A separate list of any bugs it noticed

A review lists more than is worth doing, so a person picks what gets filed, through `/forge-create-issue`.

## Writing a launcher

A launcher is yours, for your terminal. It does three things:

1. Gives each Issue an isolated checkout, such as `claude -w <issue>` or `git worktree add`.
2. Starts the agent with `/forge-ship --guard <issue>`, with `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"` ([status-reporting](../skills/_shared/status-reporting.md)).
3. Makes the session findable: a tab name, a window title, a tmux session name.

Keep it to starting sessions. Anything smarter belongs in a skill.
