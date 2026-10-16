# Issue Operations

Provider-agnostic operations for working with Issues. Skills reference this module instead of inlining provider-conditional blocks.

## Provider Detection

Detect the provider once at the start of work; first match wins:

1. **Declared tracker:** the `Issue tracker:` Shipping setting ([project-config](project-config.md)), or a tool or CLI the project names elsewhere in AGENTS.md
2. **`plan/` directory:** markdown provider ([plan-folder-spec](plan-folder-spec.md))
3. **GitHub fallback:** the `gh` CLI

**Other provider** below means the declared one: use its tool or CLI for the same operation.

## Delegated Providers

```markdown
- Issue tracker: skill /team-tracker
- Issue tracker: mcp tracker
```

**Skill** (preferred; it knows the tracker's states and fields): invoke it for each operation with its arguments ("read ABC-123", "mark ABC-123 in review, PR <url>").

**MCP:** list the server's tools once, then map each operation to its search, get, create, update, and comment tools. Read the tracker's workflow states before changing one, and pick the "in review" state by name.

**Completion belongs to the merge** for every provider: forge moves an Issue to in review, never to done. No skill closes an Issue directly: GitHub closes it through `Closes #<ID>`, the markdown provider through the closing commit from **Link PR**, other providers through their PR integration or the human.

## Create Issue

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

**Markdown:** per [plan-folder-spec](plan-folder-spec.md): determine the next ID, write `plan/issues/<ID>-<slug>.md` with frontmatter and body, append a row to `plan/INDEX.md`, and commit.

## Discover and Update Labels

**GitHub:** discover labels before applying any:

```bash
gh label list --limit 100   # defaults to 30; raise it so discovery is exhaustive
gh issue edit <ISSUE_NUMBER> --add-label "<LABEL>"
```

**Markdown:** no predefined set; edit the issue file's `labels` frontmatter.

## Create Epic with Sub-Issues

Create the parent first, then the sub-issues. **GitHub:** link them from the parent body with a task list (`- [ ] #<SUB_ISSUE_NUMBER>`), which works on every `gh` version; newer versions also have `gh issue create --parent <PARENT_NUMBER>`, so verify the flag before relying on it. **Markdown:** list sub-issue IDs in the parent's body. **Other provider:** its hierarchy mechanism, or IDs in the parent body.

## Read Issue

**GitHub:** `gh issue view <ID>`. **Markdown:** read `plan/issues/<ID>-*.md`: frontmatter for metadata, body for requirements and acceptance criteria.

## List Issues by Scope

Given a milestone, a label, or an epic, keep the listing light and read bodies per Issue later:

```bash
gh issue list --milestone "<MILESTONE>" --state open --limit 100 --json number,title,labels,body \
  --jq '.[] | {number, title, labels: [.labels[].name], mode: ((.body | capture("(?i)execution mode:\\W*(?<m>\\w+)") | .m) // null), deps: [.body | scan("(?i)(?:depends on|blocked by|after) #(\\d+)") | .[0]]}'
gh issue list --label "<LABEL>" --state open --limit 100 --json number,title,labels,body --jq '<same filter>'
gh issue view <EPIC> --json body --jq '.body | scan("- \\[ \\] #(\\d+)") | .[0]'   # task-list sub-issues, then view each
```

**Markdown:** filter `plan/INDEX.md` rows by label or parent; `mode` is frontmatter.

## Search Issues

**GitHub:** `gh issue list --state all --search "<keywords>"`. **Markdown:** grep `plan/INDEX.md` and `plan/issues/`.

## Link PR

Given an Issue ID and its sub-issues. Two halves:

**Before the PR opens:** the closing references go to the PR body drafter, one line per Issue and sub-issue:

- **GitHub:** `Closes #<ID>`; the merge closes it.
- **Markdown:** `Closes <ID>`; and on the branch, before the push, commit `status: closed` in each issue file and its INDEX.md row, so the merge is what completes the Issue.
- **Other provider:** the tracker's ID in the form its PR integration recognizes.

**After the PR opens:** other provider only, its link or attachment operation with the PR URL.

## Mark in Review

Once the PR is open. **GitHub and markdown:** nothing; the open PR shows it. **Other provider:** move the Issue to the tracker's in-review state. Never to done.
