# Quality Passes

Focused passes that run after the fresh-context review, each owning one dimension, so no dimension is reviewed twice. Used by `forge-ship` (always) and `forge-guard` (unless `forge-ship --guard` composed it; ship already ran them).

## Owners

Each dimension has exactly one owner per run, the first that applies:

| Dimension | Owner, in order of preference | Runs |
|-----------|-------------------------------|------|
| Simplify | an extra pass marked `covers: simplify` → the runtime's simplification skill (Claude Code: `/simplify`) → [review-delegation](review-delegation.md) with the default checklist narrowed to items 3, 5, and 6 of [review-dimensions](review-dimensions.md) | always |
| Security | an extra pass marked `covers: security` → the runtime's security review skill (Claude Code: `/security-review`) → review-delegation with the **Security & Correctness** deep pass | when triggered |

The security pass replaces review-delegation's mandatory security second reviewer: callers that run quality passes add no second reviewer for auth, authorization, secrets, or payments. The default reviewer keeps its light security dimension; it is part of one combined pass, not a second review.

**Security trigger** is any of: the PR or its Issue carries a `security` label; the branch diff touches a security-sensitive path from [project-config](project-config.md); or the diff's content touches auth, authorization, secrets, or payments, wherever the files live (the signal the replaced second reviewer used).

```bash
git diff --name-only origin/<BASE>...HEAD   # match against Security-sensitive paths; judge the content signal on the diff itself
```

## Extra Passes

A project appends its own passes in the `## Shipping` section:

```markdown
- Extra passes: /threat-model, /team-review (covers: security), /sign-off (each push)
```

Two markers change when a pass runs:

- **`(covers: <dimension>)`** hands that dimension to the extra pass, so forge's own pass for it doesn't run.
- **`(each push)`** runs the pass again before every later push that changes code: a guard round, the publish step, a standalone `forge-address-pr-feedback` run. A project that needs an attestation of what was reviewed (a sign-off commit, a review log) declares its own skill this way; forge only runs it.

Run the built-in passes that are still owned by forge first, then each extra pass in declared order, on the branch diff. Run each skill-backed pass (`/simplify`, `/security-review`, an extra pass) in a sub-agent when the runtime lets a sub-agent invoke skills, so its output stays out of the session; it returns findings and the changes it made. The review-delegation fallbacks already run in their own sub-agent. Passes run one at a time, because they edit the same working tree. Check availability before any pass runs: an extra pass the runtime doesn't provide is skipped and named in the summary, and a dimension it covered goes back to the next owner in the table.

**A pass never ends the run.** A skill-backed pass that runs inline closes with its own report. That report is input for triage, not the end of the turn: continue in the same turn with the next pass, then the next step of the calling skill, and push what the pass committed when the caller pushes.

## Triage and Push

Triage findings from all passes with the caller's rule: forge-ship's attended or unattended triage, guard's unattended triage. Then run the project quality gates once and commit. Guard pushes once, so CI and the peer reviewers see one revision; forge-ship leaves the push to its Publish step.
