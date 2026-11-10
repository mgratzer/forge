# Plan Folder Spec

The markdown issue tracker provider, for projects that track work as files versioned with the code instead of in a hosted service. The folder lives at the repository root.

## Directory structure

```text
plan/
├── INDEX.md
└── issues/
    ├── 001-setup-auth.md
    ├── 002-fix-login-redirect.md
    └── ...
```

**INDEX.md** is the entry point — a table that lists every issue with its current status. Skills scan it first to discover issues, and write to it when creating or closing them.

**issues/*.md** files are individual issues. The filename is `<ID>-<slug>.md` where `<ID>` is a zero-padded numeric identifier and `<slug>` is a kebab-case summary. Skills find an issue by its `<ID>-` prefix and cite it as `#<ID>`, so the ID is never omitted or non-numeric.

## Issue file format

```yaml
---
id: 1
title: "feat(auth): add OAuth support"
status: open
labels: [enhancement]
mode: AFK
created: 2026-04-30
---
```

| Field | Required | Values |
|-------|----------|--------|
| `id` | Yes | Positive integer, unique across the project |
| `title` | Yes | Conventional commit format |
| `status` | Yes | `open`, `in-progress`, `closed` |
| `labels` | No | List of label strings |
| `mode` | No | `AFK` or `HITL` (defaults to `HITL`) |
| `created` | Yes | ISO date |

The body below the frontmatter uses the same structure as any forge Issue: Summary, Problem / Motivation, Proposed Solution (with Alternatives Considered and Implementation Constraints when applicable), Acceptance Criteria.

## INDEX.md format

```markdown
# Plan

| ID | Title | Status | Labels | Mode |
|----|-------|--------|--------|------|
| 1 | feat(auth): add OAuth support | open | enhancement | AFK |
| 2 | fix(login): redirect loop on expired session | open | bug | HITL |
```

The table is the source of truth for status. Whenever a status changes, update both the issue file's `status` frontmatter and the INDEX.md row: a stale row causes missed or duplicate work.

## Creating an issue

1. Determine the next ID: read INDEX.md, find the highest existing ID, increment by one.
2. Create `plan/issues/<ID>-<slug>.md` with frontmatter and body, creating `plan/` and `plan/issues/` when they don't exist.
3. Append a row to the INDEX.md table.

Reading, searching, and closing an issue are in [issue-operations](issue-operations.md).
