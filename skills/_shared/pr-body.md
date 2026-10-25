# PR Body

The body `forge-implement` writes when it opens a PR. A reviewer should learn why the change exists and what shape it has without opening the diff; `forge-land` reads its `## Exercised` and `## Plan` sections and appends `## Risk`.

## Format

````markdown
<One sentence: the problem this solves and what becomes possible.>

> [!WARNING]
> <Manual deployment steps, only when there are any.>

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

<details><summary>Plan as approved</summary>

<the Plan from forge-implement Step 2, verbatim>

</details>

**Deviations:** none
<or one line per deviation: `- <what changed from the Plan>: <why>`>

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

## Plan

Copy the Plan as approved, or in unattended mode as first made. Never rewrite it to match the code: the gap between Plan and diff is what `forge-land` checks. Keep headings inside the Plan at `###` or lower, since a `## ` line ends the section.

A **Deviation** is a change outside the Plan's scope or a planned phase that didn't happen. List each one you made with its reason; an unstated deviation sends the PR to review. Changes that answer a review finding, a review thread, or a failing check are in scope and not deviations. `forge-implement` always writes `## Plan`.
