# Pattern Consistency Audit

When a pattern changes in a diff, find every other place using the old pattern and update them too. The audit is forge's defense against quiet drift — a codebase where two ways of doing the same thing coexist because someone changed one and didn't notice the other.

## The principle

A "pattern" is any shape repeated across the codebase: an error-handling style, a component structure, an API call convention, a config-key naming scheme, an import order rule. When you change the shape in one place, every other place using the old shape is now *out of step* with the codebase's intent.

Out-of-step usages don't break anything in the moment. They cause future bugs:

- A new contributor reads the codebase and finds two patterns. They have to guess which is current. If they pick wrong, they propagate the old shape further.
- A bug found in the new pattern's implementation gets fixed. The same bug in the old pattern, in 11 other files, doesn't get fixed.
- Reviewers reading a future PR can't tell whether a usage of the old pattern is "legacy not yet migrated" or "the right shape for this case." Pattern audits are how you make sure the answer is always the former.

## When to audit

Run the audit at two points:

1. **During implementation** (Step 5) — the moment you change a pattern in a diff, before continuing.
2. **During reflection** (forge-reflect's Correctness & Patterns dimension) — verifying the implementation didn't miss anything.

Doing it twice is not redundant: the first catches the cases the implementer can see; the second catches the cases the implementer was too close to see.

## What counts as "the pattern"

This is the judgment call. The pattern is the *shape* you changed, not the specific text.

If you renamed `getUserById` to `fetchUser`, the pattern is *not* the string `getUserById` — it's the function being called. Grep needs to match call sites, including ones where the import is renamed locally.

If you changed how errors are raised in one module from `throw new Error(...)` to `throw new DomainError(...)`, the pattern is the error-throwing convention for that module's domain. Other domains might (correctly) still throw `Error`. The audit is scoped to the domain.

If you added a new prop to a component and changed how it's passed (e.g., explicit prop → derived from context), the pattern is the calling convention for that component. Audit every call site.

A useful test: *if a future contributor saw the new shape and the old shape side by side, would they think one was wrong?* If yes, the old shape needs updating. If no (e.g., they're correctly different in different contexts), the audit is complete.

## How to scope the search

Match the search root to the pattern's scope.

- **Whole-repo pattern** (e.g., import ordering, error-throwing convention): grep across the entire repo.
- **Module-scoped pattern** (e.g., how the auth module handles invalid tokens): grep within that module's directory only.
- **Layer-scoped pattern** (e.g., how API routes register middleware): grep within the API layer only.

Over-scoping the search produces false positives ("this file uses the old shape but it's a different domain"). Under-scoping misses real cases. When unsure, start narrow and widen if the narrow scope finds clean matches.

```bash
# Whole repo
grep -rn "<old-pattern>" .

# Module
grep -rn "<old-pattern>" src/auth/

# Layer
grep -rn "<old-pattern>" src/server/routes/
```

## Distinguishing missed updates from intentional drift

Not every match is something to update. Two cases warrant leaving the old shape:

1. **Different domain, same surface text.** The string matches but the meaning is different. Example: `Error` is thrown in two unrelated modules; one was changed; the other is correctly unchanged.
2. **Deprecated but still in use.** The old shape is being phased out gradually; updating it now expands scope beyond the current Issue.

In both cases, the audit's *output* should still mention the match, even if no update happens. Reviewer needs to see "I considered this and decided to leave it" rather than "I didn't notice this." A one-line comment in the PR body is enough:

> Pattern audit: 4 call sites updated; 2 left unchanged in `src/legacy/` per the deprecation policy.

## Common failure modes

**Grepping for the literal text instead of the pattern.** Renaming `userId` to `accountId` and grepping for `userId` misses call sites that aliased the import. Pattern audits care about the *thing*, not the spelling.

**Searching the wrong scope.** A whole-repo grep for a layer-scoped pattern produces a 200-line output of false positives. The audit gets abandoned.

**Stopping at the first batch.** Updating the matches is one pass. Re-grep after updating to confirm zero matches remain. Sometimes an update introduces new usages of the old shape (a copy-paste during the migration). The second pass catches it.

**Mistaking "no matches" for "audit complete."** If grep finds nothing, the pattern might be expressed differently. Try a synonym, an AST-shaped search, or an alternate spelling. Zero matches *can* mean the pattern audit has nothing to do — but only if you've checked the pattern was searchable in the first place.

**Skipping the audit because the change "feels small."** Small changes are exactly the ones whose pattern audits get skipped. They're also exactly the ones that quietly create drift. Run the grep regardless of perceived size.

## Examples

**Change**: renamed an internal function `validateInput` to `parseInput` (the contract changed from "throws on invalid" to "returns a Result type").

Audit:
1. Grep `validateInput` whole-repo (function name is unique enough for a wide search).
2. For each match, decide: still calls validateInput? Update to parseInput. Calls something else with the same name? Leave alone (verify it's truly different).
3. Re-grep `validateInput` after updates. Zero matches → audit complete.

**Change**: changed the error response shape on REST handlers from `{ error: string }` to `{ code: string, message: string }`.

Audit:
1. Grep the API layer (`src/server/routes/`) for `error:` to find handlers still emitting the old shape.
2. Grep the client (`src/client/api/`) for `.error` to find consumers still reading the old shape.
3. Update both sides. Server tests verify shape; client tests verify parsing.
4. Re-grep both sides after updates.

## Decision

The pattern audit is a 30-second grep that prevents months of slow-burning inconsistency. **Run it every time you change a pattern, even when the change feels small.** A short audit with confirmed zero matches is the right answer most of the time — the discipline isn't *finding* lots of cases, it's *checking*.
