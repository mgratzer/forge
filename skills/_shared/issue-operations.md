# Issue Operations

Provider-agnostic operations for working with Issues. Skills reference this module instead of inlining provider-conditional blocks.

## Provider Detection

Detect the Issue tracker provider once at the start of work. Check in order — first match wins:

1. **Declared tracker**: the `Issue tracker:` Shipping setting (see [project-config](project-config.md), so the user's file counts too), or a tool or CLI the project names elsewhere in AGENTS.md (see [Delegated Providers](#delegated-providers))
2. **`plan/` directory** — markdown provider (see [plan-folder-spec](plan-folder-spec.md))
3. **GitHub fallback** — use `gh` CLI

## Delegated Providers

A project can hand its tracker to a skill or an MCP server:

```markdown
- Issue tracker: skill /team-tracker
- Issue tracker: mcp tracker
```

**Skill** — invoke the named skill for each operation below, passing the operation and its arguments ("read ABC-123", "mark ABC-123 in review, PR <url>"). Prefer this form: the project's skill knows its tracker's states and fields, and switching trackers stays a one-line change.

**MCP** — map each operation to the server's tools: list them once, then use its search, get, create, update, and comment or attachment tools. Read the tracker's workflow states before changing one, and pick the state that means "in review" by name.

Either way, **completion belongs to the merge**: forge moves an Issue to in review, never to done — the tracker's own PR integration or the human closes it.

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

## List Issues by Scope

Given a milestone, a label, or an epic — keep the listing light (number, title, labels, execution mode, dependency references) and read bodies per Issue later:

**GitHub:**
```bash
gh issue list --milestone "<MILESTONE>" --state open --limit 100 --json number,title,labels,body \
  --jq '.[] | {number, title, labels: [.labels[].name], mode: ((.body | capture("(?i)execution mode:\\W*(?<m>\\w+)") | .m) // null), deps: [.body | scan("(?i)(?:depends on|blocked by|after) #(\\d+)") | .[0]]}'
gh issue list --label "<LABEL>" --state open --limit 100 --json number,title,labels,body --jq '<same filter>'
gh issue view <EPIC> --json body --jq '.body | scan("- \\[ \\] #(\\d+)") | .[0]'   # task-list sub-issues, then view each
```

**Markdown:** filter `plan/INDEX.md` rows by label or parent; `mode` is frontmatter.

**Other provider:** use the declared tool's list or filter operation.

## Search Issues

Given keywords:

**GitHub:** `gh issue list --state all --search "<keywords>"`

**Markdown:** grep `plan/INDEX.md` and `plan/issues/` for relevant keywords.

**Other provider:** use the declared tool to search.

## Link PR

Given an Issue ID and its sub-issues. Two halves:

**Before the PR opens** — the closing references go to the PR body drafter, one line per Issue and sub-issue:

- **GitHub:** `Closes #<ID>` — the merge closes it.
- **Markdown:** `Closes <ID>`; and on the branch, before the push, commit `status: closed` in each issue file and its INDEX.md row — the change lands with the merge, so the merge is what completes the Issue.
- **Other provider:** the tracker's ID in the form its PR integration recognizes.

**After the PR opens** — other provider only: the declared tool's link or attachment operation with the PR URL. Nothing for GitHub and markdown.

## Mark in Review

Given an Issue ID, once its PR is open:

**GitHub and markdown:** nothing to do — the open PR shows it.

**Other provider:** move the Issue to the tracker's in-review state with the declared tool. Never to done.

## Close Issue

Completion belongs to the merge, so no skill closes an Issue directly: GitHub closes it through `Closes #<ID>`, the markdown provider through the closing commit from **Link PR**, and other providers through their PR integration or the human.
