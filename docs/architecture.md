# Architecture

Forge is a prompt-only repository — no application code, no runtime, no dependencies. It contains Agent Skills prompt files (`SKILL.md`) that teach compatible agents how to execute a structured development workflow with pluggable issue tracking (GitHub, markdown `plan/` folder, or user-configured provider).

## Project Structure

```text
forge/
├── skills/
│   ├── forge-setup-project/
│   │   ├── SKILL.md                       # Step 0: Context infrastructure setup/audit
│   │   └── references/                    # Progressive disclosure: templates, output format
│   ├── forge-shape/                        # Optional: Shape ideas into plans before issue creation
│   │   ├── SKILL.md
│   │   └── references/shaping-methodology.md  # One-at-a-time questioning philosophy
│   ├── _shared/                           # Cross-skill references (see coding-guidelines.md)
│   │   ├── plan-folder-spec.md            # Markdown issue tracker provider spec
│   │   ├── review-rubric.md               # P0–P3 severity taxonomy
│   │   ├── review-dimensions.md           # Lean review checklists: default pass + optional deep passes
│   │   ├── deep-modules.md                # Module depth audit checklist
│   │   ├── barrel-imports.md              # Import structure discipline
│   │   └── roles/forge-reviewer.md        # Review agent persona
│   ├── forge-create-issue/
│   │   ├── SKILL.md                       # Step 1: Plan and create Issues (provider-agnostic)
│   │   └── references/                    # Slicing philosophy, AFK/HITL
│   ├── forge-implement/
│   │   ├── SKILL.md                       # Step 2: Implement from issue, plan, or description
│   │   ├── references/                    # Progressive disclosure: implementation craft companions
│   │   └── roles/forge-scout.md           # Blind codebase research persona
│   ├── forge-reflect/
│   │   ├── SKILL.md                       # Step 3: Self-review changes (PR, branch, or uncommitted)
│   │   └── references/                    # (shared references moved to _shared/)
│   ├── forge-address-pr-feedback/SKILL.md # Step 4: Address PR review comments
│   └── forge-ship/SKILL.md                # Composite: implement + review in one invocation
├── docs/                                  # Project documentation
├── AGENTS.md                              # Canonical agent guidance
├── CLAUDE.md → AGENTS.md                  # Compatibility symlink
└── README.md                              # Project overview
```

## Skill Workflow

The skills form a workflow. Each non-terminal skill references the next step in its "Related Skills" section:

```
forge-setup-project → [forge-shape →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback
                                                                        ╰──── forge-ship ────╯
```

`forge-shape` is optional — use it when the idea is vague and needs convergent questioning to specify before issue creation.

`forge-ship` is a **composite skill** — it composes implement and reflect into a single invocation, keeping review lean with inline review for tiny low-risk diffs and one fresh-context reviewer by default otherwise.

- **forge-setup-project** sets up or audits a project's context infrastructure using a three-tier model: `AGENTS.md` as lean hot memory, `docs/` as earned warm memory, and `specs/` (or equivalent) as cold memory, with signal-to-noise scoring for existing guidance. It also supports migrating legacy `CLAUDE.md`-first repos to an `AGENTS.md`-first layout.
- **forge-shape** investigates the codebase, shapes the problem through one-at-a-time questioning — challenging terminology against CONTEXT.md, cross-referencing claims against code, stress-testing with concrete scenarios — until a shared design concept emerges. Updates CONTEXT.md inline as terms are resolved. Optionally explores contrasting approaches if shaping didn't surface one, and produces a plan summary ready for issue creation
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates Issues in the project's Issue tracker (GitHub, markdown `plan/` folder, or user-configured provider)
- **forge-implement** reads an issue, plan file, or free-text description, researches the codebase (optionally via blind scout delegation for complex work), plans vertical implementation phases using inline guidance, and opens a PR
- **forge-reflect** self-reviews changes (PR, branch diff, or uncommitted) inline for tiny low-risk diffs, otherwise using one fresh-context reviewer by default and adding a second focused pass only for high-risk or broad diffs, with a P0-P3 severity rubric
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one
- **forge-ship** composes implement and reflect — implementation runs inline, review stays inline for tiny low-risk diffs and otherwise uses one fresh-context reviewer by default, findings are triaged with the user

## Skill & Role File Format

See [coding-guidelines.md](coding-guidelines.md) for the complete reference: YAML frontmatter fields, section order, delegate step conventions, and role file format.

Skills use **progressive disclosure**: `SKILL.md` contains core instructions, while templates and detailed reference material live in `references/` and load only when needed. Skills with structured primary input may accept `-- <additional context>` as the final segment.

## Operating Constraints

LLMs degrade past approximately 100k tokens regardless of the advertised context window. Attention relationships scale quadratically with token count; the further past 100k a session goes, the worse its instruction-following, recall, and reasoning become. The boundary is not a hard threshold — it is a gradual degradation that becomes pronounced enough to act on.

Practitioners call the workable region the **smart zone** and the degraded region the **dumb zone**. Forge's design choices respond to this constraint:

| Mechanism | How it responds |
|-----------|-----------------|
| Sub-agent delegation (`(delegate)` steps) | Move work into fresh context windows when the parent is approaching the dumb zone |
| Fresh-context review (`forge-reflect`, `forge-ship`) | Tiny low-risk diffs can stay inline; otherwise one reviewer starts in smart zone by default, and depth is added only when risk justifies it |
| Progressive disclosure (`references/`) | Load companion philosophy on demand instead of always-loading every skill's full content |
| Three-tier context model (`AGENTS.md` / `docs/` / specs) | Each tier earns its always-loaded cost; cold tier loads only when needed |
| Instruction budget (~150–200 instructions per skill body) | Skills stay lean enough to compose without exceeding what frontier LLMs follow consistently |
| Role files (`roles/*.md`) | Sub-agents start with focused persona context, not the parent's accumulated history |

The smart-zone constraint is approximate, model-dependent, and changing — but treating it as a real boundary tends to produce more reliable workflows than assuming the advertised context size is the working size. When a skill's design feels like it has too many moving parts to fit in one head, that is also approximately when it has too many tokens to fit in the smart zone.

The instruction-budget figure (~150–200 instructions) is a related but distinct constraint covered in [coding-guidelines.md](coding-guidelines.md#instruction-budget) — it concerns how many discrete instructions an LLM follows reliably, separately from how many tokens fit in the smart zone.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prompt files, not code | SKILL.md | Skills are prompt templates — no runtime needed |
| Conventional commits | Enforced in every skill | Consistent naming across issues, branches, commits, PRs |
| GraphQL for PR threads | Required in address-pr-feedback | REST API doesn't expose `isResolved` on review threads |
| AskUserQuestion | Used for interactive skills | Structured user input with options, not free-form |
| Pipeline linking | Each skill's "Related Skills" section | Skills reference the next step so users discover the workflow |
| Sub-agent delegation | `context: fork` frontmatter + `(delegate)` step pattern | Fresh context for unbiased review; `context: fork` is the native mechanism in Claude Code, `(delegate)` is the cross-runtime fallback |
| Skill composition | Composite skills reference other skills by path | Keeps orchestrators lean; avoids duplicating step-level instructions across skills |
| Tool-layer integration | Skills reference external tools by name, not by import | Runtimes and extensions expose delegation/model-selection capabilities; skills use them when available and fall back when not — zero coupling. Runtime-specific agent files or presets are optional local tuning, not part of Forge. When a runtime couples agent names to model/provider selection, push role content, prefer inheriting the parent session configuration over hard-coded agent IDs, use cheap fast models for factual scouting, and prefer cheaper review-capable models for routine review work |
| Reusable roles | Skill-specific: `<skill>/roles/*.md`; cross-skill: `_shared/roles/*.md` | Delegation personas separated from skill body; single-use roles co-locate with the skill, shared roles live in `_shared/` |
| Blind research delegation | Scout researches codebase without seeing the ticket | Knowing the goal causes opinions to leak into research — objective facts lead to better planning |
| Vertical implementation phases | Each phase is a thin end-to-end slice, not a horizontal layer | Horizontal plans (all DB, then all services, then all API) produce untestable intermediate states |
| Three-tier context model | Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs) | Generic context hurts agent performance — tiered model ensures each doc earns its token cost |
| Compatibility layer | `CLAUDE.md` symlink to `AGENTS.md` | Preserve compatibility without making vendor-specific filenames canonical |
| Push vs pull context loading | Push = embed content in initial prompt; Pull = read on demand via file references | Push when reliability matters more than token economy (review rubric, role definitions); pull for optional philosophy and templates that the agent may not need. Progressive disclosure (`references/`) is pull by default; delegation prompts should push critical instructions so sub-agents don't skip or misread them |
| Issue tracker abstraction | Provider operations in `_shared/issue-operations.md`; skills reference it | Concentrates provider detection and CRUD in one module; skills say "create an Issue" without re-deriving the three-way conditional |
| Undiscoverability test | Only document what agents can't find by exploring | Agents that build own context outperform pre-loaded context; docs should contain decisions, conventions, failure modes |
| Agent readiness assessment | Evaluate feedback loops, module structure, and risks during setup | Architecture and feedback loops affect agent output more than context files — surface gaps early |
