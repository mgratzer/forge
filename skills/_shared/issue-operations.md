# Issue Operations

Provider-agnostic operations for working with Issues. Skills reference this module instead of inlining provider-conditional blocks.

## Provider Detection

Detect the Issue tracker provider once at the start of work. Check in order — first match wins:

1. **AGENTS.md declaration** — project declares a specific tool or CLI for issue tracking
2. **`plan/` directory** — markdown provider (see [plan-folder-spec](plan-folder-spec.md))
3. **GitHub fallback** — use `gh` CLI

## Create Issue

Given a title, body, and labels:

**GitHub:**
```bash
gh issue create \
  --title "<title>" \
  --body "$(cat <<'ISSUE_EOF'
<body>
ISSUE_EOF
)" \
  --label "<labels>"
```

**Markdown:** create a new issue file per the [plan-folder-spec](plan-folder-spec.md) — determine the next ID, write `plan/issues/<ID>-<slug>.md` with frontmatter and body, append a row to `plan/INDEX.md`, and commit the new files.

**Other provider:** use the tool or CLI declared in AGENTS.md with the same title, body, and labels.

## Discover and Update Labels

**GitHub:** discover available labels before applying any, and add missing ones to an existing Issue:

```bash
gh label list --limit 100   # defaults to 30 — raise it so discovery is exhaustive
gh issue edit <ISSUE_NUMBER> --add-label "<LABEL>"
```

**Markdown:** choose labels freely — there is no predefined set; edit the issue file's `labels` frontmatter.

**Other provider:** use the declared tool's label operations.

## Create Epic with Sub-Issues

Create the parent Issue first, then the sub-issues.

**GitHub:** link sub-issues from the parent body with a task list — this works on every `gh` version:

```markdown
- [ ] #<SUB_ISSUE_NUMBER>
```

Newer `gh` versions also support `gh issue create --parent <PARENT_NUMBER>` for native sub-issues; verify the flag exists before relying on it.

**Markdown:** list sub-issue IDs in the parent issue file's body.

**Other provider:** use the declared tool's hierarchy mechanism, or fall back to referencing sub-issue IDs in the parent body.

## Read Issue

Given an issue ID:

**GitHub:** `gh issue view <ID>`

**Markdown:** read `plan/issues/<ID>-*.md` — parse YAML frontmatter for metadata, body for requirements and acceptance criteria.

**Other provider:** use the declared tool to fetch the issue by ID.

## Search Issues

Given keywords:

**GitHub:** `gh issue list --state all --search "<keywords>"`

**Markdown:** grep `plan/INDEX.md` and `plan/issues/` for relevant keywords.

**Other provider:** use the declared tool to search.

## Close Issue

Given an issue ID:

**GitHub:** the PR's `Closes #<ID>` reference handles this automatically.

**Markdown:** update the issue file's `status` frontmatter to `closed` and update the corresponding INDEX.md row.

**Other provider:** use the declared tool to close the issue.
