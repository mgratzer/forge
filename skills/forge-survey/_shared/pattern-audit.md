# Pattern Consistency Audit

When a pattern changes in a diff, find every other place using the old pattern and update them, so the codebase doesn't end up with two ways of doing the same thing.

## Checklist

- [ ] **Identify the pattern** — not the literal text, but the *shape* you changed (calling convention, error style, config naming, component structure). Renaming `userId` to `accountId` and grepping `userId` misses aliased imports.
- [ ] **Scope the search** — whole-repo for cross-cutting patterns, module-scoped for domain patterns, layer-scoped for layer conventions. A whole-repo grep for a layer pattern produces hundreds of false positives and gets abandoned.
- [ ] **Grep the old pattern** — `grep -rn "<old-pattern>" <search-root>/`
- [ ] **Evaluate each match** — update if same concept, leave if different domain or intentional per deprecation policy
- [ ] **Re-grep after updating** — confirm zero remaining matches (updates sometimes introduce new old-pattern usages via copy-paste)
- [ ] **Document exceptions** — mention any intentionally unchanged matches in the PR body

Audit even when the change feels small: small changes are the ones that create quiet drift.
