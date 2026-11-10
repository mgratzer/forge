# Phase Execution

How to execute vertical phases from the structure outline: pre-flight validation, then each phase through its gate.

## Pre-flight

Validate the foundation before the first line of feature code. Foundation failures disguise themselves as feature bugs.

Run all applicable checks:

- [ ] **Fresh checkout** — when `AGENTS.md`'s Commands name a step that gets a fresh checkout ready (install dependencies, a bootstrap script, a test database) and this checkout looks fresh (no dependencies installed, no generated output), run that step first. Only what the project declares: never invent a setup step.
- [ ] **Gate parts** — list what the project's quality gates run (from `AGENTS.md`, or the script or CI workflow it names): each linter, dead-code or unused-suppression check, banned-word check, coverage threshold. Phases then pass each one the first time instead of finding a new failing check on every run.
- [ ] **Code generators** — run codegen, verify output is current (`git diff --stat -- generated/`).
- [ ] **Config placement** — grep for where similar config is consumed before placing a new value, so it is actually read.
- [ ] **External services** — verify dependencies are reachable and authenticated (health check or known-good request).
- [ ] **Env vars / secrets** — confirm required variables exist (`echo "${VAR:?not set}"`).
- [ ] **Existing implementations** — grep for code that already does something similar, by the calls it makes as well as its name: each goes in the Plan's design block, to call or extend.

Skip a check only when its failure mode is impossible for this work (no new config, no external dependency).

## Per-Phase Loop

For each vertical phase in the structure outline:

### 1. Implement

Code and tests together, end to end across all affected layers.

**Verify unfamiliar APIs before using them** — grep the codebase, check type definitions or docs, confirm the API exists at the project's pinned version. Skip for: stdlib, APIs already used in this codebase, type-checked interfaces.

**Follow existing patterns and import style**, by calling or extending the code that has the pattern, not by copying it. Add no barrel (index re-export) file unless the project already uses them, the framework requires one, or it is a published package's public API.

A script written to run once (a backfill, an experiment, a benchmark) stays out of the commit, or the PR's Notes name the Issue that deletes it.

### 2. Test

Test-first for business logic, state transitions, parsers, validators. Skip TDD for UI layout, spikes, migrations of well-tested code, one-shot scripts.

Rules:
- Test at module boundaries, not internal helpers. Add no test seam (see [deep-modules](deep-modules.md)); when coverage can't be reached without one, list it in the PR's Notes
- Mock only non-deterministic or external dependencies (clock, RNG, network, paid APIs), never the project's own modules
- Prefer integration tests when choosing between unit and integration

### 3. Phase Gate

Verify before proceeding to the next phase:

- [ ] Tests exist for new behavior in this phase
- [ ] All tests pass (not just new ones)
- [ ] No lint/type errors introduced
- [ ] Commit the phase — one logical change per commit, conventional format

**Environment failures.** A failure at this gate or any later one is an environment failure, not a code failure, when it clears after re-running the fresh-checkout step or names a missing service, env var, or tool, and the base commit, without this change, fails the same way. When the change brought in what is missing (a new env var, service, or tool), it is a code failure: the fix belongs in the change (`.env.example`, config, Commands). Fix an environment failure the way the project says (re-run the step, start the service as Commands or the run recipe do, set the variable from `.env.example`) and change no code for it; it is not a Deviation. Say what failed and how you fixed it under the PR's Notes, editing the body when the PR is already open. When the session can't fix it that way (a secret only the user has, a service it can't start, a tool Commands don't install), stop: in attended mode ask the user; in unattended mode report `needs-human` via [status-reporting](status-reporting.md), naming what is missing.
