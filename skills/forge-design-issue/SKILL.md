---
name: forge-design-issue
description: Design the implementation approach for a GitHub issue through objective codebase research, a design discussion, and a structure outline with vertical phases. Use when the user wants to align on architecture and approach before writing code.
disable-model-invocation: true
---

# Design Issue Implementation

Produce a design discussion and structure outline for a GitHub issue before implementation begins.

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

### Step 1: Parse the Issue

```bash
gh issue view <ISSUE_NUMBER> --json number,title,body,labels,assignees,milestone,state,comments
```

Extract: title, requirements, acceptance criteria, labels, constraints, and any prior discussion.

### Step 2: Generate Research Questions

From the issue, write 3-7 targeted questions about the codebase that an engineer would need answered before designing a solution. Focus on:

- How do the relevant systems work today? (trace existing code paths)
- What patterns and conventions exist in the affected areas?
- What are the integration points and boundaries?
- What prior work or related implementations exist?

**Do not include implementation opinions or solution direction in the questions.** Each question should request objective facts about the current codebase.

### Step 3: Research the Codebase (delegate)

**Delegate this step to a sub-agent.** The sub-agent receives only the research questions from Step 2 — not the issue title, body, or any knowledge of what is being built. This separation keeps the research objective. If the runtime does not support sub-agents, execute the research yourself but deliberately answer each question with facts only, not suggestions.

**Sub-agent instructions:**

> You are researching a codebase to answer specific questions. You have no knowledge of what is being built or why these questions are being asked. Your job is to find objective facts.
>
> For each question:
> 1. Search the codebase thoroughly (grep, glob, read files)
> 2. Trace relevant code paths end to end
> 3. Report what you find — how the code works today, what patterns are used, where the boundaries are
>
> **Rules:**
> - Only report what is true about the current code
> - Do not suggest improvements or implementations
> - Do not speculate about intent or future direction
> - Include file paths and function names for every finding
> - Note any inconsistencies or competing patterns you discover

**Inputs provided to sub-agent:**
- The research questions from Step 2
- Access to the full codebase via Read, Grep, Glob, Bash

**Expected output:** One factual answer per question, with file paths and code references.

### Step 4: Draft Design Discussion

Combine the issue requirements (Step 1) with the objective research findings (Step 3) to draft a design discussion. Target **~150-200 lines of markdown**.

Structure:

```markdown
## Current State
[How the relevant systems work today, based on research findings.
Include file paths and patterns discovered.]

## Desired End State
[What the system should look like after implementation.
Derived from the issue requirements.]

## Patterns to Follow
[Existing patterns the implementation should use.
Flag any competing patterns found in the research — the user must choose.]

## Key Design Decisions
[Decisions that need to be made before implementation.
For each: state the options, your recommendation, and why.]

## Open Questions
[Anything the research couldn't answer or that requires human judgment.]
```

### Step 5: Align with User

Present the design discussion to the user via AskUserQuestion. Walk through it section by section:

1. **Current State** — confirm the research findings are accurate
2. **Patterns to Follow** — resolve any competing patterns
3. **Key Design Decisions** — get a decision on each open item
4. **Open Questions** — answer or defer each one

Update the design discussion with resolved decisions. **Do not proceed until the user approves the design.**

### Step 6: Create Structure Outline

From the approved design, create a structure outline: the high-level phases of implementation, ordered as **vertical slices**.

Each phase should be a thin end-to-end path through all affected layers (data, logic, API, UI, tests) — not a horizontal layer-by-layer plan. Each phase must produce something verifiable.

Structure:

```markdown
## Structure Outline

### Phase 1: <name>
- What: [summary of the vertical slice]
- Files: [key files created or modified]
- Verify: [how to confirm this phase works]

### Phase 2: <name>
...

### Phase N: <name>
- What: [final integration or cleanup]
- Files: [remaining files]
- Verify: [end-to-end verification step]
```

Present the outline to the user. Adjust phase order or granularity based on feedback.

### Step 7: Publish

Post the approved design discussion and structure outline as a comment on the GitHub issue. If a previous design comment exists on the issue, edit it rather than posting a duplicate.

```bash
gh issue comment <ISSUE_NUMBER> --body "$(cat <<'EOF'
# Design Discussion

<design discussion content>

# Structure Outline

<structure outline content>
EOF
)"
```

Suggest using `forge-implement-issue` to start implementation.

## Guidelines

- **Research must stay objective** — the sub-agent never sees the ticket
- **Design before code** — catch wrong patterns in a 200-line doc, not in 1,000 lines of code
- **Vertical phases** — every phase is a testable end-to-end slice, never a horizontal layer
- **Resolve decisions explicitly** — no unresolved items should carry forward to implementation
- **Short enough to review** — if the design exceeds 200 lines, compress or move detail to the outline

## Related Skills

**Before design:** Use `forge-create-issue` to scope the work and create the issue.
**After design:** Use `forge-implement-issue` to execute the approved design.

## Example Usage

```
/forge-design-issue 42
/forge-design-issue 42 -- focus on the API layer, we're not changing the database schema
/forge-design-issue https://github.com/owner/repo/issues/42
```
