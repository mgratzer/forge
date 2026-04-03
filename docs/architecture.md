# Architecture

Forge is a prompt-only repository — no application code, no runtime, no dependencies. It contains Agent Skills prompt files (`SKILL.md`) that teach compatible agents how to execute a structured GitHub development workflow.

## Project Structure

```text
forge/
├── skills/
│   ├── forge-setup-project/
│   │   ├── SKILL.md                       # Step 0: Context infrastructure setup/audit
│   │   └── references/                    # Progressive disclosure: templates, output format
│   ├── forge-brainstorm/SKILL.md          # Optional: Explore ideas before issue creation
│   ├── forge-create-issue/SKILL.md        # Step 1: Plan and create GitHub issues
│   ├── forge-design-issue/SKILL.md        # Step 2: Design approach before coding
│   ├── forge-implement-issue/SKILL.md     # Step 3: Implement from an issue
│   ├── forge-reflect-pr/
│   │   ├── SKILL.md                       # Step 4: Self-review before peer review
│   │   └── references/                    # Review rubric (P0-P3 severity)
│   └── forge-address-pr-feedback/SKILL.md # Step 5: Address PR review comments
├── docs/                                  # Project documentation
├── AGENTS.md                              # Canonical agent guidance
├── CLAUDE.md → AGENTS.md                  # Compatibility symlink
└── README.md                              # Project overview
```

## Skill Workflow

The skills form a workflow. Each non-terminal skill references the next step in its "Related Skills" section:

```
forge-setup-project → [forge-brainstorm →] forge-create-issue → [forge-design-issue →] forge-implement-issue → forge-reflect-pr → forge-address-pr-feedback
```

`forge-brainstorm` is optional — use it when the idea is vague and needs exploration before issue creation.
`forge-design-issue` is optional — use it for complex work that benefits from upfront alignment on architecture and approach.

- **forge-setup-project** sets up or audits a project's context infrastructure using a three-tier model: `AGENTS.md` as lean hot memory, `docs/` as earned warm memory, and `specs/` (or equivalent) as cold memory, with signal-to-noise scoring for existing guidance. It also supports migrating legacy `CLAUDE.md`-first repos to an `AGENTS.md`-first layout.
- **forge-brainstorm** investigates the codebase, clarifies the problem through structured questioning, presents approaches with tradeoffs, and produces a plan summary ready for issue creation
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates GitHub issues with `gh`
- **forge-design-issue** produces a design discussion and structure outline through objective codebase research (delegated to a sub-agent that doesn't see the ticket) and interactive alignment with the user
- **forge-implement-issue** reads an issue (and its design if one exists), creates a branch, implements following vertical phases, and opens a PR
- **forge-reflect-pr** self-reviews the PR diff via four parallel review agents (correctness, security, code quality, efficiency) using a P0-P3 severity rubric
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one

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

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prompt files, not code | SKILL.md | Skills are prompt templates — no runtime needed |
| Conventional commits | Enforced in every skill | Consistent naming across issues, branches, commits, PRs |
| GraphQL for PR threads | Required in address-pr-feedback | REST API doesn't expose `isResolved` on review threads |
| AskUserQuestion | Used for interactive skills | Structured user input with options, not free-form |
| Pipeline linking | Each skill's "Related Skills" section | Skills reference the next step so users discover the workflow |
| Sub-agent delegation | `context: fork` frontmatter + `(delegate)` step pattern | Fresh context for unbiased review; `context: fork` is the native mechanism in Claude Code, `(delegate)` is the cross-runtime fallback |
| Separate research from intent | Sub-agent researches codebase without seeing the ticket | Knowing the goal causes opinions to leak into research — objective facts lead to better design decisions |
| Design before implement | Optional design discussion + structure outline before coding | Catch wrong patterns in a 200-line doc instead of 1,000 lines of code; shorter artifact for team review |
| Vertical implementation phases | Each phase is a thin end-to-end slice, not a horizontal layer | Horizontal plans (all DB, then all services, then all API) produce untestable intermediate states |
| Three-tier context model | Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs) | Generic context hurts agent performance — tiered model ensures each doc earns its token cost |
| Compatibility layer | `CLAUDE.md` symlink to `AGENTS.md` | Preserve compatibility without making vendor-specific filenames canonical |
| Undiscoverability test | Only document what agents can't find by exploring | Agents that build own context outperform pre-loaded context; docs should contain decisions, conventions, failure modes |
| Agent readiness assessment | Evaluate feedback loops, module structure, and risks during setup | Architecture and feedback loops affect agent output more than context files — surface gaps early |
