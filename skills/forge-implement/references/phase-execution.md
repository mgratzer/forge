# Phase Execution

How to execute vertical phases from the structure outline. Covers the full loop: pre-flight validation, per-phase implementation with testing discipline, and phase gates.

## Pre-flight

Validate the foundation before the first line of feature code. Foundation failures disguise themselves as feature bugs.

Run all applicable checks:

- [ ] **Code generators** — run codegen, verify output is current (`git diff --stat -- generated/`). Stale artifacts make the type system lie.
- [ ] **Config placement** — grep for where similar config is consumed before placing a new value. Config defined but never read is a silent failure.
- [ ] **External services** — verify dependencies are reachable and authenticated (health check or known-good request). Don't wire against vapor.
- [ ] **Env vars / secrets** — confirm required variables exist (`echo "${VAR:?not set}"`).
- [ ] **Existing patterns** — grep for similar implementations before writing new code.

Skip a check only when its failure mode is impossible for this specific work (no new config → skip config placement; no external dependency → skip service health).

**Pre-flight gate:**
- [ ] Foundation validated (codegen current, config verified, services reachable)
- [ ] Existing patterns identified and recorded in plan

## Per-Phase Loop

For each vertical phase in the structure outline:

### 1. Implement

Code and tests together, end to end across all affected layers.

**Verify unfamiliar APIs before using them.** Agents guess APIs based on training data — when wrong, debugging is expensive.
- Check the codebase: `grep -rn "<method-or-flag>" src/`
- Check source or docs: read type definitions, `<tool> --help`, or probe the endpoint
- Check the version: verify the API exists at the project's pinned version

Skip verification for: standard library builtins, APIs already used in this codebase, and type-checked interfaces.

**Follow existing patterns and import style.** No barrel files unless the project uses them (see [barrel-imports](../../_shared/barrel-imports.md)).

### 2. Test

**Test-first when behavior is specifiable** — red/green/refactor for business logic, state transitions, parsers, validators.

The cycle:
1. **Red** — write a test capturing one behavior. Run it. Confirm it fails because the behavior is missing.
2. **Green** — write the minimum code to pass. Resist scope expansion.
3. **Refactor** — improve structure with the test as a safety net. Re-run after every change.

**What makes a good test:**
- Test at module boundaries, not internal helpers
- Mock only non-deterministic or external dependencies (clock, RNG, network, paid APIs)
- Assert on outcomes (`expect(result)`), not call traces (`expect(handler).toHaveBeenCalled()`)
- Prefer integration when forced to choose — integration tests catch seam bugs that unit tests miss

**Skip TDD for:** UI/visual work (test state transitions, not layout), exploratory prototypes, spikes, migrations of well-tested code, one-shot scripts. These are verified by inspection or existing tests.

### 3. Phase Gate

Verify before proceeding to the next phase:

- [ ] Tests exist for new behavior in this phase
- [ ] All tests pass (not just new ones)
- [ ] No lint/type errors introduced
- [ ] Commit the phase — one logical change per commit, conventional format, `Refs #<ISSUE_NUMBER>` when applicable

Use TodoWrite to track progress through phases.
