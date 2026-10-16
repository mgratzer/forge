# Quality Passes

Focused passes that run after the fresh-context review, each owning one dimension, so no dimension is reviewed twice. Used by `forge-ship`, `forge-guard` (unless ship composed it), and, for `(each push)` passes, `forge-address-pr-feedback`.

## Owners

Each dimension has exactly one owner per run, the first that applies:

| Dimension | Owner, in order of preference | Runs |
|-----------|-------------------------------|------|
| Simplify | an extra pass marked `covers: simplify` → the runtime's simplification skill (for example Claude Code's `/simplify`) → [review-delegation](review-delegation.md) with the default checklist narrowed to items 3, 5, and 6 of [review-dimensions](review-dimensions.md) | always |
| Security | an extra pass marked `covers: security` → the runtime's security review skill (for example Claude Code's `/security-review`) → review-delegation with the **Security & Correctness** deep pass | when triggered |

The security pass replaces review-delegation's mandatory security second reviewer; the default reviewer keeps its light security dimension.

**Security trigger** is any of: the PR or its Issue carries a `security` label; the diff touches a `Security-sensitive paths` glob ([project-config](project-config.md)); or the diff's content touches auth, authorization, secrets, or payments, wherever the files live.

```bash
git diff --name-only origin/<BASE>...HEAD   # match against the globs; judge the content signal on the diff itself
```

## Extra Passes

A project appends its own passes in the `## Shipping` section:

```markdown
- Extra passes: /threat-model, /team-review (covers: security), /sign-off (each push)
```

- **`(covers: <dimension>)`** hands that dimension to the extra pass, so forge's own pass for it doesn't run.
- **`(each push)`** runs the pass again before every later push that changes code: a guard round, the publish step, a standalone `forge-address-pr-feedback` run. A project that needs an attestation of what was reviewed (a sign-off commit, a review log) declares its own skill this way; forge only runs it.

Run forge's own passes first, then each extra pass in declared order, one at a time on the branch diff, because they edit the same working tree. Run a skill-backed pass in a sub-agent when the runtime lets a sub-agent invoke skills, so its output stays out of the session. An extra pass the runtime doesn't provide is skipped and named in the summary, and a dimension it covered goes to the next owner.

**A pass never ends the run.** A skill run inline closes with its own report; that report is input for triage, not the end of the turn. Continue with the next pass, then the caller's next step.

## Triage and Push

Triage findings from all passes with the caller's rule (*Triage* in [review-rubric](review-rubric.md)), run the project quality gates once, and commit. Guard pushes once, so CI and the peer reviewers see one revision; forge-ship leaves the push to its publish step.
