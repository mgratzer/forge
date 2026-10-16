# Architecture

Forge is a prompt-only repository: no application code, no runtime, no dependencies. It contains Agent Skills prompt files (`SKILL.md`) that teach compatible agents how to execute a structured development workflow with pluggable issue tracking (GitHub, markdown `plan/` folder, or user-configured provider).

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
│   ├── _shared/                           # Cross-skill references; each skill links it as <skill>/_shared
│   │   ├── issue-operations.md            # Provider detection and Issue CRUD
│   │   ├── plan-folder-spec.md            # Markdown issue tracker provider spec
│   │   ├── review-delegation.md           # Lean review flow: inline vs fresh-context passes
│   │   ├── writing.md                     # Writing rule for anything forge writes for people
│   │   ├── quality-passes.md              # Simplify, security, extra passes; one owner per dimension, (each push) reruns
│   │   ├── peer-review-wait.md            # Resolve (or discover), request, and wait for the peer reviewers
│   │   ├── pr-body.md                     # PR body spec for the blind drafter, PR template handling
│   │   ├── status-reporting.md            # FORGE_STATUS_CMD seam and state table
│   │   ├── project-config.md              # Shipping settings: AGENTS.md, the user's file, defaults
│   │   ├── review-rubric.md               # P0–P3 severity taxonomy and the triage rule
│   │   ├── review-dimensions.md           # Lean review checklists: default pass + optional deep passes
│   │   ├── vertical-slicing.md            # Thin end-to-end slicing philosophy
│   │   ├── phase-execution.md             # Pre-flight, per-phase loop, phase gates
│   │   ├── pattern-audit.md               # Pattern consistency audit checklist
│   │   ├── deep-modules.md                # Module depth audit checklist
│   │   ├── barrel-imports.md              # Import structure discipline
│   │   ├── scripts/                       # Runnable helpers: forge-status.sh, wait-reviews.sh
│   │   └── roles/                         # Cross-skill personas: forge-reviewer, forge-scout
│   ├── forge-create-issue/
│   │   ├── SKILL.md                       # Step 1: Plan and create Issues (provider-agnostic)
│   │   └── references/                    # AFK/HITL classification
│   ├── forge-implement/SKILL.md           # Step 2: Implement from Issue, plan, or description
│   ├── forge-reflect/SKILL.md             # Step 3: Self-review changes (PR, branch, or uncommitted)
│   ├── forge-address-pr-feedback/SKILL.md # Step 4: Address PR review comments (--unattended for guards)
│   ├── forge-guard/SKILL.md               # Step 5: Drive an open PR to review-ready without a human
│   ├── forge-batch/SKILL.md               # Group Issues into Waves that can ship concurrently
│   └── forge-ship/
│       ├── SKILL.md                       # Composite: implement + review [+ guard] in one invocation
│       └── references/
│           ├── exercise.md                # Driving the changed path once in the running app
│           └── publish.md                 # Splitting, the local-review hand-off note, rebase and publish
├── contrib/worktree/                      # Agent-agnostic worktree create/remove (Claude Code hooks call them)
├── contrib/launchers/                     # Terminal-specific launchers (cmux first)
├── docs/                                  # Project documentation
├── AGENTS.md                              # Canonical agent guidance
└── README.md                              # Project overview
```

## Skill Workflow

The skills form a workflow. Each non-terminal skill references the next step in its "Related Skills" section:

```
forge-setup-project → [forge-shape →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback → forge-guard
                                                                        ╰──── forge-ship ────╯╰──── forge-ship --guard ────╯
```

`forge-batch` sits beside the line: it groups prepared Issues into Waves, and a launcher runs the line once per Issue (see [unattended.md](unattended.md)).

`forge-shape` is optional; use it when the idea is vague and needs convergent questioning to specify before issue creation.

`forge-ship` is a **composite skill**: it executes implement's process and the review flow shared with reflect in a single invocation, with one fresh-context reviewer by default (its session authors the diff, so review always delegates).

- **forge-setup-project** sets up or audits a project's context infrastructure using a three-tier model: `AGENTS.md` as lean hot memory, `docs/` as earned warm memory, and `specs/` (or equivalent) as cold memory, with signal-to-noise scoring for existing guidance. It also supports migrating legacy `CLAUDE.md`-first repos to an `AGENTS.md`-first layout.
- **forge-shape** investigates the codebase, shapes the problem through one-at-a-time questioning (challenging terminology against CONTEXT.md, cross-referencing claims against code, stress-testing with concrete scenarios) until a shared design concept emerges. Updates CONTEXT.md inline as terms are resolved. Optionally explores contrasting approaches if shaping didn't surface one, and produces a plan summary ready for issue creation
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates Issues in the project's Issue tracker (GitHub, markdown `plan/` folder, or user-configured provider)
- **forge-implement** reads an Issue, plan file, or free-text description, researches the codebase (optionally via blind scout delegation for complex work), plans vertical implementation phases following `_shared/phase-execution.md`, and opens a draft PR
- **forge-reflect** self-reviews changes (PR, branch diff, or uncommitted) inline for tiny low-risk diffs the session didn't author, otherwise using one fresh-context reviewer by default and adding a second focused pass only for high-risk or broad diffs, with a P0-P3 severity rubric
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one
- **forge-ship** executes forge-implement's process up to the push, delegates review to one fresh-context reviewer by default (the session authored the diff), fixes in-scope findings and asks the user only about deferrals, runs the quality passes, exercises the changed path when the project says how to run it, and only then publishes (rebase, push, PR) so its blind-drafted body describes the final diff and carries the evidence; in local mode it stops before publishing and `--publish` finishes later (`references/publish.md`); with `--guard` it continues with forge-guard's process
- **forge-guard** runs the quality passes (unless forge-ship already did), waits for CI and the peer reviewers, addresses feedback in bounded rounds via forge-address-pr-feedback's unattended mode, and stops at `review-ready` or `needs-human`; it never merges
- **forge-batch** estimates each Issue's touch set, excludes HITL and blocked Issues, and groups the rest into Waves with no overlapping files or serialized resources

## Skill & Role File Format

See [coding-guidelines.md](coding-guidelines.md) for the complete reference: YAML frontmatter fields, section order, delegate step conventions, and role file format.

Skills use **progressive disclosure**: `SKILL.md` contains core instructions, while templates and detailed reference material live in `references/` and load only when needed. Every skill accepts `-- <additional context>` as the final segment.

## Operating Constraints

Frontier models now offer context windows up to a million tokens, so the window itself is rarely the limit. Forge's mechanisms answer the constraints that remain: a session that did the work is biased about it, every token a skill loads is paid on every load, and skills have to compose.

| Mechanism | Why it stays |
|-----------|--------------|
| Fresh-context review (`forge-reflect`, `forge-ship`) | A session that wrote the diff reviews its own reasoning rather than the code. A reviewer that starts with only the diff and the rubric reads what the human will read. Tiny low-risk diffs stay inline only when the session didn't author them; one reviewer is the default and depth is added only when risk justifies it |
| Blind delegation (scout, PR body drafter) | Knowing the goal leaks opinions into research; knowing the journey leaks it into the PR body |
| Sub-agent delegation (`(delegate)` steps) | Bulky, self-contained work runs elsewhere, so its output doesn't ride along on every later turn of the parent |
| Progressive disclosure (`references/`) | A skill body is paid for on every load; detail only some runs need loads on demand |
| Three-tier context model (`AGENTS.md` / `docs/` / specs) | Each tier earns its always-loaded cost; the cold tier loads only when needed |
| Lean skill bodies (under ~35 instructions) | Composite skills load their components' instructions too, and every instruction competes with the task for attention. The figure is a composability heuristic, not a model limit; see [coding-guidelines.md](coding-guidelines.md#instruction-budget) |
| Role files (`roles/*.md`) | Sub-agents start with a focused persona, not the parent's accumulated history |

Long sessions still cost: each turn re-reads the context, so accumulated history adds money and latency, and stale history (abandoned approaches, old tool output) biases later decisions. Keeping skills lean and delegating bulky work stays the cheaper and more reliable default even when everything would fit. Removing one of these mechanisms because the window got bigger trades a real bias for a saving that isn't there.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prompt files, not code | SKILL.md | Skills are prompt templates; no runtime needed |
| Conventional commits | Enforced in every skill | Consistent naming across issues, branches, commits, PRs |
| GraphQL for PR threads | Required in address-pr-feedback | REST API doesn't expose `isResolved` on review threads |
| AskUserQuestion | Used for interactive skills | Structured user input with options, not free-form |
| Pipeline linking | Each skill's "Related Skills" section | Skills reference the next step so users discover the workflow |
| Sub-agent delegation | `(delegate)` step pattern; `context: fork` frontmatter available for whole-skill forking | Fresh context for unbiased review; `(delegate)` works across runtimes, `context: fork` is Claude Code's native whole-skill mechanism (unsuitable for skills with interactive steps) |
| Skill composition | Composite skills reuse component processes and shared `_shared/` modules | Keeps orchestrators lean; shared modules prevent duplicated step-level instructions from drifting |
| Tool-layer integration | Skills use runtime capabilities (sub-agent tools, per-task model choice) when present, with an inline fallback; never a runtime-specific agent name | Runtimes and extensions expose delegation/model-selection capabilities; skills use them when available and fall back when not (zero coupling). Runtime-specific agent files or presets are optional local tuning, not part of Forge. When a runtime couples agent names to model/provider selection, push role content, prefer inheriting the parent session configuration over hard-coded agent IDs, and run factual scouting and routine review at lower effort or on a cheaper model; try the same model at lower effort first |
| Reusable roles | Skill-specific: `<skill>/roles/*.md`; cross-skill: `_shared/roles/*.md` | Delegation personas separated from skill body; single-use roles co-locate with the skill, shared roles live in `_shared/` |
| Blind research delegation | Scout researches codebase without seeing the Issue | Knowing the goal causes opinions to leak into research; objective facts lead to better planning |
| Vertical implementation phases | Each phase is a thin end-to-end slice, not a horizontal layer | Horizontal plans (all DB, then all services, then all API) produce untestable intermediate states |
| Three-tier context model | Hot (`AGENTS.md`) / Warm (`docs/`) / Cold (specs) | Generic context hurts agent performance; tiered model ensures each doc earns its token cost |
| Single guidance file | `AGENTS.md` only; no `CLAUDE.md` | Claude Code and other agents read `AGENTS.md` natively, so a symlink or copy only adds a second name for one file. A `CLAUDE.md` exists only for Claude-specific content or for sessions that read only `CLAUDE.md` (older than v2.1.281 on Bedrock or with telemetry disabled), as `@AGENTS.md` plus that content |
| Push vs pull context loading | Push = embed content in initial prompt; Pull = read on demand via file references | Push when reliability matters more than token economy (review rubric, role definitions); pull for optional philosophy and templates that the agent may not need. Progressive disclosure (`references/`) is pull by default; delegation prompts should push critical instructions so sub-agents don't skip or misread them |
| Bundled shared layer | Each skill contains a `_shared -> ../_shared` symlink; skills link `_shared/<file>.md`, never `../_shared/` | Installers such as `npx skills add` copy only directories with a `SKILL.md`, one at a time, and dereference symlinks, so the symlink ships a real copy of the shared layer inside every installed skill. Agents also resolve `..` lexically from the install path, so sibling links break under symlinked installs |
| Issue tracker abstraction | Provider operations in `_shared/issue-operations.md`; skills reference it | Concentrates provider detection and CRUD in one module; skills say "create an Issue" without re-deriving the three-way conditional |
| Undiscoverability test | Only document what agents can't find by exploring | Agents that build own context outperform pre-loaded context; docs should contain decisions, conventions, failure modes |
| PRs open as drafts | `gh pr create --draft` unless the project declares `Pull requests: ready`; no skill runs `gh pr ready` | The draft flag tells people an agent may still push; clearing it is the human's signal that review can start. Projects run CI and the peer reviewers on drafts; see [unattended](unattended.md#setup) |
| Guard never merges | `review-ready` is the last state | Merging is a human decision with production consequences; an unattended loop that merges removes the one review that matters |
| Waiting happens in shell, not in the model | `gh pr checks --watch`, bounded polling, runtime wait facilities | Polling output re-enters the context on every later turn and buys nothing; a blocked shell call costs nothing |
| Runnable helpers in `_shared/scripts/` | Small POSIX-style bash scripts, called by a literal path, `<skill dir>/_shared/scripts/<script>` | Runtimes refuse a command whose name is computed at runtime, a shell loop, or a `sleep` prefix, and skills that inline them stall. A script with a fixed name runs as one plain command. Besides `contrib/`, this is the one place forge ships runnable code; the scripts stay runtime-agnostic and need only `bash` and `gh` |
| One seam, launchers outside the skill layer | `FORGE_STATUS_CMD` + `contrib/launchers/<terminal>-<agent>.sh` | Skills stay ignorant of terminals; launchers are the only runtime-specific code and skills must work without one |
| Settings only for what forge acts on | A Shipping setting exists only when a skill acts on it mechanically: which tracker, which reviewers, draft or ready, which passes | Everything else (a compatibility policy, shared test services, a sign-off format) is a project convention the agent already reads from `AGENTS.md`; a setting for it would turn forge into a configuration framework for one team's environment |
| Attestation is the project's skill | A project that audits review declares its own skill in `Extra passes`, marked `(each push)`; forge only runs it before each later push that changes code | Record formats differ per team; forge runs the hook at the right moments instead of owning a format |
| Agent readiness assessment | Evaluate feedback loops, module structure, and risks during setup | Architecture and feedback loops affect agent output more than context files; surface gaps early |
