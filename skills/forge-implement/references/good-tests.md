# Good Tests

Test *behavior* at deep-module boundaries, not implementation at every function. LLMs over-mock — they mock whatever the implementation calls, producing tests that verify a call graph instead of behavior.

## Checklist

- [ ] **Test at the boundary** — the outermost interface with a meaningful contract, not internal helpers
- [ ] **Mock only non-deterministic / external** — system clock, RNG, network calls to external services, paid APIs
- [ ] **Don't mock internals** — in-process utilities, in-memory caches, same-codebase modules
- [ ] **Assert on outcomes, not traces** — `expect(result)` not `expect(handler).toHaveBeenCalled()`
- [ ] **Prefer integration when forced to choose** — integration tests catch seam bugs that unit tests miss

## When to mock

Mock when the dependency is non-deterministic, expensive to invoke, or inaccessible in the test environment. Do *not* mock cheap, deterministic, internal dependencies.

**Tell for over-mocking:** mock setup is more complex than the code under test.

## Common failure modes

- **Mocking everything reachable** — tests pass for code that doesn't work
- **One test per function** — 200 functions don't need 200 tests; test at boundaries with contracts
- **Tests that break on renames** — tests at the wrong level; the interface didn't change
- **Coverage as goal** — 100% from per-function mocks is worse than 60% from boundary tests
- **Snapshot tests as default** — appropriate for stable outputs only; not a substitute for behavior assertions
