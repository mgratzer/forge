# Vertical Slicing

Split work into thin end-to-end paths through every layer — data, logic, UI, tests — for one narrow scenario. Each slice is independently shippable, testable, and demoable.

## How to identify boundaries

Ask: *what is the smallest scenario that touches every layer?*

- One specific case, not the whole feature
- One persona, not all personas
- One data path, not all data paths

After the first slice, extend in one direction per slice: more cases, more personas, more error handling.

## Checklist

- [ ] Each slice goes end-to-end (not "just the backend")
- [ ] Each slice is shippable and verifiable in isolation
- [ ] Slices are thin enough for one PR (~1-2 days of agent work)
- [ ] Dependencies between slices are explicit and ordered

## Common failure modes

- **Horizontal in disguise** — "set up database schema" ships nothing user-visible
- **Shared infrastructure** — if two slices both need "add auth middleware", extract it as a pre-slice
- **Slices too thick** — 6 acceptance criteria + 4 services = split again
- **No actual end-to-end** — data layer + "UI later" = two horizontal slices renamed

## Example

**Feature**: dark mode toggle.

1. Toggle renders, persists in localStorage, applies theme to one component.
2. Toggle syncs to user record on backend.
3. All components respect the theme variable.

Each slice is independently shippable. Compare to avoid: ~~schema~~ → ~~theme system~~ → ~~settings UI~~.
