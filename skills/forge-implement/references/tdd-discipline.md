# TDD Discipline

How red/green/refactor keeps AI-implemented code honest.

## The principle

TDD inverts the order of writing: the test exists before the code that satisfies it. The code is then written *for* the test, not the test *for* the code. That inversion is small in mechanics and large in consequence — especially when the code is being written by an LLM.

## Why test-first matters more for AI

An LLM that writes code first and tests second will produce *plausible* tests. They will pass. They will look thorough. They will also be *fitted to whatever was built* rather than fitted to the behavior the work was supposed to implement. The agent is not lying — it is doing the most natural thing: rationalizing tests that match the implementation it just produced.

This is the central failure mode TDD prevents. The test written first commits to a behavior the implementation must serve. The test written second is a description of what the implementation already does, with no independent claim about what it *should* do.

A useful test for whether write-after rationalization is happening: *would these tests catch a bug, or do they just describe the current code?* Tests written after the fact answer the second question whether they meant to or not.

## The cycle

Each iteration is small enough to commit:

1. **Red.** Write a test that captures *one* behavior. Run it. Confirm it fails — and confirm the failure mode is "the behavior is missing," not "the test couldn't load." A `ModuleNotFoundError` is not a real red.
2. **Green.** Write the *minimum* code that turns the test green. Resist scope expansion. If the test passes with a hardcoded value, the test is too narrow — go back and add another test, then implement properly. If the test passes with general code, you are ready to refactor.
3. **Refactor.** With the test as a safety net, improve the code's structure: extract helpers, rename, deduplicate. Re-run after every change. Refactoring without the safety net is the move that breaks things; refactoring with it is the move that improves them.

The cycle is short — minutes, not hours. The discipline is in *staying* short. A 90-minute red phase is not TDD; it is a planning session that started with `def test_`.

## Why granularity matters

A red/green/refactor cycle that takes 5 minutes produces a verification signal every 5 minutes. A cycle that takes 90 minutes produces one every 90 minutes. The first is a feedback loop; the second is a project plan.

For AI-implemented code, fast cycles are not optional. Long cycles let the implementation drift from the test's intent — the agent makes decisions that the test never had a chance to push back on, and by the time the test runs, those decisions are baked in. Short cycles keep the test close enough to the implementation that drift does not accumulate.

## Common failure modes

**Writing the test after.** "I'll add tests once it works" is the canonical anti-pattern. The tests that result describe the code; they do not constrain it. The fix is mechanical: write the test before the code, even if you have to delete code you have already written.

**The test that cannot fail.** A test asserting `result is not None` against code that returns a non-None object will pass. A test that always passes provides zero verification. Confirm the red phase actually fails for the *right reason*.

**Over-broad tests.** A single test asserting eight behaviors at once produces a single red→green cycle that does eight things. The cycle is too long; the failure messages are too vague. One behavior per test, even when the behaviors are related.

**Skipping refactor.** "It works, ship it" misses the third of the cycle's three benefits. Refactor is when the safety net pays off. If you never refactor, TDD has gained you correctness but not structure.

**Letting AI write both the test and the code in one shot.** When the same agent produces test and implementation in a single response, the test is no longer independent of the implementation — the agent has already imagined the implementation while writing the test, and the test is shaped by that imagination. Separate the steps: write the test, run it, *then* write the code.

## When the cycle stalls

If the red phase keeps producing tests that pass on the first run, the unit being tested is likely already correct and the test is describing it after the fact — which is not TDD. Either move to a behavior that does not yet work, or accept that this part of the work is not test-driven and switch disciplines.

If the green phase keeps growing past a few minutes, the test is too broad. Split it.

If the refactor phase keeps re-introducing failures, the test is at the wrong boundary — it is constraining implementation details rather than behavior. See [good-tests.md](good-tests.md).

## Decision

TDD's value scales with how much the implementer is asked to trust their own judgment about what is correct. Humans trust their own judgment too much; LLMs rationalize after the fact. Both failure modes are addressed by writing the verifiable claim first. For testable behavior implemented by an LLM, TDD is the discipline that keeps the work honest.
