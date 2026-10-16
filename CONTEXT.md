# Forge Context

Shared vocabulary used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker:** system tracking Issues. Providers: GitHub (default, via `gh`), markdown `plan/` folder ([spec](skills/_shared/plan-folder-spec.md)), or user-configured (declared in AGENTS.md: a named skill to delegate to, an MCP server, or a CLI). Completion belongs to the merge: forge marks an Issue in review, never done. Detection: AGENTS.md declaration → `plan/` directory → GitHub fallback.

**Issue:** one tracked unit of work. Carries title, body, and labels; the AFK/HITL mode is recorded at creation (Issue body on GitHub, `mode` frontmatter in the markdown provider).

**Plan:** structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps.

**Vertical slice:** end-to-end implementation crossing all layers for one narrow scenario, testable in isolation. See [vertical-slicing](skills/_shared/vertical-slicing.md).

**Vertical phase:** one ordered step of a Plan: spans all affected layers, ends with tests passing and a commit. Each phase is itself slice-shaped: end-to-end, never a horizontal layer.

**AFK / HITL:** Issue execution mode. AFK: fully specified for autonomous execution. HITL: requires human judgment during implementation. Set at creation time. See [afk-vs-hitl](skills/forge-create-issue/references/afk-vs-hitl.md).

**Reflection:** self-review of current changes before peer review: tiny diffs review inline, otherwise one fresh-context review pass by default, deepened only when risk justifies it. Produces Findings.

**Tiny diff:** roughly ≤2 files and ≤100 changed lines with low risk; reviewed inline only when the session didn't author the changes. See [review-delegation](skills/_shared/review-delegation.md).

**Finding:** one issue surfaced by reflection, severity-tagged P0–P3. P3 not flagged.

**Deferred item:** a Finding or review-feedback item not addressed in the current PR; becomes a new Issue.

**Composite skill:** combines other skills' processes into a single invocation (`forge-ship`, composing implement with the review flow shared with reflect, and `forge-guard` when `--guard` is set).

**Guard:** the stage after self-review that drives an open PR to review-ready without a human: quality passes, CI, peer review, bounded feedback rounds. Never merges. See [forge-guard](skills/forge-guard/SKILL.md).

**Round:** one trip through the guard's react step: a CI fix or a feedback pass, followed by a fresh wait. Bounded by *max guard rounds*.

**Draft PR:** the state every PR a forge skill opens starts in, unless the project declares `Pull requests: ready`. Marking it ready for review is always a human action, never a skill's. _Avoid_: "WIP PR".

**Review-ready / Needs-human:** the guard's two terminal states. Review-ready: CI green, peer review present, all feedback addressed. Needs-human: stopped short, with the reason in the summary. _Avoid_: "done", "green" alone, "ready for review" (GitHub's non-draft state).

**Bot reviewer / human colleague:** who left a piece of review feedback. Bot reviewers (a `Bot` author, or a login listed in `Peer reviewers`) get replies posted automatically; a human colleague's threads get drafted replies in attended mode, so the conversation between people stays theirs.

**Addressed feedback**: an unresolved review thread whose last comment is ours, a thread we resolved, or a top-level review or comment we answered after it was posted. Unaddressed feedback blocks review-ready. _Avoid_: "addressed thread" for top-level items.

**Shipping settings:** every forge setting, declared in a `## Shipping` section of the project's AGENTS.md (which wins) or of the user's `~/.config/forge/shipping.md`, else defaulted. `## Unattended Shipping` is still read as a legacy heading. See [project-config](skills/_shared/project-config.md). _Avoid_: "unattended config" for the whole set.

**Quality pass:** a focused pass after the fresh-context review that owns one dimension: simplify, security, or a project-declared extra pass. Each dimension has exactly one owner per run; an extra pass marked `covers: <dimension>` replaces forge's own pass for it. See [quality-passes](skills/_shared/quality-passes.md).

**Local review / Publish:** in local mode a ship stops at `ready-for-local-review` with nothing pushed; **publish** is the later step that rebases, writes the review record, pushes, and opens the PR. _Avoid_: "ship" for the publish step alone.

**Serialized resource:** a file two Issues must never change in the same Wave (migrations, lockfiles, generated files), or test services every checkout shares (`Test infrastructure: shared`). Declared per project; see [project-config](skills/_shared/project-config.md).

**Wave:** a set of AFK Issues whose expected changes and serialized resources do not overlap, so they can ship concurrently. A **Batch** is the ordered list of Waves for a scope.

**Launcher:** a terminal-specific script that starts one guarded ship per Issue in an isolated checkout. Lives in `contrib/launchers/`, never in a skill. Skills report to it through `FORGE_STATUS_CMD` (see [status-reporting](skills/_shared/status-reporting.md)).

**Inline fallback:** `(delegate)` step provides both sub-agent and in-context paths for runtime portability.

**Self-containment:** single-use references stay with the skill; cross-skill references live in `skills/_shared/`. Within the shared layer, files have explicit consumers (skills or other shared files); outside it, skills are self-contained.

**Pattern audit:** when a pattern changes, find every other place using its old shape and update it. See [pattern-audit](skills/_shared/pattern-audit.md).

**Quality gates:** lint, format, type check, tests, and coverage (≥90% on new/modified code where tooling exists), plus any check the CI workflows enforce (generated code, a coverage threshold). Run at phase gates, before commit, PR push, and reflection.

**Environmental failure:** a test failure caused by a missing service or database (connection refused, port taken), not by code. It is fixed by starting the service, never written off as pre-existing. See [phase-execution](skills/_shared/phase-execution.md).

**Attended / unattended:** default pauses for confirmation; `--unattended` uses severity-gated heuristics.

**Trailing context:** `-- <additional context>` appended to provide extra execution guidance.

## Relationships

- An **Issue** has one **AFK/HITL mode** and labels.
- A **Plan** implements one **Issue** through ordered **Vertical phases**.
- A **Reflection** produces zero or more **Findings**; each is fixed or becomes a **Deferred item**.
- A **Composite skill** runs its component skills' processes; `--unattended` applies across all of them.
- A **Guard** runs zero or more **Rounds** and ends in exactly one of **Review-ready** or **Needs-human**; it works on a **Draft PR** and never marks it ready.
- A **Batch** orders **Waves**; a **Launcher** starts one **Guard**-ed ship per Issue in a Wave.

## Flagged Ambiguities

- **Issue** (capitalized) is the abstract concept; provider determined per-project.
- **Plan** is the proposal; "plan file" is a markdown artifact containing a Plan.
- **Reflection** is self-review (inline for tiny diffs, otherwise delegated to fresh context); **peer review** is external.
