# TDD Discipline

Write the test before the code. An LLM that writes code first produces *plausible* tests fitted to whatever was built — not to the behavior the work was supposed to implement. The test written first commits to a behavior; the test written second rationalizes the implementation.

## The cycle

1. **Red** — write a test capturing one behavior. Run it. Confirm it fails because the behavior is missing (not because of import errors).
2. **Green** — write the *minimum* code to pass. Resist scope expansion.
3. **Refactor** — with the test as a safety net, improve structure. Re-run after every change.

Keep cycles short (minutes, not hours). Long cycles let the implementation drift from the test's intent.

## Checklist

- [ ] Test written before implementation code
- [ ] Red phase fails for the right reason
- [ ] One behavior per test
- [ ] Green phase implements minimum to pass
- [ ] Refactor phase runs tests after every change
- [ ] Test and implementation written in separate steps (not one shot)

## Common failure modes

- **Writing tests after** — "I'll add tests once it works" produces tests that describe code, not constrain it
- **Tests that cannot fail** — `result is not None` always passes; confirm the red phase fails for the *right reason*
- **Over-broad tests** — eight behaviors in one test = one vague cycle
- **AI writes both in one shot** — test is shaped by the imagined implementation; separate the steps
- **Skipping refactor** — TDD gains correctness and structure; skipping refactor loses half the value
