---
name: forge-brainstorm
description: Explore a vague idea through codebase investigation, structured questioning, and approach comparison to produce a clear plan ready for issue creation. Use when the user has a rough idea or problem but hasn't decided on an approach yet.
disable-model-invocation: true
allowed-tools: Read, Bash, Grep, Glob, WebSearch, AskUserQuestion
---

# Brainstorm Ideas

Explore a problem space and converge on a plan before creating issues.

## Input

The idea or problem to explore: $ARGUMENTS

Optional last parameter: `-- <additional context>`

If no argument is provided, ask the user what they'd like to explore.

## Process

### Step 1: Investigate Context

Before asking any questions, explore the codebase for related context:
- Find existing implementations, patterns, and constraints relevant to the idea
- Identify integration points, dependencies, and architectural boundaries
- Look for prior attempts or related work (git log, closed issues)

```bash
# Check for related issues
gh issue list --state all --search "<relevant keywords>"
```

### Step 2: Clarify the Problem

Use AskUserQuestion to understand the problem — not the solution:
- **What's happening now?** — current behavior, pain point, trigger
- **What should be different?** — desired outcome, who benefits
- **What's out of scope?** — boundaries, things to explicitly not solve

Ground questions in what you found in Step 1. Reference specific code or patterns you discovered.

**Stop after asking. Do not proceed until the user responds.**

### Step 3: Explore Approaches

Present **2-3 approaches** including a **minimal option** (smallest change that addresses the core problem).

For each approach:
- One-line summary
- How it works, referencing specific files and patterns from Step 1
- Tradeoffs (what you gain, what you give up)
- Relative complexity (Low / Medium / High)
- Risk factors

Let the user choose, combine, or reject all approaches.

### Step 4: Validate Design

Walk through the chosen approach **section by section**:
1. Present the first design decision. Wait for feedback.
2. Present the next decision, incorporating prior feedback. Wait again.
3. Continue until the approach is fully specified.

Do not present the entire design at once — incremental validation catches misalignment early.

### Step 5: Summarize Plan

Produce a structured summary using the output format below. This summary is the input for `forge-create-issue`.

## Output Format

```markdown
## Problem Statement
[1-2 sentences grounded in what was discussed]

## Chosen Approach
[Summary of the validated design]

## Scope Boundaries
- In scope: [what this covers]
- Out of scope: [what this explicitly does not cover]

## Suggested Issue Breakdown
- [ ] Issue 1: <type>(<scope>): <description>
- [ ] Issue 2: <type>(<scope>): <description>
```

## Guidelines

- **Stop after questions** — present questions, wait for the user to respond before continuing
- **Include a minimal option** — the smallest change that addresses the core problem
- **Problem over solution** — clarify what's wrong before proposing how to fix it
- **Stay grounded** — reference specific code, files, and patterns, not abstractions

## Related Skills

**Next step:** Use `forge-create-issue` to turn the plan into GitHub issues.

## Example Usage

```
/forge-brainstorm the app is slow on mobile
/forge-brainstorm we need better error handling
/forge-brainstorm the authentication flow -- we've had security concerns, focus there
```
