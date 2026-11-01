# Risk Rubric

What decides whether a green PR needs a person. Used by `forge-land`'s verdict.

## Checks

Any hit means **needs-review**. Measure on the judged commit against the merge base (`git diff --numstat "origin/$BASE...$SHA"`).

| Check | Needs review when | How to tell |
|-------|-------------------|-------------|
| Size | more than 400 changed lines (added plus deleted), not counting docs, tests, generated files, lockfiles and dependency manifests | Generated: `git check-attr --source="$SHA" linguist-generated -- <paths>` reports `set` or `true`. Docs and tests by path and by what the file is |
| Always-review paths | migrations or schema, dependency changes, CI workflows, or the project's security-sensitive paths | CI workflows: `.github/workflows/**` and any other CI configuration. Dependency changes: a manifest or lockfile changed. Security-sensitive paths per [unattended-config](unattended-config.md) |
| Tests | tests deleted or weakened | A test file or case removed, an assertion removed or loosened, a skip or only marker added, an expected value changed to match new output without a stated reason |
| Exercise | the change behaved wrongly when exercised, or changes runtime behavior and was not exercised | The PR body's `## Exercised` section reports `wrong:`, or is a `not exercised:` line with any reason other than `no runtime change`, or claims `no runtime change` while the diff changes more than docs, tests, CI configuration or comments (see [exercise](exercise.md)). Anything `AGENTS.md` at the judged commit calls runtime is runtime, even Markdown. A section whose runs never reached the changed path counts as a `not exercised:` line; a partial `Not exercised:` bullet beside a run that did is left to the judgment test |
| Plan | the PR opened with a deviation from its `## Plan` that it doesn't state | Compare the Plan plus its **Revisions** with `git diff "origin/$BASE...<SHA from **Deviations** (as of …)>"`: a change outside what the Plan set out to do (judge by goal and scope, not its file list) or a planned phase missing, not named under **Deviations**. Later commits are not compared. That SHA no longer on the branch is a hit; a body without `## Plan` (a PR not opened by forge-implement) skips the check |
| HITL | a HITL Issue was implemented without an approved Plan | The `## Plan` summary is `Plan as first made` and an Issue the PR closes is HITL; an Issue with no recorded execution mode counts as HITL. A **Where to look** item cites the PR's `Judgment calls` Notes bullet, or its absence |
| Trust | the Issue's author lacks write access to the repo | `gh api "repos/{owner}/{repo}/collaborators/<login>/permission" --jq .permission` is not `admin` or `write`. The author of each Issue the PR closes; with no linked Issue, the PR's author. Issues in the markdown `plan/` provider were committed by someone who could push, so they pass |
| Deployment | the PR body has manual deployment steps | Steps someone runs by hand against a live system after merge, anywhere in the body, normally the `[!WARNING]` block (see [pr-body](pr-body.md)). The first **Where to look** item is the step most likely to break the running system, cited as `PR body, step <n>` |

## Judgment Test

When no check hits, the verdict is **low risk** only if you can say what these checks would miss in this diff and why a person reading it would not catch more: a behavior change hidden in a small diff, a public contract, data written in a new shape, a path the `## Exercised` section didn't reach. If you can't name it, or what you name needs a person, the verdict is **needs-review**.

`REVIEW.md` files at the judged commit (at the root and in the directories of changed files) are the project's own notes on what needs a person; a diff they describe as needing review is needs-review.

## Risk Section

The PR body's `## Risk` section, replaced on every verdict:

```markdown
## Risk

**Verdict:** low risk | needs review, judged on <full SHA>

- Peer review: <login> | internal (<peer reviewer> failed: <reason>) | none configured
- Size: <n> counted lines (<n> excluded: docs, tests, ...) → ok | over 400
- Always-review paths: none | <paths>
- Tests: ok | <what was deleted or weakened>
- Exercise: ok | wrong: <what the section reports> | not exercised: <why>
- Plan: ok | no plan | <unstated deviation>
- HITL: ok | #<n> shipped without an approved Plan, judgment calls <listed | missing>
- Trust: ok | <login> has <permission>
- Deployment: none | <n> manual steps
- What the checks would miss: <one or two sentences>

**Where to look** (needs review only)
- `<file>:<line>`: <the question the reviewer should answer>

**Revert:** <only when a plain `git revert` is not enough: data to restore, a migration to roll back, an external change to undo>
```

Two to five **Where to look** items, each a place and a question, not a summary of the change.

Copy **Peer review** as land gives it. It is a record, not a check: an internal substitute review neither hits nor clears anything by itself.
