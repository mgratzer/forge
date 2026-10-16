# PR Body

The spec a PR body is drafted against, and how to fill a repository's PR template. Used by `forge-implement` (and `forge-ship` through it).

## Drafter Inputs

The drafter is a sub-agent that never saw the work. It receives only:

- **The why:** the linked Issue's problem statement, quoted; with no Issue, the branch's commit messages
- **The diff commands:** `git diff origin/<BASE>...HEAD` and `git diff --stat origin/<BASE>...HEAD`
- **This spec**, the [writing](writing.md) rule, and the repository's PR template when one exists
- **Manual deployment steps**, when the change needs any
- **Known limitations and follow-ups:** deliberate scope cuts, stated assumptions, and deferred Issues with their titles
- **Exercise evidence**, when the changed path was run: what ran, what it showed, what wasn't covered, and the try-it commands
- **The closing reference:** `Closes #<ID>`, or the tracker's own form per [issue-operations](issue-operations.md)

Never the session history: earlier attempts, review findings, and what review changed stay out, because the reviewer reads the diff as it is now.

## Spec

- **Two short paragraphs, no headings, read in a minute.** The first says why: the problem in the reader's terms, quoting the Issue where it says it best. The second says what changes in behavior and how, at the level a reviewer needs to read the diff.
- **Keep one caveat the diff can't show** when the inputs name one: a deliberate limitation, a deployment order, a follow-up already filed. When trimming, cut anything else first. Never invent one.
- **Never** a `## Changes` list or a file-by-file walk, CI or quality-gate results, the path taken, or test counts.
- **Additions, only when they apply:** a `> [!WARNING]` block at the top for manual deployment steps; an evidence paragraph after the two, one line per thing exercised (the command and the observed result, no logs) and one for what wasn't covered; the try-it commands as a short code block; the closing reference as the last line.

## PR Template

`gh pr create --body-file` ignores the repository's template, so find it:

```bash
git ls-files | grep -i 'pull_request_template'   # .github/, docs/, root, or .github/PULL_REQUEST_TEMPLATE/*.md
```

When one exists, its structure wins and the spec governs each section's content: the why in its summary or motivation section, the evidence in its testing section. Keep every heading and checkbox, tick a checkbox only when it is true, and write `n/a` in a section the change doesn't touch. With several templates, pick the one matching the change type.
