# Issue Operations

Provider-agnostic operations for working with Issues.

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

**Markdown:** follow *Creating an issue* in the [plan-folder-spec](plan-folder-spec.md), then commit the new files.

**Other provider:** use the tool or CLI declared in AGENTS.md with the same title, body, and labels.

## Discover and Update Labels

**GitHub:** discover available labels before applying any, and add missing ones to an existing Issue:

```bash
gh label list --limit 100   # defaults to 30 — raise it so discovery is exhaustive
gh issue edit <ISSUE_NUMBER> --add-label "<LABEL>"
```

**Markdown:** choose labels freely — there is no predefined set; edit the issue file's `labels` frontmatter.

**Other provider:** use the declared tool's label operations.

## Link Issues

Two links: a **parent** groups an epic's sub-issues, and **blocked by** orders Issues that depend on each other. Create blocking Issues before the Issues they block and the parent before its sub-issues, then link each one.

**GitHub:** use the native links. The mutations take node IDs, which `gh issue view <N> --json id --jq .id` returns:

```bash
gh api graphql -f query='mutation($i:ID!,$s:ID!){addSubIssue(input:{issueId:$i,subIssueId:$s}){issue{number}}}' \
  -f i="<PARENT_ID>" -f s="<SUB_ISSUE_ID>"
gh api graphql -f query='mutation($i:ID!,$b:ID!){addBlockedBy(input:{issueId:$i,blockingIssueId:$b}){issue{number}}}' \
  -f i="<BLOCKED_ID>" -f b="<BLOCKING_ID>"
```

When a mutation fails (a GitHub host without the feature), fall back to text: a `- [ ] #<SUB_ISSUE_NUMBER>` task list in the parent body, and a `Blocked by #<NUMBER>` line in the blocked Issue's body. *Read Issue* and *Prerequisites* in [open-work](open-work.md) read both forms.

**Markdown:** list sub-issue IDs in the parent issue file's body, and write `Blocked by #<ID>` in the blocked issue's body.

**Other provider:** use the declared tool's hierarchy and dependency mechanisms, or fall back to the same text as the markdown provider.

## Read Issue

Given an issue ID:

**GitHub:** `gh issue view <ID>`. An epic's open sub-issues are its native ones plus the unchecked task-list items in its body:

```bash
gh issue view <ID> --json subIssues,body --jq '[.subIssues.nodes[] | select(.state == "OPEN") | .number] + [.body | scan("- \\[ \\] #(\\d+)") | .[0] | tonumber] | unique'
```

An older `gh` without the `subIssues` or `blockedBy` JSON fields rejects them; query the same fields through `gh api graphql` instead.

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
