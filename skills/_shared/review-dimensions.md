# Review Dimensions

Four quality dimensions for parallel review. Each reviewer agent receives one dimension checklist.

## Agent 1 — Correctness & Patterns

1. **Logic errors** — off-by-one, wrong operator, incorrect boolean logic, unhandled null/undefined on critical paths
2. **Pattern consistency** — if a pattern was changed, grep for ALL files using it:
   ```bash
   grep -rn "<changed-pattern>" <search-root>/
   ```
   Flag any files still using the old pattern.
3. **Layer placement** — logic in the right abstraction layer
4. **Configuration** — new env vars documented in sample env or setup docs? Config placed where consumed? No hardcoded credentials? Manual deployment steps captured?
5. **Leaky abstractions** — exposing internal details that should be encapsulated, or breaking existing abstraction boundaries

## Agent 2 — Security

1. **Injection** — SQL, command, XSS, template injection — anywhere user-controlled input reaches a query, shell command, or rendered output without sanitization
2. **Authentication & authorization** — new endpoints or operations missing auth checks; privilege escalation paths; role checks that can be bypassed
3. **Secrets & credentials** — API keys, tokens, passwords hardcoded or logged; secrets committed to version control; credentials in error messages or stack traces
4. **Input validation** — missing or insufficient validation on external input; path traversal via user-controlled file paths; unbounded input sizes that enable DoS
5. **SSRF & external requests** — user-controlled URLs passed to HTTP clients, DNS rebinding risks, internal service endpoints reachable via crafted input
6. **Race conditions** — time-of-check to time-of-use (TOCTOU) gaps that create security windows; concurrent access without proper locking on security-sensitive state
7. **Cryptography** — weak algorithms, hardcoded IVs/salts, custom crypto instead of established libraries, insecure random number generation for security-sensitive values
8. **Information leakage** — verbose error messages exposing internals, stack traces returned to clients, debug endpoints left enabled, sensitive data in logs
9. **Insecure deserialization** — deserializing untrusted data without validation; formats that allow code execution (pickle, YAML load, eval)
10. **Dependency risk** — new dependencies with known CVEs; pinned versions with known vulnerabilities; unnecessary new attack surface from added packages

## Agent 3 — Code Reuse & Quality

1. **Redundant implementations** — search the codebase for existing helpers, utilities, or shared modules that already solve the same problem before accepting new code
2. **Extraction opportunities** — repeated logic across the diff, or inline code that reimplements what a shared module already provides (string manipulation, path handling, type guards, environment checks)
3. **Structural bloat** — functions growing beyond a screenful, parameter lists growing instead of restructuring, state that duplicates what's already tracked elsewhere
4. **Module shape** — shallow modules whose interfaces mirror their internals, pass-through methods that relay without transforming, wrapper classes that add no simplification. See [deep-modules.md](deep-modules.md) for the audit checklist
5. **Unnecessary indirection** — barrel files (index re-exports) introduced without a published-API boundary or existing project convention. See [barrel-imports.md](barrel-imports.md) for the costs and when barrels earn their place
6. **Dead weight** — unused imports, unreachable branches, or variables introduced but never read
7. **Misleading names** — only when a name will actively confuse the next reader, not style preferences
8. **Comment noise** — comments that narrate what the code does or reference the ticket; keep only non-obvious "why" (hidden constraints, workarounds, subtle invariants)

## Agent 4 — Efficiency, Tests & Docs

**Efficiency:**
1. **Wasted cycles** — redundant computations, duplicate I/O or network calls, N+1 query patterns
2. **Sequential bottlenecks** — independent operations that could run concurrently but are chained
3. **Hot-path impact** — new synchronous work on startup, request, or render critical paths
4. **Phantom updates** — state mutations that fire without checking whether anything actually changed, triggering unnecessary downstream work
5. **Premature existence checks** — verifying a resource exists before operating on it; prefer operating and handling the error (skip if already flagged as a security race condition by another reviewer)
6. **Resource leaks** — unbounded collections, missing cleanup handlers, dangling event listeners
7. **Over-fetching** — reading entire resources when a slice would suffice; loading all records to filter for one

**Tests & Documentation:**
8. **Test coverage** — corresponding test files exist? Error handling branches covered? Edge cases for new public functions?
9. **Documentation** — changes require updates to `docs/*.md`, `AGENTS.md`, code comments, or README? Grep docs for stale references to anything removed or renamed:
   ```bash
   grep -rn "<removed-term>" docs/
   ```
10. **Cleanup** — no temporary debug logging, commented-out code, untracked TODOs, unused imports, or hardcoded values that should be constants
