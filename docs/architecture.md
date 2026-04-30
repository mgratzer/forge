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
│   ├── forge-create-issue/
│   │   ├── SKILL.md                       # Step 1: Plan and create Issues (provider-agnostic)
│   │   └── references/                    # Slicing philosophy, AFK/HITL, plan-folder spec
│   ├── forge-implement/
│   │   ├── SKILL.md                       # Step 2: Implement from issue, plan, or description
│   │   ├── references/                    # Progressive disclosure: implementation craft companions
│   │   └── roles/forge-scout.md           # Blind codebase research persona
│   ├── forge-reflect/
│   │   ├── SKILL.md                       # Step 3: Self-review changes (PR, branch, or uncommitted)
│   │   ├── references/                    # Review dimensions and severity rubric
│   │   └── roles/forge-reviewer.md        # Review agent persona
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

`forge-ship` is a **composite skill** — it composes implement and reflect into a single invocation, delegating review to fresh-context reviewer sub-agents.

- **forge-setup-project** sets up or audits a project's context infrastructure using a three-tier model: `AGENTS.md` as lean hot memory, `docs/` as earned warm memory, and `specs/` (or equivalent) as cold memory, with signal-to-noise scoring for existing guidance. It also supports migrating legacy `CLAUDE.md`-first repos to an `AGENTS.md`-first layout.
- **forge-shape** investigates the codebase, shapes the problem through one-at-a-time questioning until a shared design concept emerges, optionally explores contrasting approaches if shaping didn't surface one, and produces a plan summary ready for issue creation
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates Issues in the project's Issue tracker (GitHub, markdown `plan/` folder, or user-configured provider)
- **forge-implement** reads an issue, plan file, or free-text description, researches the codebase (optionally via blind scout delegation for complex work), plans vertical implementation phases, and opens a PR
- **forge-reflect** self-reviews changes (PR, branch diff, or uncommitted) via four parallel reviewer agents (correctness, security, code quality, efficiency) using a P0-P3 severity rubric
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one
- **forge-ship** composes implement and reflect — implementation runs inline, review is delegated to fresh-context reviewer sub-agents, findings are triaged with the user

## Skill File Format

Every SKILL.md has two parts:

**1. YAML Frontmatter**

```yaml
---
name: forge-<name>              # Kebab-case, prefixed with "forge-"
description: <what it does>     # Used by compatible agents for skill discovery
disable-model-invocation: true  # Optional: prevents auto-invocation
allowed-tools: Read, Bash, ...  # Optional: restricts available tools
---
```

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Skill identifier, used as the slash command name |
| `description` | Yes | Triggers skill selection — compatible agents match user intent to this |
| `disable-model-invocation` | No | When `true`, skill can only be invoked by the user via slash command |
| `allowed-tools` | No | Restricts which tools the skill can use. Omit to allow all tools |

**2. Structured Prompt Body**

Skills follow a consistent section order:
1. Title (`# <Action>`)
2. Description paragraph (optional)
3. Input section (`$ARGUMENTS`; for skills with structured primary input, include the shared trailing context syntax `-- <additional context>`)
4. Process section (numbered Steps)
5. Output Format (optional)
6. Guidelines (brief behavioral rules)
7. Related Skills
8. Example Usage

Skills use **progressive disclosure**: `SKILL.md` contains core instructions (<500 lines), while templates and detailed reference material live in `references/` and load only when needed.

Forge skills with structured primary input may accept `-- <additional context>` as the final segment to provide extra execution guidance without replacing the skill's primary input.

## Role File Format

Roles are reusable sub-agent persona definitions. Each role file lives inside the skill that uses it (under `roles/` or `references/`), keeping skills self-contained for portable installation. A role defines WHO the sub-agent is and HOW it behaves — skills provide WHAT to do (the task).

Every role file has two parts:

**1. YAML Frontmatter**

```yaml
---
name: <role-name>           # Kebab-case identifier, prefixed with `forge-`
description: <what it does>  # One sentence
---
```

| Field | Required | Purpose |
|-------|----------|----------|
| `name` | Yes | Role identifier, referenced in skill delegation steps |
| `description` | Yes | Describes the role's function |

**2. Structured Prompt Body**

The body follows a consistent structure:
1. Title and identity statement
2. Behavior rules (numbered steps or list)
3. Output format
4. Constraints (if any)

The role body is composed with task-specific instructions from the skill. Runtimes that support role-aware delegation load the role as the sub-agent's persona and the skill's blockquote as the task. Runtimes that don't can read the role file inline.

Role files live inside the skill directory that uses them (e.g., `skills/forge-reflect/roles/forge-reviewer.md`). This ensures roles are installed alongside skills regardless of install method (symlink, copy, or package manager). If a role is needed by multiple skills, duplicate it — self-containment beats DRY for distributed prompt files.

Role names are prefixed with `forge-` (e.g., `forge-scout`, `forge-reviewer`) to keep forge's roles in their own namespace. Subagent runtimes that ship bundled agents under generic names (`scout`, `reviewer`, `worker`) won't shadow forge's roles, and users mixing forge with other skill packs can tell them apart at a glance.

## Operating Constraints

LLMs degrade past approximately 100k tokens regardless of the advertised context window. Attention relationships scale quadratically with token count; the further past 100k a session goes, the worse its instruction-following, recall, and reasoning become. The boundary is not a hard threshold — it is a gradual degradation that becomes pronounced enough to act on.

Practitioners call the workable region the **smart zone** and the degraded region the **dumb zone**. Forge's design choices respond to this constraint:

| Mechanism | How it responds |
|-----------|-----------------|
| Sub-agent delegation (`(delegate)` steps) | Move work into fresh context windows when the parent is approaching the dumb zone |
| Fresh-context review (`forge-reflect`, `forge-ship`) | Reviewer starts in smart zone; implementation memory does not bias review |
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
| Tool-layer integration | Skills reference external tools by name, not by import | Extensions (e.g., [pi-interactive-subagents](https://github.com/HazAT/pi-interactive-subagents)) register tools; skills use them when available and fall back when not — zero coupling |
| Reusable roles | `<skill>/roles/*.md` — co-located sub-agent personas | Delegation personas separated from skill body; co-located for portable installation |
| Blind research delegation | Scout researches codebase without seeing the ticket | Knowing the goal causes opinions to leak into research — objective facts lead to better planning |
| Vertical implementation phases | Each phase is a thin end-to-end slice, not a horizontal layer | Horizontal plans (all DB, then all services, then all API) produce untestable intermediate states |
| Three-tier context model | Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs) | Generic context hurts agent performance — tiered model ensures each doc earns its token cost |
| Compatibility layer | `CLAUDE.md` symlink to `AGENTS.md` | Preserve compatibility without making vendor-specific filenames canonical |
| Push vs pull context loading | Push = embed content in initial prompt; Pull = read on demand via file references | Push when reliability matters more than token economy (review rubric, role definitions); pull for optional philosophy and templates that the agent may not need. Progressive disclosure (`references/`) is pull by default; delegation prompts should push critical instructions so sub-agents don't skip or misread them |
| Issue tracker abstraction | Provider-conditional blocks in skills, not a code interface | Skills are prompts — the LLM reads the provider from AGENTS.md and dispatches to the right tool; no adapter pattern needed |
| Undiscoverability test | Only document what agents can't find by exploring | Agents that build own context outperform pre-loaded context; docs should contain decisions, conventions, failure modes |
| Agent readiness assessment | Evaluate feedback loops, module structure, and risks during setup | Architecture and feedback loops affect agent output more than context files — surface gaps early |
