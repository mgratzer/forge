---
name: forge-implement-issue
description: Implement a feature or fix based on a GitHub issue, following project standards. Use when the user wants to start working on a GitHub issue, implement a feature, fix a bug, or begin coding from an issue number or URL.
disable-model-invocation: true
---

# Implement GitHub Issue

Implement a feature or fix based on a GitHub issue, following project standards.

## Input

Primary input: the issue number or URL.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` as one of:
- `<issue-number>`
- `<issue-url>`
- `<issue-number> -- <additional context>`
- `<issue-url> -- <additional context>`

Use any additional context as execution guidance while still following the issue requirements.

## Process

### Step 1: Understand the Issue

```bash
gh issue view <ISSUE_NUMBER> --json number,title,body,labels,assignees,milestone,state,comments
```

Parse: title, requirements, acceptance criteria, labels, sub-issues, comments, and linked work.

Flag for user input if: vague acceptance criteria, `discovery` label, unanswered questions, scope too large, or dependencies incomplete.

If labels are missing, add appropriate ones with `gh issue edit`.

### Step 2: Plan Approach

Identify **durable architectural decisions** — choices that apply across the entire issue:
- Data model or schema shape
- API contracts or route structures
- Key abstractions or module boundaries

**For complex work** (multiple components, cross-cutting changes, or unclear integration points), delegate codebase research to a sub-agent for unbiased findings:

Write 3–7 targeted questions about how the relevant systems work today, what patterns exist, and where the integration points are. **Questions must request facts, not opinions.**

#### Research (delegate)

Delegate to a sub-agent that receives only the questions — not the issue title or body. If the runtime does not support sub-agents, answer each question yourself with facts only.

> You are researching a codebase to answer specific questions. You have no knowledge of what is being built or why.
>
> For each question:
> 1. Search the codebase thoroughly (grep, glob, read files)
> 2. Trace relevant code paths end to end
> 3. Report findings with file paths and function names
>
> **Rules:**
> - Only report what is true about the current code
> - Do not suggest improvements or implementations
> - Note any inconsistencies or competing patterns you discover

**Inputs provided to sub-agent:**
- The research questions (not the issue)
- Access to the full codebase via Read, Grep, Glob, Bash

**Expected output:** One factual answer per question, with file paths and code references.

From the research (or your own codebase exploration for straightforward issues), create a plan:
- Durable decisions
- **Structure outline** — order work as vertical phases; each phase is a thin end-to-end slice across all affected layers with a verification step
- Files to create or modify
- Scope boundaries (what will NOT change)

Fold any optional additional context from `$ARGUMENTS` into the plan. If the issue includes Implementation Constraints (from `forge-create-issue`), follow those guardrails.

Present the plan via AskUserQuestion. Get user confirmation before coding.

### Step 3: Create Feature Branch

```bash
git fetch origin
git checkout $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git pull
git checkout -b <type>/<issue-number>-<brief-description>
```

### Step 4: Implement

Read AGENTS.md first. Follow project conventions strictly.

**Pre-flight checks** — before writing feature code:
- Run code generators (if the project uses them) and verify generated artifacts are current
- Grep for where config is consumed before placing new config values
- Verify external services and APIs are accessible
- Confirm required environment variables, secrets, and credentials are available

**Follow the structure outline from Step 2.** Each phase is a vertical slice — implement it end to end and verify before starting the next phase. Use TodoWrite to track progress through phases.

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

### Step 5: Pattern Consistency Audit

If you changed a pattern (error handling, component structure, API convention), search for ALL files using that pattern and update them too:

```bash
grep -rn "<pattern>" <search-root>/
```

### Step 6: Update Documentation

If behavior changed, update:
- `docs/*.md` — architecture, API, development guides
- `AGENTS.md` — if conventions or patterns changed
- Code comments — only where logic isn't self-evident

### Step 7: Quality Gates

Run all project quality checks (discover from AGENTS.md, project docs, or repository scripts): lint, format, type check, tests. Run coverage for substantial changes when the project supports it. Fix issues and commit fixes.

### Step 8: Push and Create PR

```bash
git push -u origin <branch-name>
```

Create PR with conventional commit title format. Include: summary closing the issue, list of changes, test plan checklist, and quality checklist.

If the implementation requires manual deployment steps (env vars, infra changes, container/runtime config, migrations), add a prominent `> [!WARNING]` block at the top of the PR body.

### Step 9: Summary

Report: branch name, PR link, commits made, files changed, tests added, docs updated, follow-up items.

## Guidelines

- **Read AGENTS.md first** — understand project-specific requirements
- **Explore before coding** — research the codebase objectively before committing to an approach
- **Vertical phases** — implement each phase end to end and verify before moving on
- **Small commits** — one logical change each
- **Test as you go** — don't defer testing to the end
- **Ask when unsure** — better to clarify than implement wrong
- **Don't scope creep** — implement what the issue asks, nothing more

## Sub-Issue Handling

If the issue has sub-issues, treat each as a separate task. Close sub-issues as you complete them — GitHub automatically updates parent progress.

## Related Skills

**After implementing:** Use `forge-reflect-pr` to self-review before requesting review.

## Example Usage

```
/forge-implement-issue 123
/forge-implement-issue 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement-issue https://github.com/owner/repo/issues/123
```
