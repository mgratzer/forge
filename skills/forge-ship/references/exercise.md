# Exercise the Change

Tests prove the code does what the tests say. Driving the changed path once in the running app shows the reviewer what a user or client actually gets, and it is often the most convincing evidence on the PR.

## When

Exercise when the diff changes runtime behavior — not only docs, tests, CI configuration, or comments — and a recipe exists:

1. The project's `- Exercise:` line in its `## Shipping` section — a command, or a pointer to the doc that says how to run the app (see [project-config](../_shared/project-config.md))
2. Otherwise the runtime's run skill (Claude Code: `/run`)

With neither, skip and report `not exercised — no recipe`. Never guess how to start the app.

## How

1. **Start** the app per the recipe, in the background, and wait for readiness in one bounded shell loop.
2. **Drive the changed path** once, the way a user or client would — the request, command, or screen the change is about. Check one thing the tests can't easily show: what is actually stored, what the client receives, what stayed unchanged.
3. **Drive one failure case** where the change has one — an unauthorized caller, another tenant's data, invalid input.
4. **Stop** everything you started.
5. **Record the evidence** — one line per thing exercised: the command and the observed result, no logs. Use the recipe's test credentials and never put a real secret into the evidence.

## Outcomes

- **Behaves as intended** — the evidence goes to the PR body drafter and the summary.
- **Behaves wrong** — treat it as a P1 finding: fix, run the quality gates, commit, and exercise once more. The fix lands after the review, so give its commit one fresh-context review per [review-delegation](../_shared/review-delegation.md) before a review record is written.
- **Can't start or reach the app** — report `not exercised — <why>` and continue; never present partial runs as evidence.
