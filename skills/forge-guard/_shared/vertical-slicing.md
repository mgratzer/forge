# Vertical Slicing

Split work into thin end-to-end paths through every layer for one narrow scenario. Each slice is independently shippable, testable, and verifiable.

## Identifying slices

Ask: *what is the smallest scenario that touches every layer?*

- One specific case, not the whole feature
- One persona, not all personas
- One data path, not all data paths

After the first slice, extend in one direction per slice: more cases, more personas, more error handling.

## Sequencing phases within a slice

Phase 1: **happy path with no edge cases** — simplest scenario touching every layer.
Phase 2+: add **one axis of complexity** each (more cases, error paths, edge cases).

Each phase must:
- [ ] Touch **all layers** the phase needs (no "just the backend for now")
- [ ] Include a **verification step** — test passing, curl returning expected response, UI flow completing
- [ ] Be **one PR-sized increment** — more than ~5 acceptance items = probably two phases
- [ ] **Dependencies between slices are explicit and ordered** — don't discover ordering during implementation

## Common failure modes

- **Horizontal sequencing** — "Phase 1: schema. Phase 2: service. Phase 3: UI." Nothing user-visible until the last phase; integration bugs surface at once.
- **Layered phases disguised as vertical** — "Phase 1: data model. Phase 2: API." Still horizontal, just renamed.
- **Phases without verification** — "implement filter logic" with no pass/fail signal. If you can't write a verification step, you don't know what "done" means.
- **Shared infrastructure** — if two slices both need "add auth middleware", extract it as a pre-slice.
- **Slices too thick** — 6 acceptance criteria + 4 services = split again.

## Example

**Feature**: dark mode toggle.

1. **Toggle renders, persists in localStorage, applies theme to one component.** Verify: toggling applies theme.
2. **Toggle syncs to user record on backend.** Verify: round-trip persists.
3. **All components respect the theme variable.** Verify: full theme coverage.

Each slice is independently shippable. Compare to avoid: ~~schema~~ → ~~theme system~~ → ~~settings UI~~.
