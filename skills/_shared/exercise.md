# Exercise the Change

Tests prove the code does what the tests say. Running the app and using the changed path once, the way a user or client would, finds what the tests don't cover yet, and the evidence in the PR is what lets a reviewer skip checking out a small PR.

## When

Exercise when the diff changes runtime behavior, not only docs, tests, CI configuration, or comments. Otherwise report `not exercised: no runtime change`.

Find the recipe, first match wins:

1. The runtime's skill for running the app (Claude Code: `/run`)
2. Run commands in `AGENTS.md` or the docs it points to (start, a way to drive it, test credentials, stop)

With neither, report `not exercised: no way to run the app`. Never guess how to start the app.

## How

1. **Human actions first.** When the recipe needs something only a human can do (a login, a running service, a key in `.env`), ask for it in attended mode. In unattended mode, skip that part and list it on the report's `Not exercised` line as `needs <action>`; the parts that ran still decide the outcome.
2. **Start** the app per the recipe, in the background, and wait for readiness in one bounded shell loop.
3. **Drive the changed path** once: the request, command, or screen the change is about. Check one thing the tests can't easily show, such as what is actually stored, what the client receives, or what stayed unchanged.
4. **Drive one failure case** where the change has one: invalid input, an unauthorized caller, another tenant's data.
5. **Stop** everything you started.

A run that didn't reach the changed path is not evidence, whatever it printed.

## Outcomes

- **Intended:** write the report.
- **Wrong** (observed differs from expected): fix it with a test that fails without the fix, run the quality gates, commit, and exercise once more. Still wrong: ask the human in attended mode; in unattended mode, report the mismatch as `wrong: <observed> vs <expected>` so review sees it.
- **Can't start** (the recipe fails before reaching the changed path): report `not exercised: <why>`.

## Report

The PR body's `## Exercised` section:

```markdown
## Exercised

- `<command>` → <observed result>
- Failure case: `<command>` → <observed result>
- Not exercised: <what, and why> (or "nothing")
- Try it: `<commands a reviewer can paste>`
```

One line per thing exercised, the command and what was observed, no logs. Use the recipe's test credentials; never put a real secret into the report. When nothing ran, the section is the single `not exercised: <why>` line.
