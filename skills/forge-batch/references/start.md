# Start and Continue

How `forge-batch --start <scope>` starts ready Issues and continues the scope each time it runs again. Each run reads the scope from GitHub, starts what is ready, prints a status table, and ends: there is no wait loop. Batch never merges; forge-land stays the only skill that does.

## Classify

List the scope with closed Issues too (`--state all` in *List Issues by Scope* of [issue-operations](../_shared/issue-operations.md), and every sub-issue of an epic, not only open ones). Then put each Issue in exactly one state, first match wins:

| State | When | Detail |
|-------|------|--------|
| **merged** | closed and met, per *Prerequisites* in [open-work](../_shared/open-work.md) | its closing PR |
| **excluded** | closed otherwise, HITL, or labeled `blocked` | the reason, in `### Excluded` as today |
| **in flight** | an open PR is for it, per *Open PRs* in open-work, or a start comment (below) and no PR yet | the PR and land's verdict from its `## Risk` section (`gh pr view <n> --json body,headRefOid`), stale when not judged on the head; or `started <date>, no PR yet` |
| **waiting** | a prerequisite is unmet, or its touch set conflicts (*Conflict* in open-work) with an in-flight Issue's: an open PR's `files`, or the touch set of one started without a PR | what it waits on: `#<n>`, or `PR #<n> (<shared file or resource>)` |
| **ready** | everything else | `started` or `launch line` |

Estimate touch sets (Step 2) for in-flight Issues without a PR too, so later Issues can wait on them.

Walk the ready Issues in Wave order (priority label, then number). An Issue that conflicts with one already started this run waits on it. Stop starting once the Issues in flight reach the Wave cap; the rest wait on `the cap`.

## Start

Start each ready Issue as its own session in its own isolated checkout, running:

```text
/forge-ship --guard <n> -- Touch set: <paths>. Adjacent: #<n> (<shared directory>), or none. Serialized resources: <the ones its touch set names>, or none; touch no others.
```

Use the runtime's start-a-session capability when it has one: a separate session the user can open, not a sub-agent of this one, which would hold this run open until the ship ends. After each start succeeds, comment on the Issue:

```bash
gh issue comment <n> --body "forge-batch started this Issue: /forge-ship --guard <n>"
```

That comment is how the next run knows the Issue is in flight before its PR exists, so it never starts twice. To start it again, delete the comment.

When the runtime has no such capability, or refuses a start, print the launch line instead (`$FORGE_LAUNCHER` and the numbers, or the numbers alone) and post no comment. The Issue stays ready, so the next run prints it again.

In attended mode, confirm the run's starts once before the first. A re-run no person can answer is unattended.

## Continue

End the run after printing. The next one comes from the runtime waking this session when a started session ends, the user re-running it, or a scheduler such as `/loop`; run `--start` on the same scope again. States come from GitHub, never from what a child session says.

The scope is **done** when every Issue is merged or excluded. It **waits on you** when a run has nothing to start and every in-flight PR carries land's verdict on its head; otherwise it is **continuing**.

## Output

Print this before the Waves, which stay the plan for Issues not yet in flight:

```text
## Batch: <scope>

### Status
| # | Title | State | Detail |
|---|-------|-------|--------|
| 120 | feat(api): ... | merged | PR #398 |
| 121 | feat(api): ... | in flight | PR #401, merge-ready (low risk, judged on head) |
| 122 | fix(ui): ... | in flight | started 2026-10-31, no PR yet |
| 123 | feat(api): ... | ready | started |
| 124 | fix(ui): ... | ready | launch line |
| 125 | feat(ui): ... | waiting | PR #401 (src/ui/y.tsx) |
| 126 | feat(api): ... | waiting | #123 |

launch: <launcher> 124

**Merge:** #401 (land judged it low risk; batch never merges)
**Scope:** continuing: 3 in flight, 2 waiting | waits on you | done
```

Omit the launch line when every ready Issue started, and **Merge:** when no PR is merge-ready.
