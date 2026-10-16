# Review Checklists

Lean review checklists for fresh-context review.

## Default Pass: Combined Review

Run this checklist in the **single default reviewer**.

1. **Correctness & patterns:** logic errors, wrong conditionals, missing null handling, misplaced logic, broken invariants, partial pattern migrations
2. **Security:** auth/authz gaps, missing validation, secrets exposure, injection risks, unsafe external requests, verbose leakage
3. **Code reuse & module shape:** duplicated logic, unnecessary wrappers, shallow modules, dead weight, misleading names, comment noise
4. **Efficiency & runtime behavior:** wasted work, unnecessary sequential bottlenecks, hot-path regressions, phantom updates, leaks, over-fetching
5. **Tests, docs & cleanup:** missing regression coverage, stale docs, debug leftovers, commented-out code, stray TODOs, hardcoded values that should be constants. Tests must assert observable behavior: flag a test that only checks a mock was called, mirrors the implementation, or would still pass with the code deleted, and a suite skipped for a missing service but reported as passing
6. **What can be deleted or not built:** defensive code for states that can't happen, configuration nobody asked for, user-facing ceremony around internal limits, backward compatibility the project says it doesn't need, and changes outside the task's scope

When the diff changes a pattern, check the other places that use its old shape (the convention, not only the literal string) within the scope where the convention applies.

## Optional Deep Pass: Security & Correctness

Use this as the **second reviewer** only for high-risk changes.

1. **Security-sensitive flows:** authentication, authorization, privilege boundaries, payments, secrets, tenancy boundaries
2. **Data safety:** migrations, destructive operations, rollback paths, schema assumptions, race conditions on shared state
3. **External input:** validation, injection, path traversal, SSRF, unsafe deserialization, unbounded input
4. **Public contracts:** API behavior, protocol changes, serialization, backwards compatibility, client-visible errors
5. **Correctness under failure:** retries, partial writes, timeouts, unexpected nil/null states, cleanup on failure

## Optional Deep Pass: Maintainability, Performance, Tests & Docs

Use this as the **second reviewer** for broad but non-security-sensitive diffs.

1. **Module depth:** avoid pass-through layers and weak abstractions; use [deep-modules.md](deep-modules.md) when module shape changed
2. **Unnecessary indirection:** barrel files or wrappers that do not earn their cost; see [barrel-imports.md](barrel-imports.md)
3. **Performance hotspots:** hot-path sync work, duplicate I/O, N+1 patterns, resource leaks, wasteful updates
4. **Test coverage:** changed public behavior, error paths, and edge cases have verification
5. **Documentation & cleanup:** README / docs / AGENTS updates, stale terminology, debug leftovers, unused imports, commented-out code
