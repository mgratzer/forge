# Publish

How `forge-ship` stops for a local review, and how it publishes: right after the passes in a normal run, or later with `--publish`.

## Splitting

Propose stacked local branches before the review: one per group of phases, each cut from the previous one (on a stacked branch, measure against its parent). An accepted split ends the run at `ready-for-local-review` with the branch layout in the summary; the human publishes each in stack order with `--publish`.

## Local Review

Write the hand-off note, so a later publish drafts the same body this run would have. It lives in the shared git directory, survives a removed worktree, and is never committed:

```bash
NOTE="$(git rev-parse --path-format=absolute --git-common-dir)/forge/ship-$(git branch --show-current | tr / -).md"
mkdir -p "$(dirname "$NOTE")"
```

It holds what the drafter and the final summary need: the why's source and closing references, the base branch, findings fixed, deferred (with Issues), and open, decisions left for the human, who reviewed and which passes ran, the exercise outcome with its evidence, not-covered line, and try-it commands, and the known limitations, including unattended assumptions. The human reviews the branch, then runs `/forge-ship --publish`.

## Publish

A non-local run continues here directly. `--publish` starts here with the hand-off note. Without one (the work came from `forge-implement --local` or by hand), nothing has reviewed the branch: run **Link PR**'s first half and ship's Steps 2 to 5 first.

1. **Rebase** onto the fetched default branch (forge-implement Step 3's `git symbolic-ref` line): `git fetch origin && git rebase origin/<DEFAULT_BRANCH>`. When the note names another base branch: once its PR has merged, `git rebase --onto origin/<DEFAULT_BRANCH> <BASE>`; while it is open, rebase onto `origin/<BASE>`. Ask in attended mode when a conflict resolution changes behavior.
2. **Re-check.** When the rebase brought in upstream commits, re-run the quality gates. When it needed conflict resolutions, review them with one fresh-context reviewer per [review-delegation](../_shared/review-delegation.md). Name the rebase in the summary. Then run the `(each push)` extra passes ([quality-passes](../_shared/quality-passes.md)) when any code commit landed since they last ran: an exercise fix, upstream commits, a conflict resolution, the human's edits during local review.
3. **Push and open the PR** as forge-implement Step 8 does, with the note's deferred Issues, limitations, evidence, not-covered line, and try-it commands for the drafter, and `--base <BASE>` while a stacked base is unmerged. A rebased branch already on `origin` needs `git push --force-with-lease`: ask first in attended mode; in unattended mode, skip the rebase rather than force-push. When a PR already exists, push to it. Delete the note.
