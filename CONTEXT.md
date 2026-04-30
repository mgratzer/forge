# Forge Context

Shared vocabulary used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker** — system tracking Issues. Providers: GitHub (default, via `gh`), markdown `plan/` folder ([spec](skills/forge-create-issue/references/plan-folder-spec.md)), or user-configured (declared in AGENTS.md). Detection: AGENTS.md declaration → `plan/` directory → GitHub fallback.

**Issue** — one tracked unit of work. Carries title, body, labels, and AFK/HITL mode.

**Plan** — structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps.

**Vertical slice** — end-to-end implementation crossing all layers for one narrow scenario, testable in isolation. See [vertical-slicing](skills/forge-create-issue/references/vertical-slicing.md).

**AFK / HITL** — Issue execution mode. AFK: fully specified for autonomous execution. HITL: requires human judgment during implementation. Set at creation time. See [afk-vs-hitl](skills/forge-create-issue/references/afk-vs-hitl.md).

**Reflection** — self-review across four parallel dimensions before peer review. Produces Findings.

**Finding** — one issue surfaced by reflection, severity-tagged P0–P3. P3 not flagged.

**Deferred item** — a Finding not addressed in the current PR; becomes a new Issue.

**Composite skill** — orchestrates other skills (currently only `forge-ship`).

**Inline fallback** — `(delegate)` step provides both sub-agent and in-context paths for runtime portability.

**Self-containment** — duplicate files rather than cross-skill paths; skills install independently.

**Smart zone / Dumb zone** — workable region (~first 100k tokens) vs degraded region of LLM context. See [architecture — Operating Constraints](docs/architecture.md#operating-constraints).

**Pattern audit** — when a pattern changes, grep ALL files using the old pattern and update. See [pattern-audit](skills/forge-implement/references/pattern-audit.md).

**Quality gates** — lint, format, type check, tests. Run before commit, PR push, and reflection.

**Attended / unattended** — default pauses for confirmation; `--unattended` uses severity-gated heuristics.

**Trailing context** — `-- <additional context>` appended to provide extra execution guidance.

**Three-tier context** — Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs). Each tier earns its token cost.

## Relationships

- An **Issue** has one **AFK/HITL mode**, a priority, and labels.
- A **Plan** implements one **Issue** through ordered **Vertical slices**.
- A **Reflection** produces zero or more **Findings**; each is fixed or becomes a **Deferred item**.
- A **Composite skill** invokes other skills; `--unattended` propagates through composition.

## Flagged Ambiguities

- **Issue** (capitalized) is the abstract concept; provider determined per-project.
- **Plan** is the proposal; "plan file" is a markdown artifact containing a Plan.
- **Reflection** is self-review by sub-agents; **peer review** is external.
