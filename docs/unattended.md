# Unattended Shipping

How a prepared Issue becomes a merged or review-ready PR while you do something else, and how ten of them run at once.

```
forge-batch  →  launcher  →  forge-ship --guard  →  merged | merge-ready | review-ready | needs-human
 (which Issues     (one session       (implement → review → guard → land)
  in parallel)      per Issue)
```

The skills are portable; only your launcher knows your terminal, and forge ships none. Skills report progress through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)) and read project settings from the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

The guard's steps are in [forge-guard](../skills/forge-guard/SKILL.md). It stops at `review-ready`; its summary lists the threads it left open.

Then [forge-land](../skills/forge-land/SKILL.md) decides what the PR needs from you and writes it into the PR's `## Risk` section, judged on the head commit. `merge-ready`: the checks in the [risk rubric](../skills/_shared/risk-rubric.md) found nothing and the verdict is low risk, so you can merge without reading the diff. `review-ready`: read the PR, starting from its Where to look list; land requests your review when you are not the one who opened the PR. Merging is yours, unless the project set `Auto-merge: low-risk`: then land merges a low-risk PR itself and reports `merged`. It merges only the commit it judged, so a push after the verdict stops the merge. Run `/forge-land <pr>` on its own for any green PR. Unattended runs, including runs no person can answer, skip plan approval, so the PR carries the Plan as first made and says why (see [pr-body](../skills/_shared/pr-body.md)). A deviation it doesn't state sends the PR to review, and so does a HITL Issue shipped this way.

## One Issue or ten

One Issue: `/forge-ship --guard 123` in any session, or `claude -w 123 '/forge-ship --guard 123'` for a fresh checkout.

Ten: `/forge-batch <scope>` prints Waves. Start each Issue in a Wave with your launcher, or by hand. Re-run `forge-batch` after a Wave merges, since later Waves shift as code lands.

Or let batch start them: `/forge-batch --start <scope>` starts every ready Issue as its own `forge-ship --guard` session and prints a status table (merged, in flight, ready, waiting). An Issue is ready once its prerequisites have merged and its touch set conflicts with no open PR, nor with another Issue it starts in the same run; it waits otherwise, naming what on. Each run reads the scope from GitHub, acts once, and ends. Run it again to continue: when a started session ends (the runtime wakes the session that started it), by hand, or on a schedule such as `/loop`. Where the runtime can't start sessions, or refuses a start, it prints launch lines instead. It comments on each Issue it starts or prints a launch line for, so a re-run before the PR exists doesn't start it twice; delete the comment to start it again. Batch never merges: it lists the merge-ready PRs for you, and forge-land merges only with `Auto-merge: low-risk`. Once nothing is left to start and every PR waits on you, it test-merges the judged PRs in a scratch worktree off the default branch, runs the quality gates on the result, and reports a merge order with each conflict and which PR merges the default branch after it; it never pushes. See [start](../skills/forge-batch/references/start.md).

## Finding out a PR waits on you

GitHub tells you nothing about your own account's activity, and an agent running under your account acts as you: land's review request reaches only a linked Issue's assignee or author who didn't open the PR, and an @mention or an assignment would notify nobody. So land labels the PR with its outcome, `forge:merge-ready` or `forge:review-ready`, creating the labels on first use. Your queue is a saved filter, on the web or in the GitHub mobile app:

```text
is:open is:pr label:forge:merge-ready
is:open is:pr label:forge:review-ready
```

The label follows the head commit as far as forge can see it: land's next run replaces it, and any other end of land or a guard push removes it. A push from anywhere else leaves it until land runs again; the PR's `## Risk` section names the commit it judged.

For a push instead of a queue, have your launcher's `FORGE_STATUS_CMD` turn `merge-ready` and `review-ready` into a desktop notification. Or give the agent a bot account of its own, so GitHub notifies you about what it does; that is setup forge can't do for you.

## Setup

Once per user:

- [ ] If you write a launcher, set `FORGE_LAUNCHER` to its command so `forge-batch` prints launch lines you can paste as is (and `--start` falls back to them)
- [ ] Choose how sessions get past permission prompts: `"defaultMode": "auto"` in `~/.claude/settings.json`, or the agent's skip-permissions flag for Issues you trust (the Issue text then directs the agent unchecked). Without either, each session waits at its first prompt

Once per project (`/forge-setup-project` covers the `## Unattended Shipping` section, the fresh-checkout step, and the run recipe: it discovers the settings, asks only for what it can't find, and never invents a value):

- [ ] Run `claude` in the repository once and accept the trust dialog — `claude --worktree` refuses an untrusted repository, and headless runs never show the dialog. A trusted parent directory covers every repository below it
- [ ] Add the `## Unattended Shipping` section to `AGENTS.md` — peer reviewer, security-sensitive paths, serialized resources, max rounds (see [unattended-config](../skills/_shared/unattended-config.md))
- [ ] Say in `AGENTS.md` how a fresh checkout gets ready to run the tests (dependencies, its own test database and ports)
- [ ] Give agents a way to run the app: a run skill (Claude Code: `/run`) or run commands in `AGENTS.md` (see [exercise](../skills/_shared/exercise.md)). Without one, code PRs report `not exercised` and never reach `merge-ready`
- [ ] Optionally, add `REVIEW.md` files (at the root or in a directory) saying what there always needs a person; land's verdict reads them
- [ ] Later, once you have agreed with several of land's `merge-ready` verdicts on real PRs, optionally add `Auto-merge: low-risk` to the section. Try it in a sandbox repository first

## Writing a launcher

A launcher is yours, for your terminal. It does three things:

1. Gives each Issue an isolated checkout, such as `claude -w <issue>` or `git worktree add`.
2. Starts the agent with `/forge-ship --guard <issue>`, with `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"` ([status-reporting](../skills/_shared/status-reporting.md)).
3. Makes the session findable: a tab name, a window title, a tmux session name.

Keep it to starting sessions. Anything smarter belongs in a skill.
