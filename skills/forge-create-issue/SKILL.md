---
name: forge-create-issue
description: Collaboratively plan and create well-structured GitHub issues through interactive discussion. Use when the user wants to create a GitHub issue, plan a feature, report a bug, or scope out work for implementation.
disable-model-invocation: true
allowed-tools: Read, Bash, Grep, Glob, WebSearch
---

# Create GitHub Issue

Collaboratively plan and create well-structured GitHub issues through interactive discussion.

## Input

The issue idea or problem description: $ARGUMENTS

If no argument is provided, ask the user what they'd like to create an issue for.

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

**Always present 2-4 different approaches.** Never jump to a single solution.

For each approach:
- One-line summary
- How it works (brief)
- Pros and cons
- Relative complexity (Low / Medium / High)
- Key files affected

Let the user choose or combine approaches.

### Step 4: Assess Scope

Evaluate if this should be one issue or multiple.

**Split when:** distinct deliverables, different codebase areas, parallelizable work, or effort exceeds 1-2 days.

**Keep together when:** tightly coupled changes or splitting adds coordination overhead.

**When splitting, use vertical slices** — each issue should be a thin end-to-end path across all affected layers (data, logic, UI, tests), not a horizontal layer slice. Each slice must be independently verifiable.

Classify each issue:
- **AFK** (Away From Keyboard) — can be implemented by an agent without human intervention
- **HITL** (Human In The Loop) — requires architectural decisions, design review, or external input

Order issues by dependency — earlier slices unblock later ones.

If splitting makes sense, offer: single issue, multiple linked issues, or epic with sub-issues.

### Step 5: Draft the Issue

**Title:** Use conventional commit format — `<type>(<scope>): <description>`

**Labels:** Discover available labels with `gh label list`. Apply at least one type label and relevant area labels.

**Body structure:**

```markdown
## Summary
[1-2 sentences]

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

Present the draft to the user. Iterate until satisfied. Then create:

```bash
gh issue create \
  --title "<type>(<scope>): <description>" \
  --body "$(cat <<'EOF'
<issue body>
EOF
)" \
  --label "<labels>"
```

For epics, create the parent issue first, then sub-issues with `--parent <PARENT_NUMBER>`.

Share the issue URL. Suggest using `forge-design-issue` to align on approach before coding — or `forge-implement-issue` directly for straightforward issues.

## Guidelines

- **Be curious** — challenge assumptions, ask "why" and "what if"
- **Explore first** — always research the codebase before proposing solutions
- **Never skip alternatives** — even if one approach seems obvious
- **Don't over-specify** — leave room for implementer judgment
- **No time estimates**

## Related Skills

**Next step:** Use `forge-design-issue` to align on approach before coding — or `forge-implement-issue` directly for straightforward issues.

## Example Usage

```
/forge-create-issue add dark mode support
/forge-create-issue
```
