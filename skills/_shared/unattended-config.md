# Unattended Configuration

Project settings the unattended skills (`forge-guard`, `forge-land`, `forge-batch`, `forge-ship --guard`) and `forge-implement`'s open-work check read from `AGENTS.md`. All optional; defaults apply when the section or a line is absent.

## Declaration

Projects declare the section verbatim:

```markdown
## Unattended Shipping

- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
```

The section is already in context when the runtime auto-loads `AGENTS.md`; otherwise `grep -A7 "^## Unattended Shipping" AGENTS.md`.

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Peer reviewer | guard, land | none | Login the guard re-requests after each push and land names in `## Risk`, as the review-request API spells it (bots carry a `[bot]` suffix, e.g. `copilot-pull-request-reviewer[bot]`). With none, the guard waits for no review |
| Security-sensitive paths | guard, land | the risky signals in [review-delegation](review-delegation.md), *Choose Review Shape* item 3 | Globs that trigger the security pass when the diff touches them, and that always need a human review |
| Serialized resources | batch, implement | migration directories, lockfiles, generated files | Files two concurrent changes (Issues in one Wave, or an Issue and an open PR) must never both change, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |
| Auto-merge | land | off | `low-risk` lets land merge a PR it judged low risk; any other value is off. Left out of the example above on purpose: turn it on only after you agreed with several of land's `merge-ready` verdicts on real PRs |

## Launcher

- `FORGE_LAUNCHER` names the launcher in `forge-batch`'s launch lines. Which terminal starts a session is per developer, so it lives in the environment rather than in `AGENTS.md`.
