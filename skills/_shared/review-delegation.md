# Review Delegation

How to set up, delegate, and aggregate a **lean fresh-context review**. Used by skills that need unbiased review (`forge-reflect`, `forge-ship`).

## Inputs Required

1. **Review scope:** exact commands that regenerate the diff and the changed file list
2. **Diff size:** changed file count and approximate changed lines
3. **Project conventions:** the parts of `AGENTS.md` that matter for this diff, not the whole file. They bind the reviewer: a convention such as "no compatibility shims, this is a proof of concept" makes a new shim a finding
4. **The task**, when the caller has it: one sentence on what the change is for and what it is not building, from the plan or the Issue (forge-reflect can use the PR title and body)
5. **Review materials**, pushed into the task rather than referenced: the [forge-reviewer](roles/forge-reviewer.md) role, the [review-dimensions](review-dimensions.md) checklists, and the [review-rubric](review-rubric.md)

## Choose Review Shape

Use the smallest shape that still gives trustworthy signal:

1. **Tiny diff, inline review:** roughly `<=2` files and `<=100` changed lines, with none of the risky signals below, **and the current session did not write the changes**; a session reviewing its own diff has self-review bias. One combined checklist pass in the current context; escalate only if the diff stops being tiny or new risk appears.
2. **Default, one reviewer:** one fresh-context reviewer running the combined checklist.
3. **Mandatory second reviewer** whenever the diff touches:
   - auth, authorization, secrets, payments, or other security-sensitive code
   - schema or migration changes
   - concurrency, synchronization, background jobs, caches, or distributed behavior
   - public API, protocol, or contract changes
   When the caller also runs [quality-passes](quality-passes.md), the security pass owns the first bullet; the others still add a reviewer.
4. **Optional second reviewer** for large or cross-cutting diffs (roughly `>10` files or `>500` changed lines).

A second reviewer gets only the **highest-risk deep pass** from review-dimensions.

## Compose Review Tasks

One self-contained task per pass, embedding the inputs above with only the selected checklist, the scope description (branch, PR, or uncommitted), and any caller context. Give a reviewer with shell access the commands rather than a pasted diff. Never depend on a runtime-specific agent name, preset, or config file.

## Execute Review

Report `reviewing` via [status-reporting](status-reporting.md), then:

- **Sub-agents:** one reviewer per planned pass, with the role pushed into the prompt. Inherit the parent session's model; for routine review, try lower effort before a cheaper model
- **No sub-agent mechanism (or the tiny-diff path):** run the same passes sequentially in the current context

Wait for every planned pass, about 20 minutes each or the runtime's sub-agent timeout.

**When a reviewer fails** (it doesn't start, errors, returns nothing, or exceeds the bound), retry once with the same task. If the retry fails too, run that pass inline and say so: `review: self (reviewer failed)` in the summary and as a known limitation for the PR body drafter. Never fall back silently. A rejected per-task model or effort setting is retried once with the parent's settings, and is not a failed reviewer.

## Aggregate Findings

Collect findings from all passes, keep the highest severity of duplicates, group by file then severity (P0 → P1 → P2), drop P3, and return them to the caller for triage.
