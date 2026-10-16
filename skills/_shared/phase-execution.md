# Phase Execution

How to execute vertical phases from the structure outline: pre-flight validation, per-phase implementation with testing discipline, and phase gates.

## Pre-flight

Validate the foundation before the first line of feature code. Foundation failures disguise themselves as feature bugs.

- [ ] **Code generators:** run codegen and verify the output is current (`git diff --stat -- generated/`); stale artifacts make the type system lie
- [ ] **Config placement:** grep for where similar config is consumed before placing a new value; config never read is a silent failure
- [ ] **External services:** reachable and authenticated (a health check or known-good request)
- [ ] **Env vars / secrets:** present, checked without printing them (`: "${VAR:?not set}"`)
- [ ] **Existing patterns:** similar implementations found and recorded in the plan

Skip a check only when its failure mode is impossible for this work.

## Per-Phase Loop

For each vertical phase in the structure outline:

### 1. Implement

Code and tests together, end to end across all affected layers. **Verify unfamiliar APIs** before using them: grep the codebase, check type definitions or docs, confirm the API exists at the pinned version (skip for stdlib, APIs already used here, type-checked interfaces). **Follow existing patterns and import style**; no barrel files unless the project uses them ([barrel-imports](barrel-imports.md)).

### 2. Test

Test-first for business logic, state transitions, parsers, validators. Skip TDD for UI layout, spikes, migrations of well-tested code, one-shot scripts.

- Test at module boundaries, not internal helpers
- Mock only non-deterministic or external dependencies (clock, RNG, network, paid APIs)
- Assert outcomes, not call traces
- Prefer integration tests when choosing between unit and integration

### 3. Phase Gate

- [ ] Tests exist for new behavior in this phase
- [ ] All tests pass (not just new ones)
- [ ] No lint/type errors introduced
- [ ] Commit the phase: one logical change, conventional format, under the configured git identity (never change `user.name` or `user.email`)

## When Tests Fail

- **Environmental:** connection refused or closed, a missing database or service, a port already taken. Start the project's test services (its bootstrap script, or the command AGENTS.md or the docs give) and run again. With no documented way, ask in attended mode; in unattended mode, stop with `needs-human` and the reason. A suite that couldn't reach its service is reported as skipped, never as passing.
- **The changed module's own tests** failing is never pre-existing. That failure belongs to this change.
- **Pre-existing** takes proof from the base: the same check's latest CI result on the base branch, or a run in a throwaway worktree (`git worktree add --detach <path> origin/<BASE>`, removed afterwards). Never `git stash` to get there.

## Services

Other checkouts may be running their own tests at the same time. Never stop or reuse a service this run didn't start, unless the human started it for this run or AGENTS.md says the checkouts share it. Use per-checkout ports when the project's recipe allows it. Stop what this run started when it is done.
