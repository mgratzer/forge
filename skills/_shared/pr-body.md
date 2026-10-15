# PR Body

The spec a PR body is drafted against, and how to fill a repository's PR template. Used by `forge-implement` (and `forge-ship` through it).

## Drafter Inputs

The drafter is a sub-agent that never saw the work. It receives only:

- **The why** — the linked Issue's problem statement, quoted; with no Issue, the branch's commit messages
- **The diff** — commands to regenerate it: `git diff origin/<BASE>...HEAD` and `git diff --stat origin/<BASE>...HEAD`
- **This spec**, and the repository's PR template when one exists (below)
- **Manual deployment steps**, when the change needs any
- **Exercise evidence**, when the caller ran the changed path — what was run and what it showed
- **The closing reference** — `Closes #<ID>`, or the tracker's own form per [issue-operations](issue-operations.md)

Never the session history: earlier attempts, review findings, and what review changed stay out, because the reviewer reads the diff as it is now.

## Spec

- **Two paragraphs, no headings, about 150 words.** The first says why: the problem in the reader's terms, quoting the Issue where it says it best. The second says what changes in behavior and how, at the level a reviewer needs to read the diff.
- **Keep one caveat the diff can't show** — a deliberate limitation, a deployment order, a follow-up already filed. When trimming, cut anything else first.
- **Never** a `## Changes` list or a file-by-file walk (the diff shows it), CI or quality-gate results (the checks show them), the path taken, or test counts.
- **Additions, only when they apply:** a `> [!WARNING]` block at the top for manual deployment steps; an evidence paragraph after the two — each thing exercised in one line, the command and the observed result, no logs; the closing reference as the last line.

## PR Template

`gh pr create --body-file` ignores the repository's template, so find it:

```bash
git ls-files | grep -i 'pull_request_template'   # .github/, docs/, root, or .github/PULL_REQUEST_TEMPLATE/*.md
```

When one exists, its structure wins and the spec governs what goes in each section: the why goes in its summary or motivation section, the evidence in its testing or QA section. Keep every heading and checkbox; tick a checkbox only when it is true; write `n/a` in a section the change doesn't touch rather than deleting it. With several templates, pick the one matching the change type.
