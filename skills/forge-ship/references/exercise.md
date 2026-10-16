# Exercise the Change

Tests prove the code does what the tests say. Driving the changed path once in the running app shows the reviewer what a user or client actually gets, and it is often the most convincing evidence on the PR.

## When

Exercise when the diff changes runtime behavior (not only docs, tests, CI configuration, or comments) and a recipe exists:

1. The `Exercise:` Shipping setting (see [project-config](../_shared/project-config.md)): a command, or a pointer to an AGENTS.md section or doc that says how to run the app
2. Otherwise the runtime's run skill (Claude Code: `/run`)

With neither, skip and report `not exercised: no recipe`. Never guess how to start the app.

A recipe section can spell out each part:

```markdown
## Local Verification

- Start: docker compose up -d && bun dev
- Exercise: curl http://localhost:4000 with the tokens in test/fixtures/tokens.json
- Needs a human: a cloud CLI login; a feature flag turned on for the test account
- Stop: docker compose down
```

## How

1. **Human actions come first, from the caller.** Before delegating, the caller asks the human for each blocked action the recipe names (a login, a running service, a key in `.env`) in attended mode, and passes which were done. The run itself never asks: a part that still needs a human is skipped and recorded as `not run: needs <action>`.
2. **Start** the app per the recipe, in the background, and wait for readiness in one bounded wait. Services follow *Services* in [phase-execution](../_shared/phase-execution.md#services).
3. **Drive the changed path** once, the way a user or client would: the request, command, or screen the change is about. Check one thing the tests can't easily show, such as what is actually stored, what the client receives, or what stayed unchanged.
4. **Drive one failure case** where the change has one: an unauthorized caller, another tenant's data, invalid input.
5. **Stop** everything you started, and nothing else.
6. **Report**: the outcome (below); one evidence line per thing exercised, with the command and the observed result, no logs; one line for what wasn't covered and why, including the `not run: needs <action>` parts; and the commands a reviewer can paste to try it. Use the recipe's test credentials and never put a real secret into the report.

## Outcomes

The run reports one of three outcomes and changes no code; the caller acts on it.

- **`intended`:** the evidence, the not-covered line, and the try-it commands go to the PR body drafter and the summary. Parts that ran count as evidence even when others were skipped.
- **`wrong (<observed vs expected>)`:** the caller treats it as a P1 finding: fix, run the quality gates, commit, and delegate the exercise once more. The fix lands after the review, so its commit gets one fresh-context review per [review-delegation](../_shared/review-delegation.md).
- **`can't start (<why>)`:** report `not exercised: <why>` and continue. Never present a run that didn't reach the changed path as evidence.
