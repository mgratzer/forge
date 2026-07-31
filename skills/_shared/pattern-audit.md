# Pattern Consistency Audit

When a pattern changes in a diff, find every other place using the old pattern and update them. Quiet drift — two ways of doing the same thing — causes future bugs and confuses contributors.

## Checklist

- [ ] **Identify the pattern** — not the literal text, but the *shape* you changed (calling convention, error style, config naming, component structure)
- [ ] **Scope the search** — whole-repo for cross-cutting patterns, module-scoped for domain patterns, layer-scoped for layer conventions
- [ ] **Grep the old pattern** — `grep -rn "<old-pattern>" <search-root>/`
- [ ] **Evaluate each match** — update if same concept, leave if different domain or intentional per deprecation policy
- [ ] **Re-grep after updating** — confirm zero remaining matches (updates sometimes introduce new old-pattern usages via copy-paste)
- [ ] **Document exceptions** — mention any intentionally unchanged matches in the PR body

## When to audit

1. **During implementation** — the moment you change a pattern
2. **During reflection** — the review pass checks pattern consistency to catch what the implementer missed

## Common failure modes

- **Grepping literal text instead of the pattern** — renaming `userId` to `accountId` and grepping `userId` misses aliased imports
- **Wrong scope** — whole-repo grep for a layer pattern produces 200 false positives and gets abandoned
- **Stopping at first pass** — re-grep after updating to catch copy-paste regressions
- **Skipping because "change feels small"** — small changes are exactly the ones that create quiet drift
