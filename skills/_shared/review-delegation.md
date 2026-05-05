# Review Delegation

How to set up, delegate, and aggregate a **lean fresh-context review**. Used by skills that need unbiased review (`forge-reflect`, `forge-ship`).

## Inputs Required

Before reviewing, collect:

1. **Review scope** — exact commands the reviewer can run to regenerate the diff and changed file list
2. **Changed file list** — from the selected scope
3. **Diff size metadata** — changed file count and approximate changed line count
4. **Relevant project conventions** — the relevant parts of `AGENTS.md`; do not blindly paste the whole file if only a small subset matters
5. **Review materials** — read and collect (pushed, not referenced):
   - [forge-reviewer](roles/forge-reviewer.md) role
   - [review-dimensions](review-dimensions.md) — default checklist plus optional deep-pass checklists
   - [review-rubric](review-rubric.md) — P0–P3 severity taxonomy

## Choose Review Shape

Use the smallest review shape that still gives trustworthy signal:

1. **Tiny diff: inline review** — only if the change is small and low-risk (roughly `<=2` files and `<=100` changed lines), with **no** risky signals such as auth/authz, secrets, payments, migrations, concurrency, jobs, caches, public API/protocol changes, or infrastructure/config changes. Review inline in the current context using the default combined checklist.
2. **Default: one reviewer** — for everything else, use one fresh-context reviewer running the combined checklist.
3. **Mandatory second reviewer for risky changes** — add a second focused pass whenever the diff touches:
   - auth, authorization, secrets, payments, or other security-sensitive code
   - schema or migration changes
   - concurrency, synchronization, background jobs, caches, or distributed behavior
   - public API, protocol, or contract changes
4. **Optional second reviewer for broad diffs** — add a second pass for large or cross-cutting diffs (roughly `>10` files or `>500` changed lines).

When using inline review, keep it to a single pass — do not escalate to sub-agents unless the diff is no longer tiny or new risk appears.

When adding a second reviewer, assign it only the **highest-risk deep pass** from [review-dimensions](review-dimensions.md) — do not split the same diff into many overlapping reviewers.

## Compose Review Tasks

Create **one self-contained review task per planned pass**. Each task embeds:

- Role definition (from forge-reviewer)
- The selected checklist (default combined pass or one optional deep pass)
- Review rubric
- Relevant project conventions from `AGENTS.md`
- Review scope metadata:
  - exact `git diff` command
  - exact `git diff --name-only` command
  - branch / PR / uncommitted scope description
- Changed file list
- Any additional context from the caller

Prefer **pull over push** for bulky review inputs:

- If the reviewer has shell access in the repo, give it the exact commands to regenerate the diff instead of pasting a huge diff into the prompt
- Only push the full diff when the runtime cannot access git state reliably

Each task is fully self-contained. Do not make the task depend on a runtime-specific agent name, preset, or config file.

## Execute Review

Use the chosen review shape:

1. **Inline tiny-diff path** — run one combined checklist pass in the current context
2. **Sub-agent tool or task runtime**: spawn **one** reviewer by default, and a second reviewer when required by the rules above. Push the [forge-reviewer](roles/forge-reviewer.md) role into the delegated prompt or `systemPrompt`. Prefer inheriting the parent session's model/provider when the runtime supports that. If the runtime supports per-task model choice, prefer a cheaper review-capable model over the strongest implementation model.
3. **Inline fallback** — if no sub-agent mechanism is available, execute the same number of passes sequentially in the current context.

Wait for **all planned review passes** before proceeding.

## Aggregate Findings

1. Collect findings from all review passes
2. Deduplicate — if multiple passes flag the same issue, keep the highest severity
3. Group by file, then by severity (P0 → P1 → P2)
4. Drop P3 findings entirely (per the rubric)

Return the aggregated findings to the calling skill for triage.
