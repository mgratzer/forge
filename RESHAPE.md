# Forge Reshape

Multi-PR evolution of forge, informed by [Matt Pocock's "Essential Skills for AI Coding" workshop](https://www.youtube.com/watch?v=-QFHIoCo-Ko) and ongoing user collaboration. This document is **temporary** — it lives only during the active reshape and should be removed when the work is complete or paused for >30 days. Track-record lives in git history; intent lives here while the work is in flight.

Workshop transcript (local): `/Users/mgratzer/Library/Mobile Documents/iCloud~md~obsidian/Documents/mgratzer/00 Inbox/Essential Skills for AI Coding from Planning to Production — Matt Pocock (@mattpocockuk ).md`

## Why

Pocock's workshop validated nearly every existing forge primitive (vertical slicing, AFK/HITL split, fresh-context review, sub-agent delegation, blind research) and articulated three framings sharper than forge's: the smart-zone constraint, tracer bullets as the lineage for vertical phases, and push-vs-pull as an architectural distinction. The reshape adopts the *framings*, not the *terminology*; preserves forge's identity (slash command names, three-tier context model, conventional commits, the delegation pattern); and adds craft opinion via progressive disclosure where forge previously held only procedure.

## Principles

- **Stay standards-portable.** Skills target the Agent Skills open standard. Do not accommodate any single runtime in canonical files; runtime-specific quirks live in users' local overrides.
- **Adopt patterns that articulate forge's implicit choices** (smart zone, tracer bullets, push/pull). Borrow Pocock's *framings*, not his *terms* (no "grill"; we use "shape").
- **Progressive disclosure for craft opinion.** Each opinionated skill ships SKILL.md (procedure) + `references/<topic>.md` companions (philosophy). Companions load on demand.
- **Skills are workflow entry points; principles are companions.** A skill earns its slot by being a slash-command moment a user deliberately invokes. A principle that applies *during* another skill's execution belongs as a companion under that skill, not as its own skill. Adding a skill per craft principle inflates the slash-command namespace and works against the smart-zone constraint.
- **Preserve user-facing slash commands.** The `forge-` prefix stays. The single rename allowed in this reshape is `forge-brainstorm` → `forge-shape` because the old name was technically wrong.
- **Self-containment beats DRY.** Companions and roles duplicate per-skill rather than cross-link, so skills install independently.
- **No specs-to-code.** Code is the source of truth. PRDs and plans are scaffolding, not destinations.
- **No premature abstraction.** The issue-tracker provider abstraction is a roadmap goal, not a current skill responsibility. Skills stay GitHub-only until the abstraction earns itself.

## Done

| PR | Title | Outcome |
|----|-------|---------|
| [#29](https://github.com/mgratzer/forge/pull/29) | Namespace roles, dedupe checklists, add CONTEXT.md | Roles renamed to `forge-scout`/`forge-reviewer`; `references/review-dimensions.md` extracted; obsolete `model-hint` field removed; `CONTEXT.md` introduced as shared vocabulary |
| [#30](https://github.com/mgratzer/forge/pull/30) | forge-create-issue progressive-disclosure pilot | Companions: `vertical-slicing.md`, `afk-vs-hitl.md` |
| [#31](https://github.com/mgratzer/forge/pull/31) | forge-implement progressive-disclosure | Companions: `vertical-phases.md` (with tracer-bullets lineage), `pre-flight.md`, `pattern-audit.md` |
| [#32](https://github.com/mgratzer/forge/pull/32) | forge-brainstorm → forge-shape rename + convergent methodology | Step 2 batched questioning replaced with one-at-a-time methodology; Step 3 made conditional; Step 4 dropped; companion `shaping-methodology.md` |
| [#33](https://github.com/mgratzer/forge/pull/33) | docs: articulate smart-zone constraint and add RESHAPE.md | `docs/architecture.md` gained an "Operating Constraints" section; `CONTEXT.md` gained vocabulary entries for smart/dumb zone; this `RESHAPE.md` document was introduced |
| [#34](https://github.com/mgratzer/forge/pull/34) | TDD discipline companions | Companions: `tdd-discipline.md`, `good-tests.md`, `when-tdd-is-wrong.md`; forge-implement Step 4 references them; RESHAPE.md gained *skills-vs-companions* principle |
| [#36](https://github.com/mgratzer/forge/pull/36) | Push vs pull context loading | Design Decisions row in `architecture.md`; `forge-reflect` and `forge-ship` refactored to push review context into sub-agent initial prompts; `forge-reviewer` role updated to expect pushed context |
| [#37](https://github.com/mgratzer/forge/pull/37) | Deep-modules companion | Companion: `deep-modules.md` covering Ousterhout's deep-vs-shallow philosophy, testability argument, "delegate implementation, design interfaces" insight, module-shape audit checklist; referenced from forge-implement Step 2 and forge-reflect's Code Reuse & Quality dimension |
| [#38](https://github.com/mgratzer/forge/pull/38) | Verify-before-assume companion | Companion: `verify-before-assume.md` covering API hallucination (version drift, interpolation, flag invention), the verification discipline, and when verification isn't needed; referenced from forge-implement Step 4 |

## In progress

- **This PR**: Barrel-imports companion — `barrel-imports.md` under `forge-implement/references/` covering why agents default to barrel files, the real costs (circular deps, tree-shaking, obscured origin, merge conflicts), when barrels earn their cost (published API boundary, existing convention, framework requirement), and the discipline (check before creating). Referenced from forge-implement Step 4 ("as you code" — existing patterns bullet) and forge-reflect's Code Reuse & Quality dimension (new item 5). Resolves open decision on barrel-imports placement.

## Next

Ordered by leverage. Each is its own PR.

1. **Issue tracker abstraction (Linear, markdown `plan/` folder)** — currently noted as roadmap in `CONTEXT.md`. Promote to implementation: user repos declare provider in their `AGENTS.md` or `CONTEXT.md`; forge skills speak abstractly ("the Issue tracker") and the LLM dispatches to the actual tool. Markdown variant gets first-class spec (`plan/INDEX.md` + `plan/issues/*.md` with frontmatter).
2. **forge-shape grill-style further refinement** (optional) — if Step 2 in practice does not surface clear approaches, revisit whether Step 3's conditional approach-exploration earns its place or should always run.

## Open decisions

- **Issue tracker abstraction shape**: refactor `forge-create-issue` or new skill? Lean: refactor existing — adding a parallel skill creates the same "which one do I use" problem we avoided with shape.
- **What other scattered craft frustrations** belong as companions? User mentioned deep modules, barrel imports, and API hallucination. All three are now addressed as companions. Capture more as they surface, default to companion-under-existing-skill before considering a new skill.

## Anti-goals

- **No specs-to-code framework.** Forge keeps the code as source of truth; PRDs are scaffolding, not destinations.
- **No multi-runtime accommodation in canonical files.** Forge runs in Claude Code primarily; Pi, Codex, etc. get standards compliance only. Per-runtime install hacks live outside the repo.
- **No new top-level abstractions beyond what's earned.** Each abstraction must demonstrate two real use cases before it's promoted to shared infrastructure.
- **No skill renames except the one already done** (`brainstorm` → `shape`). User muscle memory matters.

## Working norms (during the reshape)

- Each PR is one coherent concern; bundle related changes (vocab + framing), separate unrelated ones (rename and progressive-disclosure pilot were one PR but distinct PRs in retrospect — the lesson stuck).
- Companion docs aim for ~60–110 lines. Shorter than that suggests the philosophy isn't substantive enough to extract; longer suggests it should be split.
- The companion structure that has emerged across four files: definition → core principle → why X over Y → mechanics → when to stop / when not to use → common failure modes → decision. Worth treating as a template if it keeps recurring.
- Claude Code is the assumed primary runtime; the PR description should call out any assumptions that bind to it.

## Removal

Remove this file when:
- The "Next" list is empty, OR
- The reshape has been paused with no commits to its branches for >30 days

Per Pocock's anti-doc-rot principle: live planning docs that outlive their usefulness drift from reality and start *misleading* future work. Better to delete and reread the git history.
