# Review Checklists

## Default Pass — Combined Review

1. **Correctness & patterns** — logic errors, wrong conditionals, missing null handling, misplaced logic, broken invariants, partial pattern migrations
2. **Security** — auth/authz gaps, missing validation, secrets exposure, injection risks, unsafe external requests, verbose leakage
3. **Design** — answer each question for the diff, searching outside it:
   - Each new file or exported function: what is its nearest existing sibling, found by the calls it makes and not only by name, and does this restate it?
   - Each new export: who calls it besides tests?
   - Each new parameter, field or result property: who reads it?
   - Each test: does it replace one of the project's own modules, and could it go through the interface production uses?

   Also flag unnecessary wrappers, dead weight, misleading names and comment noise.
4. **Efficiency & runtime behavior** — wasted work, unnecessary sequential bottlenecks, hot-path regressions, phantom updates, leaks, over-fetching
5. **Tests, docs & cleanup** — missing regression coverage, stale docs, debug leftovers, commented-out code, stray TODOs, hardcoded values that should be constants

When your task includes a Change outline, flag each view the diff contradicts.

## Deep Pass — Security & Correctness

The second reviewer's checklist, for high-risk changes.

1. **Security-sensitive flows** — authentication, authorization, privilege boundaries, payments, secrets, tenancy boundaries
2. **Data safety** — migrations, destructive operations, rollback paths, schema assumptions, race conditions on shared state
3. **External input** — validation, injection, path traversal, SSRF, unsafe deserialization, unbounded input
4. **Public contracts** — API behavior, protocol changes, serialization, backwards compatibility, client-visible errors
5. **Correctness under failure** — retries, partial writes, timeouts, unexpected nil/null states, cleanup on failure
