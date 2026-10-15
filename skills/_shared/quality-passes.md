# Quality Passes

Focused passes that run after the fresh-context review, each owning one dimension, so no dimension is reviewed twice. Used by `forge-ship` (always) and `forge-guard` (when ship didn't already run them).

## Owners

Each dimension has exactly one owner per run — the first that applies:

| Dimension | Owner, in order of preference | Runs |
|-----------|-------------------------------|------|
| Simplify | an extra pass marked `covers: simplify` → the runtime's simplification skill (Claude Code: `/simplify`) → [review-delegation](review-delegation.md) with the default checklist narrowed to items 3 and 5 of [review-dimensions](review-dimensions.md) | always |
| Security | an extra pass marked `covers: security` → the runtime's security review skill (Claude Code: `/security-review`) → review-delegation with the **Security & Correctness** deep pass | when triggered |

The security pass replaces review-delegation's mandatory security second reviewer: callers that run quality passes add no second reviewer for auth, authorization, secrets, or payments. The default reviewer keeps its light security dimension — it is part of one combined pass, not a second review.

**Security trigger** — the PR or its Issue carries a `security` label, or the branch diff touches a security-sensitive path from [project-config](project-config.md):

```bash
git diff --name-only origin/<BASE>...HEAD   # match against Security-sensitive paths, or the default risky signals
```

## Extra Passes

A project appends its own passes in the `## Shipping` section:

```markdown
- Extra passes: /risk-eval, /team-review (covers: security)
```

Run the built-in passes that are still owned by forge first, then each extra pass in declared order, on the branch diff. `covers: <dimension>` hands that dimension to the extra pass, so forge's own pass for it doesn't run. An extra pass the runtime doesn't provide is skipped and named in the summary.

## Triage and Push

Triage findings from all passes with the caller's rule — forge-ship's attended or unattended triage, guard's unattended triage. Then run the project quality gates once, commit, and push once, so CI and the peer reviewer see one revision.
