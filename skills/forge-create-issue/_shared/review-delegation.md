# Review Delegation

How to set up, delegate, and aggregate a **lean fresh-context review**. Used by skills that need unbiased review (`forge-reflect`, `forge-ship`).

## Inputs Required

Before reviewing, collect:

1. **Review scope** — exact commands the reviewer can run to regenerate the diff and changed file list
2. **Changed file list** — from the selected scope
3. **Diff size metadata** — changed file count and approximate changed line count
4. **Relevant project conventions** — the parts of `AGENTS.md` that bear on the change, not the whole file
5. **Acceptance criteria** — verbatim from the Issue the change closes: the one this session implemented from, else the PR's (`gh pr view --json closingIssuesReferences`), fetched per [issue-operations](issue-operations.md); omit when no Issue is linked
6. **Change outline** — the `**Change outline**` block of the change's open PR, verbatim: the one this session wrote, else from `gh pr view --json body`; omit when no PR is open or the body has none
7. **Review materials** — read and collect (pushed, not referenced):
   - [forge-reviewer](roles/forge-reviewer.md) role
   - [review-dimensions](review-dimensions.md) — default checklist plus optional deep-pass checklists
   - [review-rubric](review-rubric.md) — P0–P3 severity taxonomy

## Choose Review Shape

Use the smallest review shape that still gives trustworthy signal:

1. **Tiny diff: inline review** — only if the change is small (roughly `<=2` files and `<=100` changed lines), touches none of the risky areas in item 3 nor infrastructure/config, **and the current session did not implement the changes** (a session reviewing its own diff has self-review bias, so it delegates even a tiny one). Review inline in the current context using the default combined checklist.
2. **Default: one reviewer** — for everything else, use one fresh-context reviewer running the combined checklist.
3. **Mandatory second reviewer for risky changes** — add a second focused pass whenever the diff touches:
   - auth, authorization, secrets, payments, or other security-sensitive code
   - schema or migration changes
   - concurrency, synchronization, background jobs, caches, or distributed behavior
   - public API, protocol, or contract changes
4. **Optional second reviewer for broad diffs** — add a second pass for large or cross-cutting diffs (roughly `>10` files or `>500` changed lines).

An inline review is a single pass. A second reviewer gets only the **highest-risk deep pass** from [review-dimensions](review-dimensions.md).

## Compose Review Tasks

Create **one self-contained review task per planned pass**, embedding the inputs above (the role, the rubric, and one checklist: the default combined pass or one deep pass), the branch / PR / uncommitted scope description, and any additional context from the caller. The Change outline goes in the default pass only.

Prefer **pull over push** for the diff: give a reviewer with shell access the exact `git diff` and `git diff --name-only` commands, and paste the full diff only when the runtime cannot access git state reliably.

Do not make a task depend on a runtime-specific agent name, preset, or config file.

## Execute Review

Report `reviewing` via [status-reporting](status-reporting.md), then use the chosen review shape:

1. **Inline tiny-diff path** — run one combined checklist pass in the current context
2. **Sub-agent tool or task runtime**: spawn **one** reviewer by default, and a second when the rules above require it, with the role in the delegated prompt or `systemPrompt`. Inherit the parent session's model and provider where the runtime allows; where it offers per-task model choice, prefer a cheaper review-capable model over the strongest implementation model.
3. **Inline fallback** — if no sub-agent mechanism is available, execute the same number of passes sequentially in the current context.

Wait for **all planned review passes** before proceeding.

## Aggregate Findings

1. Collect findings from all review passes
2. Deduplicate — if multiple passes flag the same issue, keep the highest severity
3. Group by file, then by severity (P0 → P1 → P2)
4. Drop P3 findings entirely (per the rubric)

Return the aggregated findings to the calling skill for triage.
