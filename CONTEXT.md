# Forge Context

Forge's shared vocabulary. This file defines language used across multiple skills. Terms used in only one skill stay local to that skill.

## Language

**Issue tracker** — the system that tracks Issues for a project. Forge supports three providers:

- **GitHub** (default) — Issues via `gh` CLI. Issue IDs are `#<number>`. Used when AGENTS.md does not specify a provider, or specifies `github`.
- **Markdown** — local `plan/` folder with `INDEX.md` and `issues/*.md` files. Issue IDs are the numeric prefix of the filename (e.g., `001-feature.md` → `#1`). Used when AGENTS.md specifies `markdown` or a `plan/` folder exists. See [plan-folder-spec.md](skills/forge-create-issue/references/plan-folder-spec.md) for the format.
- **Other** (Linear, GitLab, etc.) — user-configured provider. AGENTS.md must declare the provider name and the tool or CLI used to interact with it. Skills use the declared tool where they would otherwise use `gh`.

**Provider detection**: read the project's AGENTS.md for an issue tracker declaration. If none is found and a `plan/` directory exists at the repo root, use the markdown provider. Otherwise default to GitHub.

**Issue** — one tracked unit of work in the Issue tracker. Carries title, body, priority, labels, and an AFK/HITL mode. The format varies by provider but the concept is the same across all three.

**Plan** — a structured proposal for implementing an Issue: durable decisions, vertical phases, verification steps. Lives either inline in conversation or as a markdown file referenced by skills.

**Vertical slice** — an end-to-end implementation crossing all layers (UI → server → DB) for one narrow scenario, testable in isolation. Preferred over horizontal layer-by-layer slicing.

**AFK / HITL** — Issue execution mode. **AFK** (away-from-keyboard): the Issue is fully specified for autonomous agent execution. **HITL** (human-in-the-loop): the Issue requires human judgment during implementation. Set when the Issue is created.

**Reflection** — self-review of pending changes across four parallel dimensions (Correctness & Patterns, Security, Code Reuse & Quality, Efficiency & Tests & Docs) before peer review. Produces Findings.

**Finding** — one issue surfaced by reflection or peer review, severity-tagged P0–P3. P3 findings are not flagged.

**Deferred item** — a Finding not addressed in the current PR; becomes a new Issue in the project's Issue tracker.

**Composite skill** — a skill that orchestrates other skills rather than doing work itself. Currently only `forge-ship` (composes `forge-implement` + `forge-reflect`).

**Inline fallback** — the pattern where a `(delegate)` step provides both a sub-agent delegation path and an in-context alternative for runtimes without sub-agent support. Lets forge skills run anywhere.

**Self-containment** — when multiple skills need the same role or reference, the file is duplicated rather than shared via cross-skill path. Skills install independently of each other; cross-skill paths break portability.

**Smart zone** — the portion of an LLM's context window where attention relationships remain manageable and the model performs reliably. Empirically the first ~100k tokens regardless of the advertised context size; performance degrades past this point as accumulated tokens force quadratic attention work. Forge's delegation, fresh-context review, and progressive-disclosure patterns are all responses to this constraint. See [architecture.md — Operating Constraints](docs/architecture.md#operating-constraints) for the full framing.

**Dumb zone** — the portion of context past the smart zone where output quality drops measurably. Visible as missed instructions, forgotten constraints, hallucinated details, and confusion between similarly-named entities. Not a hard threshold; a gradual degradation that becomes pronounced enough to act on.

**Pattern audit** — when a pattern changes in a diff, grep for ALL files using the old pattern and update them. Surfaced both during implementation and during reflection.

**Quality gates** — lint, format, type check, tests. Run before commit, before PR push, and during reflection. A skill is responsible for both running them and reporting results.

**Attended / unattended mode** — by default, skills pause for user confirmation at decision points (attended). Composite skills accept `--unattended` to skip prompts and use heuristics instead — e.g., `forge-ship --unattended` auto-triages findings by severity.

**Trailing context** — `-- <additional context>` appended to a slash command, providing extra execution guidance without replacing the skill's primary input.

**Three-tier context model** — the user repo's project context is structured as: `AGENTS.md` (hot, always loaded), `docs/*.md` (warm, on-demand by topic), specs (cold, deep references). Each tier must earn its token cost. Established by `forge-setup-project`.

## Relationships

- An **Issue** has one **AFK/HITL mode**, a priority, and labels.
- A **Plan** implements one **Issue** through ordered **Vertical slices**.
- A **Reflection** produces zero or more **Findings**; each Finding is either fixed in the current PR or becomes a **Deferred item** (a new Issue).
- A **Composite skill** invokes other skills; its `--unattended` mode propagates through the composition.

## Flagged ambiguities

- "issue" was previously used to mean GitHub Issues specifically — resolved: **Issue** (capitalized) is the abstract concept; the provider (GitHub, markdown, or other) is determined per-project.
- "plan" was used loosely for both the structured proposal and a markdown file containing one — resolved: **Plan** is the proposal; "plan file" is a markdown artifact that contains a Plan.
- "review" was used for both reflection (self-review) and peer review (external GitHub PR review) — resolved: **Reflection** is self-review by parallel sub-agents; **peer review** is external.
