---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation. Implements from an Issue, plan file, or free-text description, then delegates review to fresh-context reviewer sub-agents. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship

Implement end to end — code it, review it, ship it. Implementation runs in the current session; review is delegated to fresh-context reviewer sub-agents for unbiased findings.

## Input

Primary input: an Issue (from the project's Issue tracker), a plan file, or a free-text description.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` the same way as `forge-implement`:
- `<issue-number>` — Issue in the project's Issue tracker
- `<issue-url>` — Issue URL (GitHub, Linear, etc.)
- `<file-path>` — path to a plan, roadmap, or spec file
- `<free-text>` — inline description of what to build
- Any of the above followed by `-- <additional context>`

### Unattended Mode

When `$ARGUMENTS` contains `--unattended`, the skill runs without user interaction:
- Plan approval is skipped — the agent proceeds with the plan it creates
- Review findings are auto-triaged using severity (see Step 4)

Strip `--unattended` from the arguments before passing them to forge-implement.

## Process

### Step 1: Implement

Read [forge-implement](../forge-implement/SKILL.md) and execute its Steps 1 through 8 (Understand → Plan → Branch → Implement → Pattern Audit → Docs → Quality Gates → Push & Create PR).

**In unattended mode:** skip plan approval in forge-implement Step 2 — proceed with the plan without calling AskUserQuestion.

Do not produce the implementation summary yet — the review will inform the final report.

### Step 2: Prepare Review Context

Collect the materials the reviewers need:

```bash
git fetch origin
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git diff origin/$DEFAULT_BRANCH...HEAD
git diff --name-only origin/$DEFAULT_BRANCH...HEAD
```

**Read and collect the review context** — this content will be embedded in each sub-agent's initial prompt (pushed, not referenced):

1. Read [forge-reviewer role](../forge-reflect/roles/forge-reviewer.md)
2. Read [review dimensions](../forge-reflect/references/review-dimensions.md) — the four reviewer checklists
3. Read [review rubric](../forge-reflect/references/review-rubric.md) — severity calibration
4. Read `AGENTS.md` — project conventions

Compose **four self-contained review tasks** — one per dimension — that each embed:
- The forge-reviewer role definition (full text)
- One dimension checklist (full text, not a file path)
- The review rubric (full text, not a file path)
- `AGENTS.md` content
- The full diff and changed file list
- Branch name and PR number
- Any additional context from the user's `$ARGUMENTS`

### Step 3: Review (delegate)

**Delegate to four parallel sub-agents for review.** Fresh context eliminates self-review bias — each reviewer has no memory of implementation decisions and focuses on one quality dimension.

Use the first available delegation mechanism:

1. **`subagent` tool** (e.g., Pi with [pi-interactive-subagents](https://github.com/HazAT/pi-interactive-subagents)): spawn four concurrent sub-agents with `agent: "forge-reviewer"`, one for each dimension task.
2. **Runtime context forking** (e.g., Claude Code Task tool): delegate four fresh-context review tasks in parallel.
3. **Inline fallback**: if no sub-agent mechanism is available, execute the four review dimensions sequentially in the current context using the role and checklists already collected in Step 2.

Wait for **all four** review results before proceeding.

### Step 4: Triage Findings

Aggregate and deduplicate findings from all four review agents.

**In attended mode (default):** present each finding to the user with a recommendation:

- **Fix now** — small, low-effort changes that fit in this PR → apply fix, commit
- **Defer** — larger changes that expand PR scope → create an Issue in the project's Issue tracker

**In unattended mode:** auto-triage using severity from the [review rubric](../forge-reflect/references/review-rubric.md):

- **P0–P1** → fix now, commit
- **P2–P3** → defer, create an Issue in the project's Issue tracker

For both modes, deferred items become Issues:
- **GitHub**: `gh issue create --title "<title>" --body "<context and proposed solution>"`
- **Markdown**: create a new issue file per the [plan-folder-spec](../forge-create-issue/references/plan-folder-spec.md) and commit it
- **Other provider**: use the tool declared in AGENTS.md

### Step 5: Summary

Report implementation and review results together.

## Output Format

```text
## Ship Summary

**PR:** #<number> — <title>
**Branch:** <branch-name>

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Docs: <updated/none>

### Review Findings
- Fixed in PR: <list or "none">
- Deferred: #<issue> — <title> (or "none")

### Quality Gates
- Lint: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗
```

## Guidelines

- **Implementation runs inline** — user interaction for plan approval is preserved (unless `--unattended`)
- **Review runs in fresh context** — four reviewer sub-agents each cover one dimension without implementation memory
- **Don't skip the review** — even if implementation felt clean, review catches blind spots
- **Triage with the user** — don't auto-fix findings without asking (unless `--unattended`, which uses severity-based auto-triage)
- **Graceful degradation** — the `subagent` tool is provided by external extensions; the skill works without it via inline fallback, but fresh-context review requires sub-agent support
- **Unattended = severity-gated** — P0–P1 findings are always fixed; P2–P3 are always deferred. The review itself is never skipped.

## Related Skills

**Components:** Composes `forge-implement` and `forge-reflect`.
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal and prefer existing UI patterns
/forge-ship https://github.com/owner/repo/issues/42
/forge-ship docs/roadmap.md
/forge-ship add a dark mode toggle to the settings page
/forge-ship --unattended 42
/forge-ship --unattended 42 -- keep the diff minimal
```
