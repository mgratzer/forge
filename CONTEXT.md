# Forge Context

Shared vocabulary used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker** — system tracking Issues. Providers: GitHub (default, via `gh`), markdown `plan/` folder ([spec](skills/_shared/plan-folder-spec.md)), or user-configured (declared in AGENTS.md). Detection: AGENTS.md declaration → `plan/` directory → GitHub fallback.

**Issue** — one tracked unit of work. Carries title, body, and labels; the AFK/HITL mode is recorded at creation (Issue body on GitHub, `mode` frontmatter in the markdown provider).

**Plan** — structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps. The PR body's `## Plan` section keeps it as approved (as first made, when unattended), never rewritten to match the code.

**Deviation** — a difference between the diff and its Plan: a change outside the Plan's scope, or a planned phase that is missing. Stated deviations are listed with a reason under the Plan; an unstated deviation is a needs-review hit in land's risk rubric. _Avoid_: "drift", "plan mismatch".

**Vertical slice** — end-to-end implementation crossing all layers for one narrow scenario, testable in isolation. See [vertical-slicing](skills/_shared/vertical-slicing.md).

**Vertical phase** — one ordered step of a Plan: spans all affected layers, ends with tests passing and a commit. Each phase is itself slice-shaped — end-to-end, never a horizontal layer.

**AFK / HITL** — Issue execution mode. AFK: fully specified for autonomous execution. HITL: requires human judgment during implementation. Set at creation time. See [afk-vs-hitl](skills/forge-create-issue/references/afk-vs-hitl.md).

**Exercise** — running the app and using the changed path once, plus one failure case, before the PR opens. Reported in the PR body's `## Exercised` section; a run that didn't reach the changed path is not evidence. See [exercise](skills/_shared/exercise.md). _Avoid_: "smoke test", "manual test".

**Reflection** — self-review of current changes before peer review: tiny diffs review inline, otherwise one fresh-context review pass by default, deepened only when risk justifies it. Produces Findings.

**Tiny diff** — roughly ≤2 files and ≤100 changed lines with low risk; reviewed inline only when the session didn't author the changes. See [review-delegation](skills/_shared/review-delegation.md).

**Finding** — one issue surfaced by reflection, severity-tagged P0–P3. P3 not flagged.

**Deferred item** — a Finding or review-feedback item not addressed in the current PR; becomes a new Issue.

**Composite skill** — combines other skills' processes into a single invocation (`forge-ship`, composing implement with the review flow shared with reflect, and `forge-guard` then `forge-land` when `--guard` is set).

**Guard** — the stage after self-review that drives an open PR to review-ready without a human: quality passes, CI, peer review, bounded feedback rounds. Never merges. See [forge-guard](skills/forge-guard/SKILL.md).

**Round** — one trip through the guard's react step: a fix for a CI failure the branch caused, an update from the base branch, or a feedback pass, followed by a fresh wait. A trip that only reruns a flaky check is not a round. Bounded by *max guard rounds*.

**Review-ready / Needs-human** — terminal states of the guard and of land. Review-ready: branch mergeable, CI green apart from failures the base branch shares, peer review present, every thread addressed; from land, also a needs-review verdict, with the `## Risk` section saying where to look. Needs-human: stopped short, with the reason in the summary. _Avoid_: "done", "green" alone.

**Land** — the stage after the guard: checks that a PR is mergeable, green, addressed and exercised, gets a fresh-context risk verdict on its head commit, and writes it into the PR's `## Risk` section. Ends in Merge-ready, Review-ready (with a Where to look list), or Needs-human; with the project's auto-merge opt-in, a low-risk PR ends in Merged instead of Merge-ready. See [forge-land](skills/forge-land/SKILL.md) and [risk-rubric](skills/_shared/risk-rubric.md).

**Merge-ready** — land's low-risk outcome: every precondition met and a low-risk verdict on the head commit, so a person can merge without reading the diff. A new push makes it stale. _Avoid_: "approved", "safe to merge".

**Merged** — land's low-risk outcome when the project set `Auto-merge: low-risk`: the host merged the judged commit, or will once its required checks pass. A push after the verdict stops the merge.

**Addressed thread** — an unresolved review thread whose last comment is ours, or a thread we resolved. Unaddressed threads block review-ready.

**Serialized resource** — a file two Issues must never change in the same Wave (migrations, lockfiles, generated files). Declared per project — see [unattended-config](skills/_shared/unattended-config.md).

**Wave** — a set of AFK Issues whose expected changes and serialized resources do not overlap, so they can ship concurrently. A **Batch** is the ordered list of Waves for a scope.

**Launcher** — whatever starts one guarded ship per Issue in an isolated checkout, such as `claude -w` or a script for your terminal. It is the user's, never part of forge. Skills report to it through `FORGE_STATUS_CMD` (see [status-reporting](skills/_shared/status-reporting.md)).

**Inline fallback** — `(delegate)` step provides both sub-agent and in-context paths for runtime portability.

**Self-containment** — single-use references stay with the skill; cross-skill references live in `skills/_shared/`. Within the shared layer, files have explicit consumers (skills or other shared files); outside it, skills are self-contained.

**Pattern audit** — when a pattern changes, grep every file using the old pattern and update. See [pattern-audit](skills/_shared/pattern-audit.md).

**Quality gates** — lint, format, type check, tests, and coverage (≥90% on new/modified code where tooling exists). Run at phase gates, before commit, PR push, and reflection.

**Attended / unattended** — default pauses for confirmation; `--unattended` uses severity-gated heuristics.

**Trailing context** — `-- <additional context>` appended to provide extra execution guidance.

## Relationships

- An **Issue** has one **AFK/HITL mode** and labels.
- A **Plan** implements one **Issue** through ordered **Vertical phases**.
- An **Exercise** runs once per implementation, before the PR; a wrong result is fixed with a test, not deferred.
- A **Reflection** produces zero or more **Findings**; each is fixed or becomes a **Deferred item**.
- A **Composite skill** runs its component skills' processes; `--unattended` applies across all of them.
- A **Guard** runs zero or more **Rounds** and ends in exactly one of **Review-ready** or **Needs-human**.
- A **Land** judges one commit and ends in exactly one of **Merged** (opt-in only), **Merge-ready**, **Review-ready**, or **Needs-human**.
- A **Batch** orders **Waves**; a **Launcher** starts one **Guard**-ed ship per Issue in a Wave.

## Flagged Ambiguities

- **Issue** (capitalized) is the abstract concept; provider determined per-project.
- **Plan** is the proposal; "plan file" is a markdown artifact containing a Plan.
- **Reflection** is self-review (inline for tiny diffs, otherwise delegated to fresh context); **peer review** is external.
