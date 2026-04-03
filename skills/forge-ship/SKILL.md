---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation. Implements from a GitHub issue, plan file, or free-text description, then delegates review to a fresh-context sub-agent. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship

Implement end to end — code it, review it, ship it. Implementation runs in the current session; review is delegated to a sub-agent with fresh context for unbiased findings.

## Input

Primary input: a GitHub issue, a plan file, or a free-text description.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` the same way as [forge-implement](../forge-implement/SKILL.md):
- `<issue-number>` — GitHub issue
- `<issue-url>` — GitHub issue URL
- `<file-path>` — path to a plan, roadmap, or spec file
- `<free-text>` — inline description of what to build
- Any of the above followed by `-- <additional context>`

## Process

### Step 1: Implement

Read [forge-implement](../forge-implement/SKILL.md) and execute its Steps 1 through 8 (Understand → Plan → Branch → Implement → Pattern Audit → Docs → Quality Gates → Push & Create PR).

Do not produce the implementation summary yet — the review will inform the final report.

### Step 2: Prepare Review Context

Collect the materials the reviewer needs:

```bash
git fetch origin
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git diff origin/$DEFAULT_BRANCH...HEAD
git diff --name-only origin/$DEFAULT_BRANCH...HEAD
```

Read [forge-reflect](../forge-reflect/SKILL.md) to obtain the four review dimensions and their checklists (Correctness & Patterns, Security, Code Reuse & Quality, Efficiency & Tests & Docs).

Compose a **self-contained review task** that includes:
- The review process and four-dimension checklists from forge-reflect (Step 2)
- The [review rubric](../forge-reflect/references/review-rubric.md) for severity calibration
- The project's `AGENTS.md` content
- The full diff and changed file list
- Branch name and PR number
- Any additional context from the user's `$ARGUMENTS`

### Step 3: Review (delegate)

**Delegate to a sub-agent for review.** Fresh context eliminates self-review bias — the reviewer has no memory of implementation decisions.

Use the first available delegation mechanism:

1. **`subagent` tool** (e.g., Pi with [pi-interactive-subagents](https://github.com/HazAT/pi-interactive-subagents)): spawn with `agent: "reviewer"` and the composed review task. The sub-agent runs autonomously in a separate session with fresh context.
2. **Runtime context forking** (e.g., Claude Code Task tool): delegate with fresh context.
3. **Inline fallback**: if no sub-agent mechanism is available, read the [reviewer role](../forge-reflect/roles/reviewer.md) and execute the four review dimensions sequentially in the current context.

Wait for the review results before proceeding.

### Step 4: Triage Findings

Aggregate and deduplicate review findings. Present each to the user with a recommendation:

- **Fix now** — small, low-effort changes that fit in this PR → apply fix, commit
- **Defer** — larger changes that expand PR scope → create a GitHub issue:
  ```bash
  gh issue create --title "<title>" --body "<context and proposed solution>"
  ```

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

- **Implementation runs inline** — user interaction for plan approval is preserved
- **Review runs in fresh context** — sub-agent has no memory of implementation decisions
- **Don't skip the review** — even if implementation felt clean, review catches blind spots
- **Triage with the user** — don't auto-fix findings without asking
- **Graceful degradation** — the `subagent` tool is provided by external extensions; the skill works without it via inline fallback, but fresh-context review requires sub-agent support

## Related Skills

**Components:** Composes [forge-implement](../forge-implement/SKILL.md) and [forge-reflect](../forge-reflect/SKILL.md).
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal and prefer existing UI patterns
/forge-ship https://github.com/owner/repo/issues/42
/forge-ship docs/roadmap.md
/forge-ship add a dark mode toggle to the settings page
```
