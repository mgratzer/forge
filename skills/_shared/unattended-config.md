# Unattended Configuration

Project-level settings the unattended skills (`forge-guard`, `forge-batch`, `forge-ship --guard`) read from `AGENTS.md`. All optional — defaults apply when the section or a line is absent.

## Declaration

Projects declare the section verbatim so it can be read by grep as well as by an agent:

```markdown
## Unattended Shipping

- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
- Launcher: contrib/launchers/cmux-claude.sh
```

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Peer reviewer | guard | none | Login the guard re-requests after each push, in the form the review-request API expects (bots carry a `[bot]` suffix there, e.g. `copilot-pull-request-reviewer[bot]`). The wait itself accepts any review not authored by the current user. When absent, the guard waits for CI and addressed threads only |
| Security-sensitive paths | guard | `**/auth/**`, `**/payment*/**`, `**/webhook*/**`, `**/middleware/**` | Globs that trigger the security pass when the diff touches them |
| Serialized resources | batch | migration directories, lockfiles, generated files | Files two Issues must never change in the same Wave, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |
| Launcher | batch | none | Script the batch output names for starting a Wave |

Read the section with the `Read` tool when planning; use grep only for one-line lookups:

```bash
grep -A8 "^## Unattended Shipping" AGENTS.md
```
