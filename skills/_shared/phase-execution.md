# Phase Execution

How to execute vertical phases from the structure outline. Covers the full loop: pre-flight validation, per-phase implementation with testing discipline, and phase gates.

## Pre-flight

Validate the foundation before the first line of feature code. Foundation failures disguise themselves as feature bugs.

Run all applicable checks:

- [ ] **Code generators:** run codegen, verify output is current (`git diff --stat -- generated/`). Stale artifacts make the type system lie.
- [ ] **Config placement:** grep for where similar config is consumed before placing a new value. Config defined but never read is a silent failure.
- [ ] **External services:** verify dependencies are reachable and authenticated (health check or known-good request). Don't wire against vapor.
- [ ] **Env vars / secrets:** confirm required variables exist without printing them (`: "${VAR:?not set}"`).
- [ ] **Existing patterns:** grep for similar implementations before writing new code.

Skip a check only when its failure mode is impossible for this specific work (no new config → skip config placement; no external dependency → skip service health).

**Pre-flight gate:**
- [ ] Foundation validated (codegen current, config verified, services reachable)
- [ ] Existing patterns identified and recorded in plan

## Per-Phase Loop

For each vertical phase in the structure outline:

### 1. Implement

Code and tests together, end to end across all affected layers.

**Verify unfamiliar APIs before using them:** grep the codebase, check type definitions or docs, confirm the API exists at the project's pinned version. Skip for: stdlib, APIs already used in this codebase, type-checked interfaces.

**Follow existing patterns and import style.** No barrel files unless the project uses them (see [barrel-imports](barrel-imports.md)).

### 2. Test

Test-first for business logic, state transitions, parsers, validators. Skip TDD for UI layout, spikes, migrations of well-tested code, one-shot scripts.

Rules:
- Test at module boundaries, not internal helpers
- Mock only non-deterministic or external dependencies (clock, RNG, network, paid APIs)
- Assert outcomes, not call traces
- Prefer integration tests when choosing between unit and integration

### 3. Phase Gate

Verify before proceeding to the next phase:

- [ ] Tests exist for new behavior in this phase
- [ ] All tests pass (not just new ones)
- [ ] No lint/type errors introduced
- [ ] Commit the phase: one logical change per commit, conventional format, under the configured git identity (never change `user.name` or `user.email`)

## When Tests Fail

- **Environmental:** connection refused or closed, a missing database or service, a port already taken. Start the project's test services (its bootstrap script, or the command AGENTS.md or the docs give) and run again. With no documented way, ask in attended mode; in unattended mode, stop with `needs-human` and the reason rather than continue. A suite that couldn't reach its service is reported as skipped, never as passing.
- **The changed module's own tests** failing is never pre-existing. That failure belongs to this change.
- **Pre-existing** takes proof from the base: the same check's latest CI result on the base branch, or a run in a throwaway worktree (`git worktree add --detach <path> origin/<BASE>`, removed afterwards). Never `git stash` to get there.
- **Services:** use this checkout's own services and ports where the `Test infrastructure` Shipping setting (see [project-config](project-config.md)) or the recipe allows. Stop only what you started; never stop or reuse a service another checkout started, unless the setting declares it shared.
