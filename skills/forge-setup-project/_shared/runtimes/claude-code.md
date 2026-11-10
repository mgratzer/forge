# Claude Code

What the waits and the events in [How to Wait](../pr-readiness.md#how-to-wait) look like on Claude Code. The rules there hold unchanged; this only names what the runtime does.

- **Background waits.** `run_in_background` runs `ci-wait` and `review-wait`, and the session wakes when the call exits, also when you stopped it.
- **Auto-fix** is the desktop app's watcher: it wakes the session on CI failures, merge conflicts and review comments, and never on CI turning green.
