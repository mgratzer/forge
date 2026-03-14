---
name: forge-implement-issue
description: Implement a feature or fix based on a GitHub issue, following project standards. Use when the user wants to start working on a GitHub issue, implement a feature, fix a bug, or begin coding from an issue number or URL.
disable-model-invocation: true
---

# Implement GitHub Issue

Implement a feature or fix based on a GitHub issue, following project standards.

## Input

The issue number or URL: $ARGUMENTS

## Process

### Step 1: Understand the Issue

```bash
gh issue view <ISSUE_NUMBER> --json number,title,body,labels,assignees,milestone,state,comments
```

Parse: title, requirements, acceptance criteria, labels, sub-issues, comments, and linked work.

If labels are missing, add appropriate ones with `gh issue edit`.

### Step 2: Assess Readiness

Flag for user input if: vague acceptance criteria, `discovery` label, unanswered questions, scope too large, or dependencies incomplete.

### Step 3: Plan and Validate Approach

Create a task list with TodoWrite. Present the approach to the user:
- Files to create or modify
- Libraries, APIs, or services to use
- Where configuration changes live
- Key design decisions
- What will NOT change (scope boundaries)

If the issue includes Implementation Constraints (from `forge-create-issue`), follow those guardrails.

Get user confirmation via AskUserQuestion before coding.

### Step 4: Create Feature Branch

```bash
git fetch origin
git checkout $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git pull
git checkout -b <type>/<issue-number>-<brief-description>
```

### Step 5: Implement

Read AGENTS.md first. Follow project conventions strictly.

**Pre-flight checks** — before writing feature code:
- Run code generators (GraphQL codegen, OpenAPI, protobuf) and verify types exist
- Grep for where config is consumed before placing new config values
- Verify external services and APIs are accessible
- Confirm new environment variables are set

**As you code:**
- Follow project lint/format/type conventions
- Check for duplication — extract shared logic
- Keep functions focused — split if growing too large
- Look for existing patterns before writing new code
- Run tests after each commit, not just at the end
- When writing tests, verify assertions match actual output immediately

**Commit granularly** after each logical unit of work:

```bash
git add <files>
git commit -m "<type>(<scope>): <description>

<body>

Refs #<ISSUE_NUMBER>"
```

### Step 6: Pattern Consistency Audit

If you changed a pattern (error handling, component structure, API convention), search for ALL files using that pattern and update them too:

```bash
grep -rn "<pattern>" src/
```

### Step 7: Update Documentation

If behavior changed, update:
- `docs/*.md` — architecture, API, development guides
- `CHANGELOG.md` — user-facing changes only, plain language, bold feature names
- `AGENTS.md` — if conventions or patterns changed
- Code comments — only where logic isn't self-evident

### Step 8: Quality Gates

Run all project quality checks (discover from AGENTS.md or package.json): lint, format, type check, tests. Run coverage for substantial changes. Fix issues and commit fixes.

### Step 9: Push and Create PR

```bash
git push -u origin <branch-name>
```

Create PR with conventional commit title format. Include: summary closing the issue, list of changes, test plan checklist, and quality checklist.

If the implementation requires manual deployment steps (env vars, infra changes, Docker config, migrations), add a prominent `> [!WARNING]` block at the top of the PR body.

### Step 10: Summary

Report: branch name, PR link, commits made, files changed, tests added, docs updated, follow-up items.

## Guidelines

- **Read AGENTS.md first** — understand project-specific requirements
- **Explore before coding** — understand existing patterns
- **Small commits** — one logical change each
- **Test as you go** — don't defer testing to the end
- **Ask when unsure** — better to clarify than implement wrong
- **Don't scope creep** — implement what the issue asks, nothing more
- **Keep TodoWrite in sync** with progress

## Sub-Issue Handling

If the issue has sub-issues, treat each as a separate TodoWrite task. Close sub-issues as you complete them — GitHub automatically updates parent progress.

## Related Skills

**After implementing:** Use `forge-reflect-pr` to self-review before requesting review.

## Example Usage

```
/forge-implement-issue 123
/forge-implement-issue https://github.com/owner/repo/issues/123
```
