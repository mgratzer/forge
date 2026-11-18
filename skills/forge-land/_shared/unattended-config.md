# Unattended Configuration

Project settings the unattended skills (`forge-guard`, `forge-land`, `forge-ship --guard`) and `forge-implement`'s open-work check read from `AGENTS.md`. All optional; defaults apply when the section or a line is absent.

## Declaration

Projects declare the section verbatim:

```markdown
## Unattended Shipping

- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
```

## Which Copy

A skill working on a PR (`forge-guard`, `forge-land`) reads the section from the PR's base branch, never from the `AGENTS.md` in context or in the checkout, which on the PR's branch is the PR's own copy:

```bash
git fetch origin "$BASE" && git show "origin/$BASE:AGENTS.md" | grep -A7 "^## Unattended Shipping"
```

A base without the section means defaults, also for a PR that adds it.

With no PR yet (`forge-implement`'s open-work check), read the checkout's: already in context when the runtime auto-loads `AGENTS.md`, otherwise the same `grep` on the file.

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Peer reviewer | guard, land | none | Login the guard re-requests after each push and land names in `## Risk`, as the review-request API spells it (bots carry a `[bot]` suffix, e.g. `copilot-pull-request-reviewer[bot]`). With none, the guard waits for no review |
| Security-sensitive paths | guard, land | the risky signals in [review-delegation](review-delegation.md), *Choose Review Shape* item 3 | Globs that trigger the security pass when the diff touches them, and that always need a human review |
| Serialized resources | implement | migration directories, lockfiles, generated files | Files an Issue and an open PR must never both change, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |
| Auto-merge | land | off | `low-risk` lets land merge a PR it judged low risk; any other value is off. Left out of the example above on purpose: turn it on only after you agreed with several of land's `merge-ready` verdicts on real PRs |
