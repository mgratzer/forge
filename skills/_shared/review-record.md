# Review Record

An optional commit attesting that the tree handed to the human was reviewed, for teams that audit review in git history. Used by `forge-ship` and `forge-guard`, and only when the project declares one in its `## Shipping` section:

```markdown
- Review record: docs/agentic-workflows.md#review-sign-off
```

The value points at the format spec — a path in the repository, a URL, or a section. Forge supplies the facts; the format is the project's. Never invent a field, trailer, or value the spec doesn't define. When the spec can't be read, write no record and say so in the summary.

## Facts Forge Supplies

- **Tree** — `git rev-parse 'HEAD^{tree}'` at the moment of writing
- **Range** — the commits this record covers: `<previous record>..HEAD`, or `origin/<BASE>..HEAD` for the first
- **Verdict inputs** — findings fixed, deferred (with their Issue IDs), and still open; decisions left for the human
- **How the review ran** — fresh-context reviewer passes, which quality passes ran and who owned each dimension

Map them onto the spec's fields. For a field forge has no fact for, follow the spec's rule for unknowns, or leave it out and name it in the summary. Write the record the way the spec says — typically an empty commit (`git commit --allow-empty -F <message-file>`).

## When

- **forge-ship** — after triage and the quality passes, as the last commit before the PR opens.
- **forge-guard** — before any push that changes code after a record exists (a CI fix, a feedback round): review the commits since the latest record with one fresh-context reviewer per [review-delegation](review-delegation.md), fix P0–P2 in-scope findings, then write a new record as the last commit of that push. The newest record therefore always matches the tree the human receives.

No code change since the latest record means no new record.
