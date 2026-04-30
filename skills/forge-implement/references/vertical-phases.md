# Vertical Phases

Sequence implementation into phases that ship verifiable end-to-end progress, not layered scaffolding. Each phase touches every layer the chunk needs and ends with a verification step.

## How to identify phases

Ask: *what is the smallest end-to-end chunk that proves the next chunk's foundation works?*

- Phase 1: **happy path with no edge cases** — simplest scenario touching every layer
- Phase 2+: add **one axis of complexity** each (more cases, error paths, edge cases)

Each phase must:
- [ ] Touch **all layers** the phase needs (no "just the backend for now")
- [ ] Include a **verification step** — test passing, curl returning expected response, UI flow completing
- [ ] Take **one PR-sized increment** — more than ~5 acceptance items = probably two phases

## Common failure modes

- **Horizontal sequencing** — "Phase 1: schema. Phase 2: service. Phase 3: UI." Nothing user-visible until the last phase; integration bugs all surface at once.
- **Layered phases disguised as vertical** — "Phase 1: data model. Phase 2: API." — still horizontal, just renamed.
- **Phases without verification** — "implement filter logic" with no pass/fail signal. If you can't write a verification step, you don't know what "done" means.
- **Implicit "wire it up later"** — phases 1–3 build components, phase 4 wires them. Wiring isn't a phase; it's part of every phase.
- **Decisions hiding in phase text** — "add caching" without specifying how/where. Decisions belong in the plan, not discovered during phasing.

## Example

**Issue**: Add search bar to settings page.

1. **Search bar renders, types into local state.** Verify: typing produces echo.
2. **Search filters visible items in memory.** Verify: typing "dark" hides non-matches.
3. **Search hits backend endpoint, debounced.** Verify: integration test returns expected matches.
4. **Empty-state and error-state UI.** Verify: edge cases render correctly.

Each phase has user-visible verification — no phase ships only a layer.
