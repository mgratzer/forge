# Verify Before Assume

When using an API you haven't called in this session, verify it exists before writing code against it. Agents guess APIs based on training data — the guess is usually right, but when wrong, the debugging is uniquely expensive.

## Verification discipline

Before using any unfamiliar method, flag, endpoint, or type:

- [ ] **Check the codebase** — `grep -rn "<method-or-flag>" src/`. Existing usage is the strongest evidence.
- [ ] **Check source or docs** — for libraries: read type definitions (`grep -rn "<method>" node_modules/<pkg>/`). For CLI: `<tool> --help`. For HTTP APIs: probe the endpoint.
- [ ] **Check the version** — verify the API exists at the project's pinned version, not just the latest release.

## When verification isn't needed

- **Standard library** — language builtins are stable enough (`Array.map`, `os.path.join`)
- **Already used in this codebase** — if you've seen it called, it exists
- **Already verified this session** — one check per API per session is enough
- **Type-checked interfaces** — the type checker catches nonexistent methods (still verify CLI flags, HTTP endpoints, untyped code)

## Common failure modes

- **Confident usage of a plausible flag** — `gh issue create --parent 42` looks right but the flag doesn't exist in the installed version
- **Version-shifted method names** — `client.query()` was renamed to `client.execute()` between versions
- **Interpolated convenience methods** — agent assumes `findOrCreate()` exists because similar ORMs have it
