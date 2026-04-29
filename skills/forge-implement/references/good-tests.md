# Good Tests in AI-Implemented Codebases

What to test, where to test it, and why deep boundaries beat per-function mocks.

## The principle

A test exists to verify that *behavior* works. Behavior is observed at the boundary of a unit — not at every internal function the unit happens to use. A test that mocks every internal call has stopped verifying behavior and started verifying implementation.

In AI-implemented code, this distinction matters more than in human-written code. Humans tend to under-mock; LLMs tend to over-mock. The reason is the same one TDD addresses: an LLM writing tests after the fact mocks whatever the implementation calls, because that is the path of least resistance. The result is a test suite that describes the code's call graph, not its behavior.

## Test at the deep-module boundary

Ousterhout's *deep module* is a unit with a small interface and substantial internal complexity. Tests should target the interface, not the internals. Two reasons:

1. **The interface is the contract; the internals are not.** A refactor that changes internal structure should not break the test suite. If it does, the tests were written against implementation, and the codebase will resist refactoring forever.
2. **Mocking internals describes the wrong thing.** A test asserting `expect(internalHelper).toHaveBeenCalledWith(...)` says "the code took this path." That is not behavior; it is a trace. The path can change without behavior changing, and behavior can change without the path changing.

The boundary to test at is the *outermost interface that has a meaningful contract*. For a module that exposes one public function and three helpers, the public function is the boundary. For a service with five endpoints, each endpoint is a boundary. For a UI component, the rendered output and emitted events are the boundary.

## Integration over unit, when forced to choose

In AI-implemented code, integration tests catch a class of bugs that unit tests miss: bugs at the *seams* between modules. LLMs are good at producing internally-consistent units that fail to compose. Unit tests pass; integration fails. The bug surfaces at deploy time.

This does not mean unit tests are useless — they remain the right tool for complex logic with many branches. But when a choice has to be made (limited time, limited test surface), prefer the test that exercises real seams to the one that mocks them.

## When to mock

Mock when the dependency:

- Is **non-deterministic** (the system clock, RNG, network calls to external services)
- Is **expensive** to invoke (a third-party API charging per call)
- Is **inaccessible** in the test environment (a paid SaaS without a sandbox)

Do *not* mock when the dependency is:

- Internal to the same codebase
- Cheap and fast (an in-process utility, an in-memory cache)
- Deterministic and side-effect-free

The tell for over-mocking: the test sets up more mock behavior than the code under test contains real behavior. At that point the mock setup *is* the test, and the test is verifying the mock, not the system.

## Common failure modes

**Mocking everything reachable.** An LLM asked to write tests for a function will mock every call the function makes. This produces tests that pass for code that does not work. Fix: rewrite the test to mock only across non-deterministic or external boundaries; let internal calls run normally.

**Asserting on call traces instead of outputs.** `expect(handler).toHaveBeenCalled()` is rarely the right assertion. The right assertion is "the system produced the expected outcome." Call traces are evidence; outcomes are the contract.

**One test per function.** A codebase with 200 functions does not need 200 tests. It needs tests at the boundaries that have contracts. Per-function tests are the test-suite equivalent of shallow modules — lots of surface area, little depth.

**Tests that fail when names change.** If renaming an internal helper breaks the test suite, the tests are at the wrong level. The interface did not change; the name did. Tests should care about the first and not the second.

**Treating coverage percentage as the goal.** 100% coverage from per-function mocks is worse than 60% coverage from boundary tests. The first verifies a call graph; the second verifies behavior. Coverage is a proxy; behavior verification is the goal.

**Snapshot tests as a default.** Snapshots can lock in a moving target — when the implementation changes, the snapshot is regenerated and the test approves whatever came out. Snapshots are appropriate for *stable* outputs whose drift is meaningful (rendered HTML for a finalized component, serialized error responses); they are not a substitute for asserting on specific behavior.

## Decision

Test at the deep-module boundary, mock only non-deterministic or external dependencies, and prefer integration tests when forced to choose. The test suite that results is smaller, slower-changing, and a better safety net for the refactors AI-implemented code constantly invites.
