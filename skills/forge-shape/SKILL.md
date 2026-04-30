---
name: forge-shape
description: Shape a vague idea into a clear plan through codebase investigation and convergent one-at-a-time questioning. Use when the user has a rough idea or problem that needs specifying before issue creation.
disable-model-invocation: true
allowed-tools: Read, Bash, Grep, Glob, WebSearch, AskUserQuestion
---

# Shape

Shape a problem and converge on a plan before creating issues.

## Input

The idea or problem to shape: $ARGUMENTS

Optional last parameter: `-- <additional context>`

If no argument is provided, ask the user what they'd like to shape.

## Process

### Step 1: Investigate Context

Before asking any questions, explore the codebase for related context:
- Find existing implementations, patterns, and constraints relevant to the idea
- Identify integration points, dependencies, and architectural boundaries
- Look for prior attempts or related work (git log, closed issues)

Check for related Issues in the project's Issue tracker:
- **GitHub**: `gh issue list --state all --search "<relevant keywords>"`
- **Markdown**: grep `plan/INDEX.md` and `plan/issues/` for relevant keywords
- **Other provider**: use the tool declared in AGENTS.md

### Step 2: Shape the Problem

Converge on a shared design concept through one-at-a-time structured questioning. See [shaping-methodology.md](references/shaping-methodology.md) for why one-at-a-time beats batching, how to provide recommended answers without over-anchoring, walking the dependency tree of decisions, and when to stop.

Loop until the design concept is clear:

1. Ground the next question in Step 1 findings — never ask what the codebase already answers
2. Ask one question with your recommended answer (phrase as "I'd suggest X because Y", not as a decision)
3. Wait for the user's response
4. Adjust your understanding and pick the next question

Stop when the user has accepted recommended answers for several consecutive questions, the remaining questions are taste-level (not decision-level), or the shared design concept is clear enough to summarize.

**Use AskUserQuestion** for each individual question. Do not bundle multiple questions into one prompt — that defeats the methodology.

### Step 3: Explore Approaches (delegate, optional)

If shaping in Step 2 surfaced a clear approach, skip this step and go to Step 4.

If multiple plausible approaches remain after shaping (e.g., the design concept allows for several architectural shapes), delegate approach generation to 2-3 parallel sub-agents, each given a radically different design constraint. The value is in **contrast** — approaches must be structurally different, not variations on the same idea. If the runtime does not support sub-agents, generate the approaches sequentially yourself, deliberately adopting a different constraint lens for each.

Assign each sub-agent one constraint lens (adapt to the problem):
- **Minimal** — smallest change that addresses the core problem
- **Reuse-first** — maximize use of existing patterns and code
- **Extensibility-first** — optimize for future flexibility
- **Performance-first** — optimize for speed or resource efficiency

**Sub-agent instructions:**

> You are designing one approach to a problem, constrained by a specific design lens. Follow your assigned constraint strictly — do not hedge toward a balanced middle ground.
>
> Given the codebase findings and shaped design concept provided as input, propose one approach:
> - One-line summary
> - How it works, referencing specific files and patterns
> - Tradeoffs (what you gain, what you give up)
> - Relative complexity (Low / Medium / High)
> - Risk factors

**Inputs provided to each sub-agent:**
- Codebase findings from Step 1
- Shaped design concept from Step 2
- The specific constraint lens to apply

**Expected output:** One approach per sub-agent, formatted as above.

Always include a **minimal option**. Present the contrasting approaches and let the user choose, combine, or reject all of them.

### Step 4: Summarize Plan

Produce a structured summary using the output format below. This summary is the input for `forge-create-issue`.

The summary is *evidence* of alignment, not the alignment itself. If the user reads the summary and finds nothing surprising, the shaping worked.

## Output Format

```markdown
## Problem Statement
[1-2 sentences grounded in what was discussed]

## Chosen Approach
[Summary of the shaped design concept]

## Scope Boundaries
- In scope: [what this covers]
- Out of scope: [what this explicitly does not cover]

## Suggested Issue Breakdown
- [ ] Issue 1: <type>(<scope>): <description>
- [ ] Issue 2: <type>(<scope>): <description>
```

## Guidelines

- **One question at a time** — convergence comes from depth per answer, not breadth per prompt
- **Always recommend an answer** — phrased as a recommendation, not a decision
- **Problem over solution** — clarify what's wrong before proposing how to fix it
- **Stay grounded** — reference specific code, files, and patterns, not abstractions
- **Approach exploration is conditional** — skip Step 3 when shaping already surfaced the approach

## Related Skills

**Next step:** Use `forge-create-issue` to turn the plan into Issues.

## Example Usage

```
/forge-shape the app is slow on mobile
/forge-shape we need better error handling
/forge-shape the authentication flow -- we've had security concerns, focus there
```
