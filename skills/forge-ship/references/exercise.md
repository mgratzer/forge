# Exercise the Change

Tests prove the code does what the tests say. Driving the changed path once in the running app shows the reviewer what a user or client actually gets, and it is often the most convincing evidence on the PR.

## When

Exercise when the diff changes runtime behavior (not only docs, tests, CI configuration, or comments) and a recipe exists:

1. The project's `Exercise:` setting (see [project-config](../_shared/project-config.md)): a command, or a pointer to an AGENTS.md section or doc that says how to run the app
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

1. **Do what needs a human first.** In attended mode, ask for each blocked action (a login, a running service, a key in `.env`) and wait for it. In unattended mode, skip the parts that need it and record `not run: needs <action>`.
2. **Start** the app per the recipe, in the background, and wait for readiness in one bounded shell loop.
3. **Drive the changed path** once, the way a user or client would: the request, command, or screen the change is about. Check one thing the tests can't easily show, such as what is actually stored, what the client receives, or what stayed unchanged.
4. **Drive one failure case** where the change has one: an unauthorized caller, another tenant's data, invalid input.
5. **Stop** everything you started.
6. **Record the evidence**: one line per thing exercised, with the command and the observed result, no logs. Add one line for what wasn't covered and why. Use the recipe's test credentials and never put a real secret into the evidence.

## Outcomes

- **Behaves as intended:** the evidence goes to the PR body drafter and the summary, together with the commands a reviewer can run to try it.
- **Behaves wrong:** treat it as a P1 finding. Fix, run the quality gates, commit, and exercise once more. The fix lands after the review, so give its commit one fresh-context review per [review-delegation](../_shared/review-delegation.md) before a review record is written.
- **Can't start or reach the app:** report `not exercised: <why>` and continue. Never present a partial run as evidence.
