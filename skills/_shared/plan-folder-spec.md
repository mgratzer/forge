# Plan Folder Spec

The markdown issue tracker provider, for projects that track work as files in the repository (no hosted tracker, issues-as-code, or offline work). The folder lives at the repository root.

## Directory structure

```text
plan/
├── INDEX.md
└── issues/
    ├── 001-setup-auth.md
    ├── 002-fix-login-redirect.md
    └── ...
```

**INDEX.md** is the entry point: a table that lists every issue with its current status. Skills read it to discover issues and write to it when creating or closing them.

**issues/*.md** files are individual issues. The filename is `<ID>-<slug>.md` where `<ID>` is a zero-padded numeric identifier and `<slug>` is a kebab-case summary.

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

The table is the source of truth for status. When a skill closes an issue, it updates both the issue file's `status` frontmatter and the INDEX.md row.

## Creating an issue

1. Determine the next ID: read INDEX.md, find the highest existing ID, increment by one.
2. Create `plan/issues/<ID>-<slug>.md` with frontmatter and body.
3. Append a row to the INDEX.md table.

If the `plan/` directory or `plan/issues/` subdirectory doesn't exist, create them.

## Reading an issue

Read `plan/issues/<ID>-*.md` (glob on the ID prefix). Parse YAML frontmatter for metadata, body for requirements and acceptance criteria.

## Searching issues

Grep INDEX.md for keywords, or scan `plan/issues/` filenames and frontmatter.

## Closing an issue

Forge closes an issue on the branch that implements it, so the change lands with the merge (see *Link PR* in [issue-operations](issue-operations.md)):

1. Update the issue file's `status` frontmatter to `closed`.
2. Update the corresponding INDEX.md row's Status column to `closed`.

## Common mistakes

- **Letting INDEX.md drift from issue files:** skills scan INDEX.md first, so a stale row causes missed or duplicate work.
- **Dropping the `<ID>-` filename prefix or using non-numeric IDs:** lookups by `plan/issues/<ID>-*.md` and `#<number>` references break.
