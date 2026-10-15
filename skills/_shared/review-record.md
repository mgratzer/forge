# Review Record

An optional commit attesting that the tree handed to the human was reviewed, for teams that audit review in git history. Used by `forge-ship` and `forge-guard`, and only when the project declares one in its `## Shipping` section:

```markdown
- Review record: docs/review-process.md#sign-off
```

The value points at the format spec — a path in the repository, a URL, or a section. Forge supplies the facts; the format is the project's. Never invent a field, trailer, or value the spec doesn't define. When the spec can't be read, write no record and say so in the summary.

## Facts Forge Supplies

- **Tree** — `git rev-parse 'HEAD^{tree}'` at the moment of writing
- **Range** — the commits this record covers: `<previous record>..HEAD`, or `origin/<BASE>..HEAD` for the first
- **Verdict inputs** — findings fixed, deferred (with their Issue IDs), and still open; decisions left for the human
- **How the review ran** — fresh-context reviewer passes, which quality passes ran and who owned each dimension

Map them onto the spec's fields. For a field forge has no fact for, follow the spec's rule for unknowns, or leave it out and name it in the summary. Write the record the way the spec says — typically an empty commit (`git commit --allow-empty -F <message-file>`).

Check the record before it leaves the machine: every field the spec requires is present, the tree equals `git rev-parse 'HEAD^{tree}'`, and the range resolves (`git rev-list --count <range>` succeeds). A record that fails is fixed while it is still unpushed, by amending its commit where the spec allows; once pushed, a corrected record goes on top and the summary names the broken one.

## When

- **forge-ship** — after triage and the quality passes, as the last commit before the PR opens.
- **forge-guard, standalone, on a PR without a record** — run one fresh-context review over `origin/<BASE>..HEAD` per [review-delegation](review-delegation.md) and triage it before the first record, so the record never attests to the quality passes alone.
- **forge-guard** — before any push that changes code after a record exists (a CI fix, a feedback round): review the commits since the latest record with one fresh-context reviewer per [review-delegation](review-delegation.md), fix P0–P2 in-scope findings, then write a new record as the last commit of that push. The newest record therefore always matches the tree the human receives.

Commits after the latest record that change no code — tracker updates after the PR opens, metadata — need no re-review. When the spec ties the record to the handed-off tree, write a fresh record over them as the last commit of the same push; otherwise leave the record as it is.
