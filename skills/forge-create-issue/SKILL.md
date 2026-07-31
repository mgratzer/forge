---
name: forge-create-issue
description: Collaboratively plan and create well-structured Issues through interactive discussion (GitHub, markdown plan/ folder, or other providers). Use when the user wants to create an Issue, report a bug, or scope out work that is already understood — use forge-shape first when the idea is still vague.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, WebSearch, AskUserQuestion
---

# Create Issue

Collaboratively plan and create well-structured Issues through interactive discussion. The Issue is created in the project's Issue tracker — see [issue-operations](../_shared/issue-operations.md) for provider detection.

## Input

The Issue idea or problem description: $ARGUMENTS

Optional: `-- <additional context>` for execution guidance.

If no argument is provided, ask the user what they'd like to create an Issue for.

## Process

### Step 1: Understand and Clarify

Parse the user's input, then use AskUserQuestion to gather:
- **Problem context** — what triggered this, who's affected, current vs desired behavior
- **Success criteria** — how will we know this is done
- **Constraints** — technical limitations, dependencies

### Step 2: Research the Codebase

Before proposing solutions, explore relevant code:
- Find related existing implementations and patterns
- Identify integration points and potential reuse
- Look for similar past implementations

Verify external dependencies are accessible if relevant — flag broken ones before proceeding.

### Step 3: Present Alternative Approaches

**Skip this step** if the input already contains a chosen approach with rationale — the decision was already made through deliberate analysis. Proceed directly to Step 4.

Otherwise, **always present 2-4 different approaches.** Never jump to a single solution.

For each approach:
- One-line summary
- How it works (brief)
- Pros and cons
- Relative complexity (Low / Medium / High)
- Key files affected

Let the user choose or combine approaches via AskUserQuestion.

### Step 4: Assess Scope

Evaluate if this should be one Issue or multiple.

**Split when:** distinct deliverables, different codebase areas, parallelizable work, or effort exceeds 1-2 days.

**Keep together when:** tightly coupled changes or splitting adds coordination overhead.

When splitting, slice **vertically** — each Issue is a thin end-to-end path (see [vertical-slicing](../_shared/vertical-slicing.md)). Classify each as **AFK** or **HITL** (see [afk-vs-hitl.md](references/afk-vs-hitl.md)). Order by dependency.

If splitting makes sense, offer: single Issue, multiple linked Issues, or epic with sub-issues.

### Step 5: Draft the Issue

**Title:** Use conventional commit format — `<type>(<scope>): <description>`

**Labels:** Discover what labels exist before applying any — see [issue-operations](../_shared/issue-operations.md). Apply at least one type label and relevant area labels.

**Body structure:**

```markdown
## Summary
[1-2 sentences]

**Execution mode:** [AFK | HITL] <!-- markdown provider: use the `mode` frontmatter field instead -->

## Problem / Motivation
[Why this needs to exist]

## Proposed Solution
[Chosen approach with implementation details]

### Alternatives Considered
[Other approaches and why they weren't chosen]

### Implementation Constraints
[When applicable: preferred libraries, config locations, patterns to follow, external dependencies]

## Acceptance Criteria
- [ ] [Specific, testable criteria]
- [ ] Tests added/updated
- [ ] Documentation updated (if applicable)
```

### Step 6: Review and Create

Present the draft to the user and iterate until satisfied (use AskUserQuestion for approve/revise decisions). Then create the Issue using the project's Issue tracker — see [issue-operations](../_shared/issue-operations.md) for provider-specific mechanics, including epics with sub-issues.

Share the Issue reference. Suggest using `forge-implement` to start implementation.

## Guidelines

- **Be curious** — challenge assumptions, ask "why" and "what if"
- **Don't over-specify** — leave room for implementer judgment
- **No time estimates**

## Related Skills

**Next step:** Use `forge-implement` to implement the Issue.

## Example Usage

```
/forge-create-issue add dark mode support
/forge-create-issue add dark mode support -- keep it to a single Issue
/forge-create-issue
```
