---
name: forge-implement
description: Implement a feature or fix from an Issue, plan file, or free-text description, following project standards. Use when the user wants to start working on an Issue, implement a feature, or fix a bug; stops after opening a draft PR (use forge-ship to also run review).
disable-model-invocation: true
---

# Implement a Change

Implement a feature or fix following project standards.

## Input

Primary input (`$ARGUMENTS`): an Issue number/URL, a plan file path, or free-text description. Optional: `-- <additional context>` for execution guidance.

**Unattended mode:** `--unattended` skips plan approval and proceeds without confirmation prompts.

**Local mode:** `--local`, or `Publish: local` in the Shipping settings, stops after Step 7 and **Link PR**'s first half and reports `ready-for-local-review`; `forge-ship --publish` later reviews and publishes.

## Process

### Step 1: Understand the Work

Report `implementing` via [status-reporting](_shared/status-reporting.md). Read AGENTS.md if the runtime hasn't loaded it; its conventions shape the plan. Detect the Issue tracker (see [issue-operations](_shared/issue-operations.md)).

- **Issue:** fetch it with title, requirements, acceptance criteria, labels, sub-issues, and comments; add missing labels. Each sub-issue is a separate task, referenced in the PR so the merge closes it.
- **Plan file or free-text:** extract goals, requirements, constraints, and acceptance criteria.

Ask when requirements are too vague to plan. In unattended mode, proceed on stated assumptions, handed to the PR body drafter as known limitations, unless the ambiguity would change what the Issue asks for: then stop with `needs-human`.

### Step 2: Plan Approach

Identify **durable architectural decisions**: data model, API contracts, and module boundaries that absorb change instead of exposing internals (see [deep-modules](_shared/deep-modules.md)).

#### Research (delegate)

For complex work, write 3–7 factual questions about existing systems, patterns, and integration points, and delegate them to a [forge-scout](_shared/roles/forge-scout.md) sub-agent that receives only the questions, not the Issue (at lower effort when the runtime allows). Without sub-agents, answer them yourself by the role's rules.

**Inputs provided to sub-agent:** Role: [forge-scout](_shared/roles/forge-scout.md), the research questions, codebase access.
**Expected output:** One factual answer per question, with file paths and code references.

From the research, create a plan:
- The task in one sentence, checked against the Issue's wording
- Durable decisions
- **Structure outline:** vertical phases, each spanning the layers it needs and ending with a verification step. Phase 1 proves the happy path end to end; later phases add one axis of complexity at a time
- Files to create or modify
- Scope boundaries: what will not change, and what we are not building
- Expected diff size. Past roughly 600 changed lines (the **split size**), an attended plan proposes stacked branches, one per group of phases, each cut from the previous one; an unattended plan stays on one branch and names the size as a known limitation

Present the plan via AskUserQuestion and get confirmation before coding. **In unattended mode:** proceed.

### Step 3: Create Feature Branch

```bash
git fetch origin
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git rev-list --count origin/$DEFAULT_BRANCH..HEAD   # 0 on a non-default branch → a worktree tool prepared it; stay on it
```

Otherwise branch off it without switching to it, which also works inside a worktree:

```bash
git checkout --no-track -b <TYPE>/<ISSUE_NUMBER>-<BRIEF_DESCRIPTION> origin/$DEFAULT_BRANCH
```

Use the tracker's identifier verbatim when it isn't a GitHub number (`feat/ABC-60-note-summary`); without an Issue, `<TYPE>/<BRIEF_DESCRIPTION>`.

### Step 4: Implement

Execute the phases following [phase-execution](_shared/phase-execution.md): pre-flight before the first phase, code and tests together, and a phase gate before the next.

### Step 5: Audit Pattern Consistency

If you changed a pattern (error handling, component structure, API convention), update every other place using its old *shape*, not just a literal string. See [pattern-audit](_shared/pattern-audit.md).

### Step 6: Update Documentation

Update `docs/*.md` and `AGENTS.md` if behavior or conventions changed.

### Step 7: Run Final Quality Gate

Run every project check, discovered from AGENTS.md, docs, repository scripts, and the CI workflow files (a codegen or coverage check only CI enforces is a gate here too): lint, format, and type check pass; generated code is current; all tests pass, with failures handled per *When Tests Fail* in [phase-execution](_shared/phase-execution.md); new or modified code has at least 90% coverage, or CI's stricter threshold. Without coverage tooling, say so and offer to set it up. Fix issues and commit.

### Step 8: Push and Create PR

```bash
git push -u origin <BRANCH_NAME>
```

#### Draft the Body (delegate)

Delegate the body to a sub-agent that never saw the work, per [pr-body](_shared/pr-body.md): a session that did the work narrates the journey instead of the change. Without sub-agents, draft it from the same inputs only, re-reading the diff.

**Inputs provided to sub-agent:** the drafter inputs listed in pr-body.
**Expected output:** the finished body.

Create the PR with a conventional commit title and the PR settings ([project-config](_shared/project-config.md)), passing the body through a quoted heredoc; an inline `--body "..."` mangles multi-line text, backticks, and quotes. Then run the `After create` skill when one is declared.

```bash
gh pr create --draft --title "<TYPE>(<SCOPE>): <DESCRIPTION>" [--assignee <ASSIGNEE>] [--label <LABELS>] --body-file - <<'PR_EOF'   # drop --draft for `Pull requests: ready`
<PR body>
PR_EOF
```

When the work comes from an Issue, follow **Link PR** in [issue-operations](_shared/issue-operations.md): its first half before the push (closing references for the drafter, the markdown provider's closing commit), its second half and **Mark in Review** once the PR is open. Never mark the Issue done; completion belongs to the merge.

### Step 9: Summarize

Report: branch, PR link, commits, files changed, tests added, docs updated, deferred items, the `After create` result, and any labels left out.

## Guidelines

- **Explore before coding:** research the codebase before committing to an approach
- **Ask when unsure:** better to clarify than implement wrong; unattended runs state their assumptions and proceed
- **Don't scope creep:** implement what was asked, nothing more

## Related Skills

**After implementing:** Use `forge-reflect` to self-review before requesting review.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-implement 123
/forge-implement 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement --unattended 123
/forge-implement docs/roadmap.md
/forge-implement add a dark mode toggle to the settings page
```
