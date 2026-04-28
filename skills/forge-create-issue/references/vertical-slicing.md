# Vertical Slicing

How to split work into shippable, verifiable pieces.

## What a vertical slice is

A vertical slice is a thin path through every layer the feature touches — data, logic, UI, tests — for **one narrow scenario**. End-to-end, but minimal in scope.

A horizontal slice is the opposite: an entire layer (e.g., "the database schema for everything") with nothing on top of it. Horizontal slices ship nothing useful on their own; a vertical slice can be merged, deployed, and verified in isolation.

## Why slice vertically

1. **Each slice is independently shippable.** A feature that fails in production at slice 3 doesn't take slices 1 and 2 with it.
2. **Integration issues surface at slice 1, not slice N.** Wiring problems, type mismatches, and missing infrastructure all reveal themselves the first time you go end-to-end. Horizontal slicing hides them until the end, when fixing them is expensive.
3. **You can demo something.** A vertical slice produces a thing the user (or stakeholder) can see and react to. A horizontal slice produces an internal artifact nobody can evaluate.
4. **Testability is built in.** End-to-end verification exists from slice 1. You aren't adding tests later as an afterthought — you're constraining the slice to fit a test that already exists or one you write alongside.

## How to identify slice boundaries

For a feature, ask: *what is the smallest scenario that touches every layer this feature needs?*

- **One specific case, not the whole feature.** "Cart shows totals for one fixed-currency order with one tax rule" is a slice. "Cart totaling system" is not.
- **One persona, not all personas.** "Admin can mark an issue as resolved" is a slice. "Issue resolution workflow" is several slices.
- **One data path, not all data paths.** "Read flow for cached records" is a slice. "Caching layer" is not.

After the first slice ships, the next slice extends in *one* direction: more cases, more personas, more data paths, more error handling — pick one axis per slice.

## Common failure modes

**Horizontal slices in disguise.** "Set up the database schema for cart items" is horizontal even if you call it a vertical slice. Test: can you ship this slice and have a user see something change? If no, it's not vertical.

**Slices that share infrastructure changes.** If slice 1 requires "add the new auth middleware" and slice 2 also requires "add the new auth middleware", the middleware is its own pre-slice (or part of slice 1 with explicit acceptance) — not a shared dependency between two pretend-vertical slices.

**Slices too thick to ship.** A "thin" slice should fit in one PR an agent can complete in 1–2 days. If a slice has 6 acceptance criteria and touches 4 services, it's not thin. Split again.

**Slices that don't actually go end-to-end.** The data layer slice plus "we'll add UI later" is two horizontal slices renamed. The slice must include UI (or whatever the user-visible surface is) from day one.

**Implicit dependencies between slices.** Slice 2 should not silently require slice 1 if you didn't say so. Order issues by dependency and state the dependency in the issue body.

## Examples

**Feature**: dark mode toggle for a settings page.

Vertical slices, in order:

1. **Toggle exists, persists in localStorage, applies a theme variable to one component.** End-to-end for one component, no backend, no preference syncing.
2. **Toggle preference syncs to user record on the backend.** Builds on slice 1; adds the persistence layer.
3. **All components respect the theme variable.** Builds on slices 1–2; expands surface area without touching infrastructure.

Horizontal slices (avoid):

1. ~~Backend user-preference schema~~ — ships nothing user-visible.
2. ~~Theme variable system across all components~~ — no toggle to drive it.
3. ~~Settings UI for preferences~~ — toggle exists but does nothing.

## Decision

When splitting work, the question to ask is not *"what are the layers?"* — it's *"what's the smallest end-to-end thing I could ship and verify?"* The first question yields horizontal slices; the second yields vertical ones.
