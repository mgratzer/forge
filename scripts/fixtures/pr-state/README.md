# pr-state fixtures

Each directory here is one case for `scripts/test-pr-state.sh`, which runs `skills/_shared/scripts/pr-state.sh` against it with stand-ins for `gh`, `sleep` and `date`: no network, no waiting. `scripts/check-skills.sh` runs that test.

A case directory holds:

| File | Meaning |
|------|---------|
| `cmd` | the arguments to `pr-state.sh`, split on whitespace |
| `out` | the expected stdout (absent: empty) |
| `status` | the expected exit status (absent: 0) |
| `calls` | optional `<key> <count>` lines: how often `gh` answered `<key>` |
| `clock` | optional start time in epoch seconds (default 1793890000) |
| `<key>[.<n>].json` | `gh`'s answer to the call named `<key>`, for its nth call or any |
| `<key>[.<n>].err` | or its error message (`gh` then exits 1) |

`<key>` is `gh`'s first two arguments and its `--json` fields, such as `pr.view.number,url`. A key missing from a case is read from `_default/`. The `gh` stand-in applies `--jq` with `jq -rcS`, since `gh`'s own jq prints sorted keys.
