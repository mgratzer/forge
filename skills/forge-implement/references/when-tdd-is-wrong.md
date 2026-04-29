# When TDD Is the Wrong Tool

TDD is a discipline for *specifiable, verifiable behavior*. Some work is neither.

## The principle

TDD's value comes from a test that captures the intended behavior before the code exists. That requires being able to articulate the behavior as a verifiable claim. When the work does not admit verifiable claims — because the success criterion is judgment-based, exploratory, or visual — TDD's value evaporates and its cost remains.

Forcing TDD onto unsuitable work produces tests that do not actually constrain anything (judgment dressed up as assertions) or block the iteration the work needs (each red phase becomes a planning session for code that is going to be thrown away).

## When to skip TDD

**UI and visual work.** "Does the layout look right" is not a property a test can assert. Snapshot tests can catch unintended changes, but they cannot define what the layout *should* be. Use design review, manual verification, and visual regression tools instead. Add tests for the parts of the UI that *are* behavior — state transitions, event handlers, conditional rendering — but not for the visual surface itself.

**Exploratory prototypes.** A prototype's purpose is to discover whether an idea works at all. Tests written for code that will be rewritten provide negative value: they slow the iteration, they encode decisions that are about to be discarded, and they give false confidence that the prototype is "tested." Time-box the prototype, treat all of it as throwaway, and write tests when the design stabilizes.

**Spikes.** Same logic as prototypes, but shorter. A spike answers a single question — *is this technique viable?* — and gets thrown away regardless of the answer. Tests during a spike measure the wrong thing.

**Migrations of well-tested code.** If the source code already has a strong test suite and the migration preserves behavior, the existing tests *are* the verification. Writing new TDD-style tests for the migrated version duplicates effort and may diverge from the source's behavior in subtle ways. Run the existing tests against the new code; only add tests for behaviors the migration introduces.

**One-shot scripts and operational glue.** A script run once to migrate data, generate a report, or unblock a deployment is verified by inspecting its output. Writing tests for code that runs once and is deleted is theatre.

## When TDD looks wrong but is not

**"The behavior is too complex to test up front."** Usually a sign the behavior should be split into smaller pieces, not that TDD does not apply. The test for the smallest piece is writable; the rest is composition.

**"I do not know what the API will look like yet."** TDD is *how* you find out. Writing the test first forces a decision about the interface before the implementation can lock it in. "I do not know yet" usually means "I have not tried writing a test yet."

**"The library does not support unit testing this."** Sometimes true; usually a tooling gap that gets fixed by writing one helper. Verify the gap is real before invoking it as the reason to skip TDD.

**"It is just configuration."** Configuration with branching logic is code, and the branching logic is testable. Configuration that is purely declarative may not need a test of its own — but the consumer that reads it does.

## Common failure modes

**Forcing TDD where it does not fit.** Writing snapshot tests that lock in the visual quirks of an in-flux design. Writing unit tests against prototype code that gets deleted next week. Both produce tests that constrain nothing useful.

**Abandoning TDD too easily.** "This is exploratory" gets stretched to cover work that has clear behavior the moment you look at it. The honest test: *can I write a test that would fail today and pass after I implement what I am about to implement?* If yes, the work is not exploratory; it is testable behavior.

**Confusing visual work with all UI.** A button's click handler has behavior that TDD applies to. A button's color and padding do not. The same component has both surfaces; treat them differently.

**Treating a spike's output as production code.** A spike that succeeds gets reused, the planned rewrite never happens, and the untested spike code is now load-bearing. If the spike's code is going to ship, that is the moment to start writing tests against it — not later.

## Decision

TDD applies when behavior can be specified as a verifiable claim. When it cannot — UI surface, exploration, throwaway code — use the verification mode appropriate to the work and do not dress it up as testing. The cost of forcing TDD onto unsuitable work is iteration friction; the cost of skipping it on suitable work is rationalized tests. Choose with intent.
