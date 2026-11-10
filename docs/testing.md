# Testing

What can be checked mechanically runs in CI (`.github/workflows/checks.yml`), and locally with the same commands:

```bash
scripts/check-skills.sh                              # skill structure, the lens contract (Node 22.6+), the PR-state script's tests (jq); the script lists its checks
npx @biomejs/biome@2.6.2 ci --error-on-warnings .    # lint and format of lens/, scripts/*.ts and the plugin JSON
claude plugin validate .                             # plugin and marketplace manifests, the lens's hooks
claude plugin test .                                 # lens/tests/*.test.tsx
```

CI pins Biome (matching the `$schema` in `biome.json`) and Claude Code; bump both on purpose. `validate` exits 0 on warnings, so CI also fails on any warning except the missing `version` (left out so installs track commits) and, through `--profile directory`, on anything the plugin directory would refuse, such as a missing LICENSE.

`scripts/test-pr-state.sh` runs `skills/_shared/scripts/pr-state.sh` against the cases in `scripts/fixtures/pr-state/`, with stand-ins for `gh`, `sleep` and `date`, so it needs no network and never waits; its header says how a case is laid out. A change to a filter, a wait or the `REVIEWERS` table comes with a case.

No check reads a skill's meaning. By hand, verify the section order ([Coding Guidelines](coding-guidelines.md)), the Related Skills links, GraphQL queries against the [GitHub docs](https://docs.github.com/en/graphql), and that `plan/` provider paths match [plan-folder-spec](../skills/_shared/plan-folder-spec.md).

## Exercise a Skill Change

Skill prompts are forge's runtime. A PR that changes `skills/` exercises the change (see [exercise](../skills/_shared/exercise.md)) and reports what the runs printed in `## Exercised`, never `not exercised: no runtime change`; that line stays for PRs that change only docs, tests, or CI. The app here is a coding agent running the skill in a sandbox repository made for it, such as the private `mgratzer/forge-e2e-sandbox`. Runs open branches and PRs there, so never point them at a real project: with no sandbox checkout at hand, report `Not exercised: needs a sandbox checkout`.

The sandbox's `AGENTS.md` still has the old `## Shipping` heading with `Security-sensitive paths: src/**`. Forge reads only `## Unattended Shipping`, but a run on 2026-10-20 honored that line anyway and sent code under `src/` to review, so keep test code outside `src/` when a case needs `merge-ready`.

1. **Snapshot** the branch and its base as two plugins, from the forge checkout, named apart so neither collides with an installed forge:

   ```bash
   snap() { d=$(mktemp -d); git archive "$1" skills | tar -x -C "$d"; [ -d "$d/skills" ] || return 1; mkdir "$d/.claude-plugin"; printf '{"name":"%s"}\n' "$2" > "$d/.claude-plugin/plugin.json"; echo "$d"; }
   git fetch origin
   NEW=$(snap HEAD forge-new)
   OLD=$(snap "$(git merge-base HEAD origin/main)" forge-old)   # the control: the branch's base, not today's main
   ```

2. **Run the changed skill** headless in the sandbox checkout, once per snapshot. A free-text task needs no tracker reset; a full `forge-ship --guard` run costs $2 to $3.50 and takes about 4 minutes. Interactive skills print their questions as text, since `AskUserQuestion` is unavailable headless. Close each run's PR and delete its branch before the next run, since both runs pick the same branch name.

   ```bash
   claude -p "/forge-new:forge-ship --guard <free-text task>" --plugin-dir "$NEW" --permission-mode auto
   claude -p "/forge-old:forge-ship --guard <free-text task>" --plugin-dir "$OLD" --permission-mode auto
   ```

3. **For a rubric or verdict change**, run only forge-land's judge, read-only, on a sandbox PR that isolates the check under test, with each variant of the PR body in a local file. Run it once per snapshot:

   ```bash
   gh pr view <N> -R mgratzer/forge-e2e-sandbox --json body --jq .body > body.md   # copy, then edit the copy
   gh pr view <N> -R mgratzer/forge-e2e-sandbox --json headRefOid --jq .headRefOid   # <SHA>
   claude -p "/forge-new:forge-land <N> -- Read-only test: in Step 1, fetch and read the settings but skip the qualifying checks. Run Step 2 on head commit <SHA> with the PR body read from $PWD/body.md instead of gh pr view. Print the filled ## Risk section and stop. Never edit the PR, request reviews, push, or merge." --plugin-dir "$NEW" --permission-mode auto --disallowedTools "Bash(gh pr edit:*)" "Bash(gh pr merge:*)" "Bash(git push:*)"
   ```

   The prompt asks for a read-only run and `--disallowedTools` enforces it: auto mode alone would let the judge edit, merge or push.

   Sandbox PR #11 adds code only in `bin/`, outside `src/**`, so only the Exercise check decides its verdict: low risk with its own `## Exercised`, needs review with a copy whose section is `not exercised: no way to run the app`. It stays open and unmerged.

4. **Compare** each run with the same run from `$OLD`. The case the change is about differs between the two; the others match. A difference you didn't intend is a `wrong:` result.

Judge tests read local copies of PR bodies: never edit a sandbox PR's body to set up a case. The PRs a full run opens are its own to write to; close them afterwards.

In `## Exercised`, one line per run: the snapshot, the PR or task, the case, and what it printed, with the `$OLD` run as its own line.

## Scenarios

What to run per skill when a change reaches that behavior. For a sub-agent's run, also check it used the model and provider you expected.

### forge-reflect, forge-ship review

Tiny low-risk diffs stay inline, ordinary diffs get one reviewer, and a second pass appears only for clearly high-risk or broad changes.

### forge-guard

- A PR whose CI you can make fail once: it fixes the failure, re-requests the peer review, replies on every thread, and ends in `review-ready` without merging.
- The peer reviewer fails (a Copilot error or rate-limit review): it ends in `needs-human`, naming the reviewer and its message, without re-requesting.
- The could-not-review note above an overview counts as the review.
- `--max-rounds 1` against two rounds of feedback: ends in `needs-human`.
- A check that already fails on the base branch: left alone. A check that fails only on its first attempt: rerun once and waited for. Neither costs a round.
- A conflicting commit pushed to the base branch: merged in and resolved, and it still ends in `review-ready`.
- From the agent's own login, a conversation comment, a review body and an inline thread that each ask for a change, plus a comment that asks for nothing: it addresses the three and skips the fourth, its replies end in the `<!-- forge -->` marker, the first two link what they answer, and a rerun finds nothing.
- One left unanswered: land ends in `needs-human`. A hidden comment drops out.
- A `Needs your decision:` reply from the agent: the query keeps returning it and land ends in `needs-human`, until a marked reply to the person's answer links it.
- On a public repository, a request from an account without write access ends in `needs-human`, unacted on.

### forge-implement

- An Issue in a project that can run its app: `## Exercised` lists real commands with their observed output and one failure case, and its `Try it` line, repeated in the run's summary, says how to start the app and what to look at.
- A project with no way to run the app: the section says `not exercised: <why>` instead of describing a run.
- A fresh worktree of a project whose Commands name an install step: pre-flight runs it before the first phase.
- An env var the base commit needs, unset. When `.env.example` provides it, the PR's Notes report an environment failure and the diff has no code change for it. When it doesn't, an unattended run stops at `needs-human` naming the variable.
- A UI change (the sandbox is a JSON API, so give it a free-text task that renders something, such as an HTML report of the notes): `## Exercised` links screenshots, and the images are on `pr-assets/<branch>`, not on the feature branch.
- The same with `-- This machine has no browser or screenshot tool, and none may be installed or started`: the `Not exercised` line lists `screenshots: <why>`.

### forge-land

On green sandbox PRs, with code outside `src/**` unless the case says otherwise:

- A small docs-plus-code PR ends in `merge-ready`; a PR touching a CI workflow ends in `review-ready` with a Where to look list.
- A code PR with `not exercised: no way to run the app` ends in `review-ready` with an `Exercise:` line naming it. A docs-only PR with `not exercised: no runtime change` can still be `merge-ready`.
- The `## Risk` section names the head commit, and a re-run replaces it rather than adding a second one.
- A PR without `## Exercised` ends in `needs-human`.
- A PR that opened with a deviation from its `## Plan` it doesn't list ends in `review-ready` with a `Plan:` line naming it. Guard-round commits after the open don't trip this.
- The review request goes to a linked Issue's assignee or author only when they did not open the PR.
- With `Auto-merge: low-risk` in a `## Unattended Shipping` section: the low-risk PR merges itself after CI and land reports `merged`. A commit pushed after the verdict and before the merge is refused (`--match-head-commit`), and land reports `needs-human`.
- Labels, off: with no `forge:*` labels, land reports `Label: none` and creates none.
- Labels, on (`gh label create forge:merge-ready && gh label create forge:review-ready`): a `merge-ready` run leaves `forge:merge-ready`, a later `review-ready` run swaps it for `forge:review-ready`, and a `needs-human` run or a guard push removes it. Delete both afterwards, so the sandbox stays not opted in.

### forge-survey

On a repository with one function copied into two files and an export only a test imports:

- Both are recorded with their class, both places as `file:line`, and a `Let through by` cell.
- The survey file is on a `docs/survey-<date>` branch with a PR, and the checkout it ran in keeps its branch.
- A second run finds the first survey, marks the same findings as recurring, and proposes a guardrail for the class.
- Headless, it prints its triage questions and files no Issue.

### forge-shape

On a change to something the project renders:

- It reads the real copy and rules before the first board, and marks what it made up as `proposed` or `sample`.
- It looks at a rendered PNG before showing a board.
- It logs a rejected direction with the person's reason and doesn't bring that direction back.
- When the chosen board changes, it finds what the spec no longer matches.
- When a direction is accepted, the docs PR carries the spec and shows the boards.
- A non-visual idea still gets questions and no drawing.
- A design rejected on a sandbox PR that already links `## Exercised` screenshots: an attended run draws a new board before any code, updates the PR body's Plan, and leaves the boards and the screenshots on `pr-assets/<branch>`. An unattended run leaves the thread as needing a human decision.
