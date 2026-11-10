# Review Rubric

## Severity Levels

| Severity | Definition | Action | Examples |
|----------|-----------|--------|----------|
| **P0** | Production-breaking, data loss, security vulnerability | Must fix before merge | SQL/command/XSS injection, unhandled null on critical path, data corruption, auth bypass, secrets in code, SSRF, insecure deserialization |
| **P1** | Real foot guns — will cause bugs or confusion in practice | Should fix before merge | Race condition, missing error handling on external call, wrong enum value persisted, a module or sequence copied from one that exists |
| **P2** | Real improvements — non-urgent but worth doing | Usually fix now; create issue only if truly out of scope or materially larger | A few duplicated lines, a field or export nothing reads, a test seam, a Change outline view the diff contradicts, missing test for error branch, unclear naming that hides intent |
| **P3** | Marginal value — technically imperfect but harmless | Skip — do not flag | Minor naming preference, slightly verbose code, hypothetical future concern |

## Unattended Triage

With no one to ask, apply the Action column as written: fix every in-scope P0–P2 finding now, defer a P1 or P2 that is truly out of scope or materially larger to an Issue, and drop P3.

## What NOT to Flag

- **Naming preferences** — unless the name is actively misleading
- **Style-only diffs** — formatting, import order, whitespace (leave to linters)
- **Hypothetical edge cases** — "what if this list has a million items" without evidence it will
- **Speculative scaling concerns** — premature optimization suggestions
- **Alternative implementations** — "you could also do this with X" when the current approach works, unless X already exists in this codebase and the diff restates it
- **Missing tests for trivial code** — getters, simple mappings, framework boilerplate
- **TODOs for unrelated improvements** — stay within the PR's scope
- **Tiny follow-up issues** — prefer fixing small in-scope problems in the current PR instead of creating issue-tracker friction

## Calibration

A short review with few findings is the **right** answer for a well-written PR: do not manufacture findings.

Before flagging, ask: **"Will this actually cause a real problem?"** If the answer is "probably not" or "only in theory," skip it.
