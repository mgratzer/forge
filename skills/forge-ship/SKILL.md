---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation — implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship a Change

Implement end to end — code it, review it, ship it. Implementation runs in the current session; tiny low-risk diffs review inline, otherwise review uses one fresh-context reviewer by default and deepens only when risk justifies it.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity.

## Process

### Step 1: Implement

#### 1a. Understand

Determine input type (Issue number/URL, plan file, or free-text). For Issues, fetch via the project's Issue tracker (see [issue-operations](../_shared/issue-operations.md)). Parse requirements and acceptance criteria. Flag if underspecified.

#### 1b. Plan (delegate)

For complex work, write 3–7 research questions and delegate to a sub-agent with the [forge-scout](../_shared/roles/forge-scout.md) role for unbiased codebase research. Prefer a cheap fast model for scout work. If the runtime does not support sub-agents, read the role file and answer the questions inline following its rules.

**Inputs provided to sub-agent:** Role: [forge-scout](../_shared/roles/forge-scout.md), the research questions, codebase access.
**Expected output:** One factual answer per question, with file paths and code references.

From the research, create a plan: durable decisions, vertical phases (see [vertical-slicing](../_shared/vertical-slicing.md)), files to change, scope boundaries.

Present the plan via AskUserQuestion. **In unattended mode:** skip approval and proceed.

#### 1c. Branch

```bash
# Sync the default branch, then branch off it
git fetch origin
git checkout $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git pull
git checkout -b <TYPE>/<ISSUE_NUMBER>-<BRIEF_DESCRIPTION>
```

When working from a plan file or free-text (no Issue number), use `<TYPE>/<BRIEF_DESCRIPTION>`.

#### 1d. Execute

Read AGENTS.md. Run pre-flight checks before the first phase (see [phase-execution](../_shared/phase-execution.md)). Implement in vertical phases — each phase spans all affected layers, includes tests, and ends with a commit. Run lint/types/tests at each phase gate.

After changing a pattern, grep for the old pattern across the appropriate scope and update all instances (see [pattern-audit](../_shared/pattern-audit.md)).

#### 1e. Update docs

Update `docs/*.md` and `AGENTS.md` if behavior or conventions changed.

#### 1f. Quality gate

- [ ] Lint — no violations
- [ ] Format — no violations
- [ ] Type check — no errors
- [ ] All tests pass
- [ ] Test coverage ≥ 90% for new/modified code — if coverage tooling is not configured, flag this to the user and offer to set it up

#### 1g. Push and create PR

```bash
git push -u origin <BRANCH_NAME>
gh pr create --title "<TYPE>(<SCOPE>): <DESCRIPTION>" --body "<PR_BODY>"
```

The PR title uses conventional commit format. Lead the summary with **why** the change was needed — pull the motivation from the linked Issue's problem statement; if no Issue is linked, derive it from the branch's commit history. Then briefly describe the approach taken. Include: changes list, test plan, quality checklist. Close the Issue when one exists. Add a `> [!WARNING]` block for manual deployment steps.

Do not produce the implementation summary yet — the review will inform the final report.

### Step 2: Review (delegate)

Follow the [review-delegation](../_shared/review-delegation.md) process: collect the diff from the implementation, prefer one inline review pass for tiny low-risk diffs, otherwise use one fresh-context review pass by default, add a second pass only when risk justifies it, and aggregate findings. Fresh context eliminates self-review bias when delegated review is used — reviewers have no memory of implementation decisions.

**Inputs provided to sub-agent:** the branch diff, changed file list, and project conventions per review-delegation.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

Use the aggregated findings from the review delegation.

**In attended mode (default):** present each finding to the user with a recommendation.

Bias hard toward **fix now**:
- **Fix now** — default for in-scope findings and small-to-moderate changes that still fit this PR → apply fix, commit
- **Defer** — only for larger changes that materially expand PR scope or are truly out of scope → create an Issue in the project's Issue tracker

**In unattended mode:** auto-triage using severity plus scope from the [review rubric](../_shared/review-rubric.md):

- **P0–P2, if in scope and reasonably sized** → fix now, commit
- **P1–P2, if truly out of scope or materially larger than the current PR** → defer, create an Issue in the project's Issue tracker
- **P3** → ignore

For both modes, deferred items become Issues — see [issue-operations](../_shared/issue-operations.md) for provider-specific mechanics.

### Step 4: Summarize

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
- Format: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗
- Coverage: ✓/✗/not configured
```

## Guidelines

- **Tiny low-risk diffs stay inline** — do not pay sub-agent overhead when the change is obviously small
- **Delegated review runs in fresh context** — reviewers have no implementation memory
- **Keep review lean** — one reviewer by default, second only when risk justifies it
- **Don't skip the review** — even if implementation felt clean
- **Bias toward fixing in the same PR** — unless a finding is truly larger or out of scope
- **Triage with the user** — unless `--unattended` (default to fixing in-scope findings)
- **Graceful degradation** — works inline if no sub-agent support

## Related Skills

**Components:** Composes `forge-implement` and `forge-reflect`.
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal
/forge-ship docs/roadmap.md
/forge-ship --unattended 42
```
