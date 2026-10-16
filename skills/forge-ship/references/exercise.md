# Exercise the Change

Tests prove what the tests say. Driving the changed path once in the running app shows what a user or client actually gets, often the most convincing evidence on the PR.

## When

When the diff changes runtime behavior (not only docs, tests, CI configuration, or comments) and a recipe exists:

1. The `Exercise:` Shipping setting (see [project-config](../_shared/project-config.md)): a command, or a pointer to an AGENTS.md section or doc that says how to run the app
2. Otherwise the runtime's skill for running the project (for example Claude Code's `/run`)

With neither, skip the exercise and report `not exercised: no recipe`. Never guess how to start the app. A recipe section can spell out each part:

```markdown
## Local Verification

- Start: docker compose up -d && bun dev
- Exercise: curl http://localhost:4000 with the tokens in test/fixtures/tokens.json
- Needs a human: a cloud CLI login; a feature flag turned on for the test account
- Stop: docker compose down
```

## How

1. **Human actions come from the caller.** In attended mode the caller asks for each blocked action the recipe names (a login, a key in `.env`) before delegating, and passes which were done. The run never asks: a part that still needs a human is recorded as `not run: needs <action>`.
2. **Start** the app per the recipe, in the background, with one bounded wait for readiness. Services follow [phase-execution](../_shared/phase-execution.md#services).
3. **Drive the changed path** once, the way a user or client would. Check one thing the tests can't easily show: what is stored, what the client receives, what stayed unchanged.
4. **Drive one failure case** where the change has one: an unauthorized caller, another tenant's data, invalid input.
5. **Stop** everything you started, and nothing else.
6. **Report** the outcome; one evidence line per thing exercised (the command and the observed result, no logs); one line for what wasn't covered and why; and the commands a reviewer can paste to try it. Use the recipe's test credentials, never a real secret.

## Outcomes

The run changes no code; the caller acts on its outcome.

- **`intended`:** the evidence, the not-covered line, and the try-it commands go to the PR body drafter and the summary. Parts that ran count even when others were skipped.
- **`wrong (<observed vs expected>)`:** a P1 finding. Fix, run the quality gates, commit, and exercise once more. The fix lands after the review, so its commit gets one fresh-context review per [review-delegation](../_shared/review-delegation.md).
- **`can't start (<why>)`:** report `not exercised: <why>` and continue. A run that didn't reach the changed path is never evidence.
