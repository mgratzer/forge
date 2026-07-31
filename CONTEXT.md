# Forge Context

Shared vocabulary used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker** — system tracking Issues. Providers: GitHub (default, via `gh`), markdown `plan/` folder ([spec](skills/_shared/plan-folder-spec.md)), or user-configured (declared in AGENTS.md). Detection: AGENTS.md declaration → `plan/` directory → GitHub fallback.

**Issue** — one tracked unit of work. Carries title, body, and labels; the AFK/HITL mode is recorded at creation (Issue body on GitHub, `mode` frontmatter in the markdown provider).

**Plan** — structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps.

**Vertical slice** — end-to-end implementation crossing all layers for one narrow scenario, testable in isolation. See [vertical-slicing](skills/_shared/vertical-slicing.md).

**Vertical phase** — one ordered step of a Plan: spans all affected layers, ends with tests passing and a commit. Each phase is itself slice-shaped — end-to-end, never a horizontal layer.

**AFK / HITL** — Issue execution mode. AFK: fully specified for autonomous execution. HITL: requires human judgment during implementation. Set at creation time. See [afk-vs-hitl](skills/forge-create-issue/references/afk-vs-hitl.md).

**Reflection** — self-review of current changes before peer review: tiny diffs review inline, otherwise one fresh-context review pass by default, deepened only when risk justifies it. Produces Findings.

**Tiny diff** — roughly ≤2 files and ≤100 changed lines with low risk; reviewed inline only when the session didn't author the changes. See [review-delegation](skills/_shared/review-delegation.md).

**Finding** — one issue surfaced by reflection, severity-tagged P0–P3. P3 not flagged.

**Deferred item** — a Finding or review-feedback item not addressed in the current PR; becomes a new Issue.

**Composite skill** — combines other skills' processes into a single invocation (currently only `forge-ship`, composing implement with the review flow shared with reflect).

**Inline fallback** — `(delegate)` step provides both sub-agent and in-context paths for runtime portability.

**Self-containment** — single-use references stay with the skill; cross-skill references live in `skills/_shared/`. Within the shared layer, files have explicit consumers (skills or other shared files); outside it, skills are self-contained.

**Pattern audit** — when a pattern changes, grep ALL files using the old pattern and update. See [pattern-audit](skills/_shared/pattern-audit.md).

**Quality gates** — lint, format, type check, tests, and coverage (≥90% on new/modified code where tooling exists). Run at phase gates, before commit, PR push, and reflection.

**Attended / unattended** — default pauses for confirmation; `--unattended` uses severity-gated heuristics.

**Trailing context** — `-- <additional context>` appended to provide extra execution guidance.

## Relationships

- An **Issue** has one **AFK/HITL mode** and labels.
- A **Plan** implements one **Issue** through ordered **Vertical phases**.
- A **Reflection** produces zero or more **Findings**; each is fixed or becomes a **Deferred item**.
- A **Composite skill** runs its component skills' processes; `--unattended` applies across all of them.

## Flagged Ambiguities

- **Issue** (capitalized) is the abstract concept; provider determined per-project.
- **Plan** is the proposal; "plan file" is a markdown artifact containing a Plan.
- **Reflection** is self-review (inline for tiny diffs, otherwise delegated to fresh context); **peer review** is external.
