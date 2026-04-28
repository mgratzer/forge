# Vertical Phases

How to sequence the implementation of an Issue into phases that ship verifiable progress, not layered scaffolding.

## What a phase is

A phase is one implementation chunk inside a single Issue. Each phase touches every layer the chunk needs (data, logic, UI, tests) and ends with a *verification step* — something the agent can run to confirm the phase actually works.

A phase is to an Issue what a vertical slice is to a feature: the same vertical principle, applied at smaller scale. Slicing decides what becomes its own Issue; phasing decides how to sequence work *within* one Issue without pretending it's all one atomic move.

The Pragmatic Programmer calls these "tracer bullets" — each phase is a thin shot through every layer that makes its trajectory visible. Without tracer bullets, the implementer is firing into the dark and finding out at the end whether the bullets were going where intended.

## Why phases instead of "just implement it"

1. **Mid-implementation verification.** Each phase is verifiable in isolation. If phase 3 breaks, you know phases 1 and 2 still work — the bug came in with the most recent slice. Without phases, the only verification is the final run, and bisecting failures takes far longer.
2. **Commit boundaries that match logical boundaries.** A phase is a natural commit unit. Without phases, commits cluster by file modification time, which is a poor proxy for what actually changed semantically.
3. **Recovery from interruption.** If a session ends partway through, the agent (or the human) can pick up at the next phase boundary instead of trying to reconstruct "where was I."
4. **Pressure against horizontal sequencing.** Without phases, the natural drift is to do all the data layer first, then all the API, then all the UI — the opposite of what produces verifiable progress.

## How to identify phases

For each Issue, ask: *what is the smallest end-to-end chunk that proves the next chunk's foundation works?*

Phase 1 is usually the **happy path with no edge cases** — the simplest possible scenario that touches every layer. Phase 2 adds *one* axis of complexity: more cases, more inputs, more error paths. Phase 3 adds another axis. The order is the dependency order — what must work before the next layer of complexity can be added.

Each phase should:

- Touch **all layers** the phase needs (no "just the backend for now")
- Include a **verification step** that produces a pass/fail signal (a test passing, a curl returning the expected response, a UI flow completing)
- Take **one PR-sized increment** — if a phase has more than ~5 acceptance items, it's probably two phases

## Common failure modes

**Agents default to horizontal sequencing.** Without explicit guidance, an agent will plan "Phase 1: schema. Phase 2: service layer. Phase 3: API. Phase 4: UI." That's the path of least resistance — each phase is internally coherent and the dependency graph is obvious. It's also the path that produces the worst feedback signal, because nothing user-visible exists until phase 4 and integration bugs all surface at once. Vertical phasing is *deliberately fighting* the agent's default. Expect to rewrite the first attempt at a phase plan.

**Layered phases disguised as vertical.** "Phase 1: data model. Phase 2: API. Phase 3: UI." This is horizontal sequencing renamed. Fix: rewrite each phase so it spans all three layers for *one* scenario.

**Phases without verification.** "Phase 2: implement filter logic." How does the agent know phase 2 is done? Add: "Phase 2 verification: filter test returns expected rows for the seed dataset." If you can't write a verification step, you don't know what "done" means.

**The implicit "wire it up later" phase.** Phases 1–3 build components, phase 4 wires them together, and most of the bugs surface in phase 4. Better: each component phase ends with that component wired into a flow that already exists. Wiring isn't a phase; it's part of every phase.

**Phases too thick to verify.** A phase that touches 12 files and adds 600 lines is probably 2–3 phases pretending to be one. Verification gets weaker as scope expands.

**Decisions hiding in phase text.** "Phase 2: add caching." Cached how? Where? With what invalidation? Decisions should already be captured as durable architectural decisions before phases are listed; if a phase reads as "and figure out X," X is a decision that needs to surface.

**Phase ordering by file rather than by behavior.** Ordering phases as "first the files that already exist, then new files" is a code-organization heuristic, not a behavior heuristic. Phases should order by what *can be verified* given what's been built so far.

## Examples

**Issue**: Add a search bar to the settings page.

Vertical phases:

1. **Search bar UI renders, types into local state, no actual search.** Verifies: typing produces a controlled-input echo. Touches: UI only, but goes end-to-end on the UI side.
2. **Search filters the visible items in memory using current state.** Verifies: typing "dark" hides items not matching "dark". Touches: UI logic. No backend.
3. **Search hits a real backend endpoint, debounced.** Verifies: integration test against a seeded dataset returns expected matches. Touches: client + server + tests.
4. **Search handles the empty-state and error-state UI.** Verifies: zero-results and error-response screens render correctly. Touches: UI edge cases.

Note that no phase ships *only* a layer — every phase has a user-visible verification.

Layered phases (avoid):

1. ~~Backend search endpoint~~ — verifiable only via curl, no UI proves anything.
2. ~~Search bar UI component~~ — types but doesn't search; meaningless without phase 1.
3. ~~Wire them together~~ — where all the bugs surface, with no isolated rollback.

## Decision

When laying out phases in Step 2's plan, the question is not *"what are the layers I need to build?"* — it's *"what's the smallest end-to-end increment that proves what comes next?"* The first question yields layered scaffolding; the second yields verifiable phases.
