# PR Body

The body `forge-implement` writes when it opens a PR. A reviewer should learn why the change exists and what shape it has without opening the diff; `forge-land` reads its deployment steps and its `## Exercised` and `## Plan` sections, and appends `## Risk`.

## Format

````markdown
<One sentence: the problem this solves and what becomes possible.>

> [!WARNING]
> <Manual deployment steps, only when there are any; see Deployment Steps below.>

**Notes**
- <1-3 reviewer warnings, deliberate omissions, or surprising decisions; omit the block when there are none>

**Change outline**

<short text>

```diff
<one view>
```

## Exercised

<from exercise.md>

## Plan

<details><summary>Plan <provenance, see Plan below></summary>

<the Plan from forge-implement Step 2, verbatim>

</details>

**Revisions** (only when revised)
- <what changed>: asked by <who>, <why>

**Deviations** (as of <short SHA of the commit the PR opens with>): none
<or one line per Deviation: `- <what changed from the Plan>: <why>`>

Closes #<N>
````

## Change Outline

Show the shape of the change, not a changelog. Pick the smallest set of views that explains it, tell them in the order that makes the change easiest to follow, and put a short line of text before each:

| View | Use for |
|------|---------|
| File tree | Which files own what; a shallow `tree`-style listing with a note per changed file |
| Call tree | How control flows through the changed path, important calls only |
| Contract | Endpoint shapes, schemas, message formats, public signatures |
| Pseudocode | Changed logic, in plain words rather than code |

Use `diff` blocks (`+` added, `-` removed, a space for unchanged context) when the shape already exists, and show the full target shape when most of it is new. Leave out views that would only repeat the diff.

```diff
 src/
 ├── notes/
 │   ├── store.ts        # changed: writes go through validate()
+│   └── validate.ts     # rejects empty titles
 └── routes.ts
```

## Deployment Steps

Steps someone runs against a live system after merge (a config to apply, a key to set, a service to restart) reach production without the tests or the review that guarded the diff. Write them so they hold against what is running:

- **Start from the target, not the branch.** Read what the target is running (its deployed config, its containers, which variables are set) and say what you read, naming variables but never copying a value or a secret; when you can't read it, say so and make reading it the first step. The default branch may hold changes the target never got, and steps derived from it apply those too.
- **List every difference** between what the target runs and what the PR assumes, including ones this PR didn't cause. When you couldn't read the target, list what the steps assume it runs instead, so the operator checks each assumption after the first step and stops on a mismatch.
- **Give each step its rollback**, checked against the same state.
- **No placeholders.** Name each value as `$VAR`, set by an `export VAR=...` line before the steps, so every command runs as pasted; a `<placeholder>` breaks in the shell. A value you can't know gets a command that fetches it from its source, or an empty `export VAR=` the operator fills in.

Number the steps. They stay inside the `[!WARNING]` block: every line, fenced code included, starts with `> `.

`forge-land` sends any PR with deployment steps to review.

## Plan

Copy the Plan verbatim and never rewrite it to match the code: `forge-land` compares it with the diff the PR opened with. List each Deviation (see CONTEXT.md) with its reason; an unstated one sends the PR to review.

The summary names who stood behind the Plan, so the PR never claims an approval nobody gave:

- `Plan approved` — a person confirmed it.
- `Plan as first made (no approver: <why>)` — the run was unattended; say whether by `--unattended` or because no person could answer. When it implements a HITL Issue (an Issue with no recorded execution mode counts as HITL), add a **Notes** bullet `Judgment calls (HITL Issue, run unattended):` listing each decision the Issue left to a person and what you chose.
- `Plan approved, then revised` — a person changed the Plan after approving it. List each revision under **Revisions** with who asked; `forge-land` compares the diff with the Plan plus its Revisions, so a recorded revision is not a Deviation. Only a person revises a Plan: a change the run made on its own, attended or not, is a Deviation.

No section of the body uses a `## ` heading inside it: a `## ` line ends the section for `forge-land` and the lens.
