# Changelog

All notable user-facing changes to Forge will be documented in this file.

Changes are grouped by date and category. Only user-facing changes are included — internal refactors and documentation updates are omitted.

## March 2026

### Improvements

- **Optional execution context for structured-input skills** — Forge skills with a clear primary input can now append `-- <additional context>` to provide extra guidance while keeping that primary input intact.
- **AGENTS.md-first project guidance** — Forge now treats `AGENTS.md` as the canonical guidance file, keeps `CLAUDE.md` as a compatibility symlink, and removes vendor-specific setup from generated project scaffolding.

---

## February 2025

### New Skills

- **Setup Project** — Set up or audit a project's context infrastructure for agentic engineering (`AGENTS.md`, docs/, README, CHANGELOG)
- **Create Issue** — Collaboratively plan and create well-structured GitHub issues
- **Implement Issue** — Implement a feature or fix from a GitHub issue following project standards
- **Reflect on PR** — Self-review a PR for cleanup opportunities before requesting peer review
- **Address PR Feedback** — Systematically address unresolved PR review comments
- **Update Changelog** — Transform recent commits into user-friendly changelog entries
