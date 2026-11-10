# Forge Context

Shared vocabulary used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker**: system tracking Issues. Providers: GitHub (default, via `gh`), markdown `plan/` folder ([spec](skills/_shared/plan-folder-spec.md)), or user-configured (declared in AGENTS.md). Detection order is in [issue-operations](skills/_shared/issue-operations.md).

**Issue**: one tracked unit of work, with title, body and labels, capitalized because it is the abstract concept whichever provider holds it. Its AFK/HITL mode is recorded at creation (Issue body on GitHub, `mode` frontmatter in the markdown provider).

**Plan**: structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps. The PR carries it in `## Plan` (see [pr-body](skills/_shared/pr-body.md)). A "plan file" is a markdown artifact containing a Plan.

**Deviation**: a difference between a Plan and the diff its PR was opened with: a change outside what the Plan set out to do, or a planned phase that didn't happen. A change a person made to the Plan is not one, since the PR carries the changed Plan; nor is a self-review fix inside the Plan's goal and scope, even one committed before the PR opens. Later commits answer review and CI, which other checks judge. _Avoid_: "drift", "plan mismatch".

**Design block**: the lines a Plan or an Issue states when it adds a module or a variant of something that exists: Interface, Hides, Already lives, and Leaves behind for a replacement. See [deep-modules](skills/_shared/deep-modules.md).

**Test seam**: an export, parameter, option or injection point that exists only so a test can reach code, or that only a test sets. Listed in the PR's Notes; land sends a PR that adds one to review.

**Vertical slice**: end-to-end implementation crossing all layers for one narrow scenario, testable in isolation. See [vertical-slicing](skills/_shared/vertical-slicing.md).

**Vertical phase**: one ordered step of a Plan, shaped like a slice, ending with tests passing and a commit.

**AFK / HITL**: Issue execution mode. AFK: fully specified for autonomous execution. HITL: requires human judgment during implementation. See [afk-vs-hitl](skills/forge-create-issue/references/afk-vs-hitl.md).

**Exercise**: running the app and using the changed path once, plus one failure case, before the PR opens. Reported in the PR body's `## Exercised` section; a run that didn't reach the changed path is not evidence, and a wrong result is fixed with a test, not deferred. See [exercise](skills/_shared/exercise.md). _Avoid_: "smoke test", "manual test".

**Board**: one rendered proposal for how something looks, on whatever canvas the project uses. _Avoid_: "mockup" for a proposal nobody rendered.

**Design round**: one brief, the boards drawn for it, and the person's verdict on them, logged with its reason in the spec. See [design-rounds](skills/_shared/design-rounds.md). Unrelated to the guard's **Round**, so always say "design round".

**Reflection**: self-review of current changes before peer review, which is external. Tiny diffs review inline, otherwise one fresh-context pass by default. Produces Findings.

**Tiny diff**: roughly ≤2 files and ≤100 changed lines with low risk; reviewed inline only when the session didn't author the changes. See [review-delegation](skills/_shared/review-delegation.md).

**Finding**: one issue surfaced by reflection, severity-tagged P0 to P2 ([rubric](skills/_shared/review-rubric.md)). P3 is not flagged. Each is fixed or becomes a Deferred item.

**Deferred item**: a Finding or review-feedback item not addressed in the current PR; becomes a new Issue.

**Composite skill**: combines other skills' processes into one invocation (`forge-ship`). `--unattended` applies across all of them.

**Guard**: the stage after self-review that drives an open PR to review-ready without a human. Never merges. See [forge-guard](skills/forge-guard/SKILL.md).

**Round**: one trip through the guard's react step: a fix for a CI failure the branch caused, an update from the base branch, or a feedback pass, followed by a fresh wait. A trip that only reruns a flaky check or finds checks still pending is not a round. Rounds count across turns. Bounded by *max guard rounds*.

**Review-ready / Needs-human**: terminal states of the guard and of land. Review-ready: a person can look now, since the guard's conditions hold ([forge-guard](skills/forge-guard/SKILL.md) Step 4); from land, also a needs-review verdict, with `## Risk` saying where to look. Needs-human: stopped short, with the reason in the summary. A run ends at its terminal state: a later event changes nothing (see [status-reporting](skills/_shared/status-reporting.md#states)). _Avoid_: "done", "green" alone.

**Land**: the stage after the guard: checks that a PR is mergeable, green, addressed and exercised, gets a fresh-context risk verdict on its head commit, and writes it into `## Risk`. Ends in exactly one of Merged, Merge-ready, Review-ready or Needs-human. See [forge-land](skills/forge-land/SKILL.md) and [risk-rubric](skills/_shared/risk-rubric.md).

**Merge-ready**: land's low-risk outcome: a person can merge without reading the diff. A new push makes it stale, and so does a guard run on the PR ending in Needs-human. _Avoid_: "approved", "safe to merge".

**Merged**: land's low-risk outcome when the project set `Auto-merge: low-risk`: the host merged the judged commit, or will once its required checks pass.

**Outcome label**: `forge:merge-ready` or `forge:review-ready`, set by land in a repository that created them, so the outcome outlives the session.

**Addressed feedback**: a review thread we resolved or whose last comment is ours, or a PR conversation comment or review body that a comment of ours links. Ours means by the agent's login and carrying the `<!-- forge -->` marker, since a person can share that login. Unaddressed feedback that asks for something blocks review-ready. _Avoid_: "addressed thread".

**Readiness signal**: what guard and land both read to decide whether a PR is ready: mergeable, CI, the review signal, open feedback. See [pr-readiness](skills/_shared/pr-readiness.md).

**Prerequisite**: an Issue or PR another Issue's body names with `depends on`, `blocked by`, or `after #N`. Met only once merged: a PR counts once merged, an Issue once closed as completed with no closing PR still open. See [open-work](skills/_shared/open-work.md).

**Serialized resource**: a file two Issues must never change in the same Wave (migrations, lockfiles, generated files). Declared per project: see [unattended-config](skills/_shared/unattended-config.md).

**Wave**: a set of AFK Issues whose expected changes and serialized resources do not overlap, so they can ship concurrently. A **Batch** is the ordered list of Waves for a scope.

**Launcher**: whatever starts one guarded ship per Issue in an isolated checkout, such as `claude -w` or a script for your terminal. It is the user's, never part of forge. Skills report to it through `FORGE_STATUS_CMD` (see [status-reporting](skills/_shared/status-reporting.md)).

**Quality gates**: lint, format, type check and tests, run at phase gates and before reflection. Implement's final gate also requires ≥90% coverage on new or modified code where tooling exists.

**Attended / unattended**: by default a skill pauses for confirmation; `--unattended`, or a run no person can answer, decides on its own.

**Trailing context**: `-- <additional context>` appended to give extra execution guidance.
