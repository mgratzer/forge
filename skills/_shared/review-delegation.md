# Review Delegation

How to set up, delegate, and aggregate the four-agent parallel review. Used by skills that need fresh-context code review (forge-reflect, forge-ship).

## Inputs Required

Before delegating, collect:

1. **Full diff** — `git diff origin/$DEFAULT_BRANCH...HEAD` (or `git diff HEAD` for uncommitted changes)
2. **Changed file list** — `git diff --name-only ...` (same scope as the diff)
3. **Project conventions** — read `AGENTS.md`
4. **Review materials** — read and collect (pushed, not referenced):
   - [forge-reviewer](roles/forge-reviewer.md) role
   - [review-dimensions](review-dimensions.md) — four quality dimension checklists
   - [review-rubric](review-rubric.md) — P0–P3 severity taxonomy

## Compose Review Tasks

Create **four self-contained review tasks** — one per dimension from [review-dimensions](review-dimensions.md). Each task embeds:

- Role definition (from forge-reviewer)
- One dimension checklist (Correctness, Security, Code Quality, or Efficiency/Tests/Docs)
- Review rubric
- `AGENTS.md` content
- Full diff and changed file list
- Branch/PR info and any additional context from the caller

Each task is fully self-contained — the reviewer reads nothing from disk except the codebase files it needs to verify findings.

## Delegate

Use the first available delegation mechanism:

1. **`subagent` tool** (e.g., Pi with [pi-interactive-subagents](https://github.com/HazAT/pi-interactive-subagents)): spawn four concurrent sub-agents with `agent: "forge-reviewer"`, one per dimension task.
2. **Runtime context forking** (e.g., Claude Code Task tool): delegate four fresh-context review tasks in parallel.
3. **Inline fallback**: if no sub-agent mechanism is available, execute the four review dimensions sequentially in the current context using the role and checklists.

Wait for **all four** review results before proceeding.

## Aggregate Findings

1. Collect findings from all four review agents
2. Deduplicate — if multiple agents flag the same issue, keep the highest severity
3. Group by file, then by severity (P0 → P1 → P2)
4. Drop P3 findings entirely (per the rubric)

Return the aggregated findings to the calling skill for triage.
