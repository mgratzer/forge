# Architecture

Forge's skills are prompts: no application code, no runtime, no dependencies. The repository contains Agent Skills prompt files (`SKILL.md`) that teach compatible agents how to execute a structured development workflow with pluggable issue tracking (GitHub, markdown `plan/` folder, or user-configured provider). Its root is also a Claude Code plugin that bundles the skills with the [lens](lens.md), an optional view that reads what the skills print.

## Project Structure

```text
forge/
├── .claude-plugin/                        # Claude Code plugin "forge" and its marketplace entry
├── lens/                                  # Optional Claude Code view over a run: hooks/, types/, tests/
├── skills/
│   ├── forge-setup-project/
│   │   ├── SKILL.md                       # Step 0: Context infrastructure setup/audit
│   │   └── references/                    # Progressive disclosure: templates, output format
│   ├── forge-shape/                        # Optional: Shape ideas into plans before issue creation
│   │   ├── SKILL.md
│   │   └── references/shaping-methodology.md  # One-at-a-time questioning philosophy
│   ├── _shared/                           # Cross-skill references; each skill links it as <skill>/_shared
│   │   ├── issue-operations.md            # Provider detection and Issue CRUD
│   │   ├── plan-folder-spec.md            # Markdown issue tracker provider spec
│   │   ├── review-delegation.md           # Lean review flow: inline vs fresh-context passes
│   │   ├── status-reporting.md            # FORGE_STATUS_CMD seam and state table
│   │   ├── unattended-config.md           # AGENTS.md settings read by guard, land, and batch
│   │   ├── review-rubric.md               # P0–P3 severity taxonomy
│   │   ├── risk-rubric.md                 # forge-land's checks, judgment test, ## Risk section
│   │   ├── review-dimensions.md           # Lean review checklists: default pass + optional deep passes
│   │   ├── vertical-slicing.md            # Thin end-to-end slicing philosophy
│   │   ├── phase-execution.md             # Pre-flight, per-phase loop, phase gates
│   │   ├── exercise.md                    # Run the changed path before the PR; ## Exercised report
│   │   ├── pr-body.md                     # PR body: why, deployment steps, change outline, ## Exercised, ## Plan with deviations
│   │   ├── open-work.md                   # Unmet prerequisites, open PRs for an Issue, conflicts with them
│   │   ├── pattern-audit.md               # Pattern consistency audit checklist
│   │   ├── deep-modules.md                # Module depth audit checklist
│   │   ├── barrel-imports.md              # Import structure discipline
│   │   └── roles/                         # Cross-skill personas: forge-reviewer, forge-scout
│   ├── forge-create-issue/
│   │   ├── SKILL.md                       # Step 1: Plan and create Issues (provider-agnostic)
│   │   └── references/                    # AFK/HITL classification
│   ├── forge-implement/SKILL.md           # Step 2: Implement from Issue, plan, or description
│   ├── forge-reflect/SKILL.md             # Step 3: Self-review changes (PR, branch, or uncommitted)
│   ├── forge-address-pr-feedback/SKILL.md # Step 4: Address PR review comments (--unattended for guards)
│   ├── forge-guard/SKILL.md               # Step 5: Drive an open PR to review-ready without a human
│   ├── forge-land/SKILL.md                # Step 6: Risk verdict on a green PR: merge-ready or review-ready
│   ├── forge-batch/
│   │   ├── SKILL.md                       # Group Issues into Waves that can ship concurrently
│   │   └── references/start.md            # --start: start ready Issues, continue the scope on each run
│   └── forge-ship/SKILL.md                # Composite: implement + review [+ guard + land] in one invocation
├── docs/                                  # Project documentation
├── AGENTS.md                              # Canonical agent guidance
└── README.md                              # Project overview
```

## Skill Workflow

The skills form a workflow. Each non-terminal skill references the next step in its "Related Skills" section:

```
forge-setup-project → [forge-shape →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback → forge-guard → forge-land
                                                                        ╰──── forge-ship ────╯╰────────── forge-ship --guard ───────────╯
```

`forge-batch` sits beside the line: it groups prepared Issues into Waves, and a launcher, or `forge-batch --start`, runs the line once per Issue (see [unattended.md](unattended.md)).

`forge-shape` is optional — use it when the idea is vague and needs convergent questioning to specify before issue creation.

`forge-ship` is a **composite skill** — it executes implement's process and the review flow shared with reflect in a single invocation, with one fresh-context reviewer by default (its session authors the diff, so review always delegates).

- **forge-setup-project** sets up or audits a project's context infrastructure using a three-tier model: `AGENTS.md` as lean hot memory, `docs/` as earned warm memory, and `specs/` (or equivalent) as cold memory, with signal-to-noise scoring for existing guidance. It also supports migrating legacy `CLAUDE.md`-first repos to an `AGENTS.md`-first layout. It checks that the project has a run recipe and, when the project ships through PRs, offers the `## Unattended Shipping` section filled from what it discovers.
- **forge-shape** investigates the codebase, shapes the problem through one-at-a-time questioning — challenging terminology against CONTEXT.md, cross-referencing claims against code, stress-testing with concrete scenarios — until a shared design concept emerges. Updates CONTEXT.md inline as terms are resolved. Optionally explores contrasting approaches if shaping didn't surface one, and produces a plan summary with a vertically sliced Issue breakdown ready for issue creation. Opens a docs PR for its CONTEXT.md and ADR edits
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates Issues in the project's Issue tracker (GitHub, markdown `plan/` folder, or user-configured provider)
- **forge-implement** reads an Issue, plan file, or free-text description, checks that an Issue's prerequisites have landed and no open PR already does it (`_shared/open-work.md`), researches the codebase (optionally via blind scout delegation for complex work), plans vertical implementation phases following `_shared/phase-execution.md`, exercises the change in the running app following `_shared/exercise.md`, and opens a PR following `_shared/pr-body.md`: a change outline, an `## Exercised` section, and the Plan with who approved it, its revisions and its deviations
- **forge-reflect** self-reviews changes (PR, branch diff, or uncommitted) inline for tiny low-risk diffs the session didn't author, otherwise using one fresh-context reviewer by default and adding a second focused pass only for high-risk or broad diffs, with a P0-P3 severity rubric
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one
- **forge-ship** executes forge-implement's process, runs the simplification pass, then delegates review to one fresh-context reviewer by default (the session authored the diff) and triages findings with the user; with `--guard` it continues with forge-guard's process, then forge-land's when the guard reaches `review-ready`
- **forge-guard** runs simplification and conditional security passes, waits for CI and the peer reviewer, keeps the branch mergeable, fixes only the CI failures the branch caused, addresses feedback in bounded rounds via forge-address-pr-feedback's unattended mode, and stops at `review-ready` or `needs-human` — it never merges
- **forge-land** checks that a PR is mergeable, green, addressed and exercised, delegates a risk verdict on the head commit to fresh context using `_shared/risk-rubric.md`, writes it into the PR as `## Risk`, and reports `merge-ready` or `review-ready` with a review request and a Where to look list. It merges a low-risk PR only when the project opted in with `Auto-merge: low-risk`, and then reports `merged`
- **forge-batch** estimates each Issue's touch set, excludes HITL and blocked Issues, and groups the rest into Waves with no overlapping files or serialized resources; with `--start` it starts the ready ones and continues the scope on each re-run, never merging

## Skill & Role File Format

See [coding-guidelines.md](coding-guidelines.md) for the complete reference: YAML frontmatter fields, section order, delegate step conventions, and role file format.

Skills use **progressive disclosure**: `SKILL.md` contains core instructions, while templates and detailed reference material live in `references/` and load only when needed. Every skill accepts `-- <additional context>` as the final segment.

## Operating Constraints

LLMs degrade past approximately 100k tokens regardless of the advertised context window. Attention relationships scale quadratically with token count; the further past 100k a session goes, the worse its instruction-following, recall, and reasoning become. The boundary is not a hard threshold — it is a gradual degradation that becomes pronounced enough to act on.

Practitioners call the workable region the **smart zone** and the degraded region the **dumb zone**. Forge's design choices respond to this constraint:

| Mechanism | How it responds |
|-----------|-----------------|
| Sub-agent delegation (`(delegate)` steps) | Move work into fresh context windows when the parent is approaching the dumb zone |
| Fresh-context review (`forge-reflect`, `forge-ship`) | Tiny low-risk diffs stay inline only when the session didn't author them; otherwise one reviewer starts in smart zone by default, and depth is added only when risk justifies it |
| Progressive disclosure (`references/`) | Load companion philosophy on demand instead of always-loading every skill's full content |
| Three-tier context model (`AGENTS.md` / `docs/` / specs) | Each tier earns its always-loaded cost; cold tier loads only when needed |
| Instruction budget (under ~35 instructions per skill body) | Skills stay lean enough to compose without exceeding the ~150–200 instructions frontier LLMs follow consistently |
| Role files (`roles/*.md`) | Sub-agents start with focused persona context, not the parent's accumulated history |

The smart-zone constraint is approximate, model-dependent, and changing — but treating it as a real boundary tends to produce more reliable workflows than assuming the advertised context size is the working size. When a skill's design feels like it has too many moving parts to fit in one head, that is also approximately when it has too many tokens to fit in the smart zone.

The instruction-budget figures (~150–200 followed reliably overall, under ~35 per skill) are a related but distinct constraint covered in [coding-guidelines.md](coding-guidelines.md#instruction-budget) — they concern how many discrete instructions an LLM follows reliably, separately from how many tokens fit in the smart zone.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prompt files, not code | SKILL.md | Skills are prompt templates — no runtime needed |
| Conventional commits | Enforced in every skill | Consistent naming across issues, branches, commits, PRs |
| GraphQL for PR threads | Required in address-pr-feedback | REST API doesn't expose `isResolved` on review threads |
| AskUserQuestion | Used for interactive skills | Structured user input with options, not free-form |
| Pipeline linking | Each skill's "Related Skills" section | Skills reference the next step so users discover the workflow |
| Sub-agent delegation | `(delegate)` step pattern; `context: fork` frontmatter available for whole-skill forking | Fresh context for unbiased review; `(delegate)` works across runtimes, `context: fork` is Claude Code's native whole-skill mechanism — unsuitable for skills with interactive steps |
| Skill composition | Composite skills reuse component processes and shared `_shared/` modules | Keeps orchestrators lean; shared modules prevent duplicated step-level instructions from drifting |
| Tool-layer integration | Skills use runtime capabilities (sub-agent tools, per-task model choice) when present, with an inline fallback; never a runtime-specific agent name | Runtimes and extensions expose delegation/model-selection capabilities; skills use them when available and fall back when not — zero coupling. Runtime-specific agent files or presets are optional local tuning, not part of Forge. When a runtime couples agent names to model/provider selection, push role content, prefer inheriting the parent session configuration over hard-coded agent IDs, use cheap fast models for factual scouting, and prefer cheaper review-capable models for routine review work |
| Reusable roles | Skill-specific: `<skill>/roles/*.md`; cross-skill: `_shared/roles/*.md` | Delegation personas separated from skill body; single-use roles co-locate with the skill, shared roles live in `_shared/` |
| Blind research delegation | Scout researches codebase without seeing the Issue | Knowing the goal causes opinions to leak into research — objective facts lead to better planning |
| Vertical implementation phases | Each phase is a thin end-to-end slice, not a horizontal layer | Horizontal plans (all DB, then all services, then all API) produce untestable intermediate states |
| Three-tier context model | Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs) | Generic context hurts agent performance — tiered model ensures each doc earns its token cost |
| Single guidance file | `AGENTS.md` only; no `CLAUDE.md` | Claude Code and other agents read `AGENTS.md` natively, so a symlink or copy only adds a second name for one file. A `CLAUDE.md` exists only for Claude-specific content or for sessions that read only `CLAUDE.md` ([which ones](https://code.claude.com/docs/en/memory#when-agents-md-support-is-unavailable)), as `@AGENTS.md` plus that content |
| Push vs pull context loading | Push = embed content in initial prompt; Pull = read on demand via file references | Push when reliability matters more than token economy (review rubric, role definitions); pull for optional philosophy and templates that the agent may not need. Progressive disclosure (`references/`) is pull by default; delegation prompts should push critical instructions so sub-agents don't skip or misread them |
| Bundled shared layer | Each skill contains a `_shared -> ../_shared` symlink; SKILL.md links `_shared/<file>.md`, never `../_shared/`, and a `references/` file links `../_shared/<file>.md` | Installers such as `npx skills add` copy only directories with a `SKILL.md`, one at a time, and dereference symlinks — the symlink ships a real copy of the shared layer inside every installed skill. Agents also resolve `..` lexically from the install path, so sibling links break under symlinked installs |
| Issue tracker abstraction | Provider operations in `_shared/issue-operations.md`; skills reference it | Concentrates provider detection and CRUD in one module; skills say "create an Issue" without re-deriving the three-way conditional |
| Undiscoverability test | Only document what agents can't find by exploring | Agents that build own context outperform pre-loaded context; docs should contain decisions, conventions, failure modes |
| Exercise before the PR | `forge-implement` runs the app and uses the changed path once; the recipe comes from the runtime's run skill or `AGENTS.md`, never a guess | Tests only cover what someone thought to test; the observed result in the PR lets a human skip checking out a small PR. No recipe means an honest `not exercised` line, never a made-up run, and land sends an unexercised runtime change to review |
| Only land merges, and only by opt-in | The guard never merges. `forge-land` merges only a PR it judged low risk, only when the project set `Auto-merge: low-risk`, and only the judged commit (`--match-head-commit`) | Merging has production consequences, so a loop that fixes its own PR must not also approve it. A fresh-context verdict on one commit can stand in for the click on small, checked, exercised PRs from trusted Issues. Whether it may is a property of the repository, not of one run, so it is a project setting rather than a flag |
| Risk verdict in its own skill | `forge-land` judges in fresh context, tied to the head commit; mechanical checks first, then one judgment test | The session that wrote the code is the worst judge of its risk, and a verdict on an older commit says nothing about the new one. Separate from the guard so it works on any PR; it decides what a PR needs from a human and leaves the merge to one unless the project opted in |
| Waiting happens in shell, not in the model | `gh pr checks --watch`, bounded polling, runtime wait facilities | Polling output in the context window pushes the session toward the dumb zone; a blocked shell call costs nothing |
| Lens in the plugin, not in the skills | The repo root is the Claude Code plugin `forge`: the skills plus `lens/`, which only parses what the skills already write (status calls, findings, `## Risk`, batch output, `## Unattended Shipping`) | The skills stay portable Markdown and never call the lens. Shipping both as one plugin version keeps the lens's parser matched to the formats it reads, and a format change updates `lens/hooks/parse.ts` in the same PR. The plugin has no `version`, so installs track commits |
| One seam, launchers outside forge | `FORGE_STATUS_CMD`; forge ships no launcher and no worktree hooks | Skills stay ignorant of terminals and worktree tools. A launcher or a checkout bootstrap fits one person's terminal and projects, so it stays theirs, and skills must work without one |
| Agent readiness assessment | Evaluate feedback loops, module structure, and risks during setup | Architecture and feedback loops affect agent output more than context files — surface gaps early |
