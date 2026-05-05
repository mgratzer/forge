# Review Rubric

## Severity Levels

| Severity | Definition | Action | Examples |
|----------|-----------|--------|----------|
| **P0** | Production-breaking, data loss, security vulnerability | Must fix before merge | SQL/command/XSS injection, unhandled null on critical path, data corruption, auth bypass, secrets in code, SSRF, insecure deserialization |
| **P1** | Real foot guns — will cause bugs or confusion in practice | Should fix before merge | Race condition, missing error handling on external call, wrong enum value persisted |
| **P2** | Real improvements — non-urgent but worth doing | Usually fix now; create issue only if truly out of scope or materially larger | Duplicated logic across files, missing test for error branch, unclear naming that hides intent |
| **P3** | Marginal value — technically imperfect but harmless | Skip — do not flag | Minor naming preference, slightly verbose code, hypothetical future concern |

## What to Flag

- Logic errors, off-by-one, wrong operator
- Missing error handling on I/O or external calls
- Security issues (injection, auth bypass, secrets in code, missing input validation, SSRF, path traversal, insecure crypto, information leakage)
- Data integrity risks (silent data loss, corrupt state)
- Missing tests for code paths that have failed before
- Pattern inconsistency that will cause bugs when the next developer follows the old pattern
- Performance issues with measurable user impact

## What NOT to Flag

- **Naming preferences** — unless the name is actively misleading
- **Style-only diffs** — formatting, import order, whitespace (leave to linters)
- **Hypothetical edge cases** — "what if this list has a million items" without evidence it will
- **Speculative scaling concerns** — premature optimization suggestions
- **Alternative implementations** — "you could also do this with X" when the current approach works
- **Missing tests for trivial code** — getters, simple mappings, framework boilerplate
- **TODOs for unrelated improvements** — stay within the PR's scope
- **Tiny follow-up issues** — prefer fixing small in-scope problems in the current PR instead of creating issue-tracker friction

## Calibration

A short review with few findings is the **right** answer for a well-written PR. The goal is to catch real problems, not to demonstrate thoroughness.

Before flagging, ask: **"Will this actually cause a real problem?"** If the answer is "probably not" or "only in theory," skip it.
