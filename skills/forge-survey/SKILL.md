---
name: forge-survey
description: "Survey a codebase's design in fresh context and record the findings in the repository in a stable format: each with its class, evidence, remedy, and the rule or check that let it through. Asks the user which findings to file as Issues (no unattended mode). Use when the user or an orchestrating agent asks for forge-survey or a periodic architecture review, not to review one change; use forge-reflect for a diff."
---

# Survey the Codebase

Review the design of the codebase rather than a diff: find what no single change shows, and say which rule or check let each finding through.

## Input

Optional scope (`$ARGUMENTS`): paths or areas; the whole repository by default. Optional: `-- <additional context>` for focus guidance.

## Process

### Step 1: Read What Is Known

Read `AGENTS.md` and what its quality gate runs, `CONTEXT.md` and the decision records when the project has them, and every earlier survey in `docs/surveys/`. Search the open Issues per [issue-operations](_shared/issue-operations.md), so a known problem is not found again. Keep the earlier findings whose status is `open`.

### Step 2: Survey the Areas (delegate)

Split the scope into three to six areas a reviewer can read whole, by app or top-level module, and delegate each to a fresh-context sub-agent. One more sub-agent reads across them: which modules import each other, and which files change together (`git log --name-only`). If the runtime has no sub-agents, run the same passes one after another.

> You are surveying one area of a codebase for design problems no single diff shows. Read the code, not only its names. Report a candidate only when you can show it: its class from the table below, every place it lives as `file:line`, what a typical change costs today because of it, and the simplest remedy. Name the modules that are deep and should be left alone. Report a suspected bug separately, as read in code and not reproduced. Do not report style, naming preferences, or anything the project's linters already report, and do not propose rewrites.

| Class | Looks like |
|-------|------------|
| Duplicated decision | One rule, sequence, list or table written in more than one place, also across languages or stacks |
| Dependency direction | Modules that import each other, a low layer importing a high one, a cycle managed by convention |
| Wide surface | Exports, methods, options or parameters with one caller or none; an interface as complex as its implementation |
| Test-shaped code | An export, parameter or option only tests use; tests that replace the project's own modules; two suites testing one thing |
| Pass-through | A layer that relays without deciding; a field or result nothing reads |
| Superseded mechanism | Live, called code that compensates for something a replacement removed: a recovery job, a second check, a compatibility flag |
| Stale text | A comment, doc or spec that restates code, narrates history, or names something that no longer exists |
| Dead weight | Finished one-off scripts, experiments, configuration nothing reads |

**Inputs provided to each sub-agent:** the instructions and table above, its area's paths, the project conventions that bear on it.
**Expected output:** candidates with class, places, cost and remedy; deep modules; suspected bugs.

### Step 3: Verify and Rank

Open the cited lines of every candidate yourself. Drop what you cannot confirm and what an open Issue already covers; mark one an earlier survey recorded as recurring. Rank by what leaving it costs and how often its area changes.

For each finding, name **what let it through**: the rule, review step or check that should have caught it, and whether that is `missing`, `unenforced`, or `pushes` (following the rule produces the finding).

A class that this survey and an earlier one both found gets a **guardrail**: a check or a rule change that prevents the class, rather than one more Issue per instance.

### Step 4: Record the Survey

Write `docs/surveys/<YYYY-MM-DD>.md` in the format below. Commit it from a temporary worktree on a `docs/survey-<YYYY-MM-DD>` branch cut from the fetched default branch, push, and open a PR: the record does not stay in one checkout, and this checkout keeps its branch.

### Step 5: Triage with the User

Present the findings and guardrails via AskUserQuestion: file, decline, or leave open. Create an Issue for each one filed, per [issue-operations](_shared/issue-operations.md), with its ID in the body. Write each decision into the Status column and push.

## Output Format

```markdown
# Survey <YYYY-MM-DD>

**Scope:** <paths> at <short SHA>
**Earlier surveys:** <dates, or none>

## Findings

| ID | Class | Finding | Evidence | Let through by | Remedy | Status |
|----|-------|---------|----------|----------------|--------|--------|
| <YYYY-MM-DD>-1 | <class> | <one sentence> | `<file>:<line>`, `<file>:<line>` | <rule or check>: missing, unenforced or pushes | <one sentence> | open, filed #<n>, declined: <why>, or recurs from <ID> |

## Guardrails

- <class>: <the check or rule change>, for <IDs across surveys>

## Possible bugs

- `<file>:<line>`: <what>, read in code, not reproduced

## Leave alone

- `<module>`: <what it hides>
```

## Guidelines

- **Evidence or nothing** — a finding without places is not recorded
- **A short survey is a fine result** — do not manufacture findings

## Related Skills

**Next step:** Use `forge-create-issue` for a finding that needs an approach chosen, and `forge-setup-project` to put a guardrail into the project's guidance.

## Example Usage

```
/forge-survey
/forge-survey src/billing src/quota -- look hardest at how the tests are shaped
```
