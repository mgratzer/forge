# When TDD Is the Wrong Tool

TDD applies to *specifiable, verifiable behavior*. When success is judgment-based, exploratory, or visual, TDD's cost remains but its value evaporates.

## Skip TDD for

- **UI/visual work** — "does it look right" isn't assertable. Test state transitions and event handlers; not colors and layout.
- **Exploratory prototypes** — throwaway code. Tests encode decisions about to be discarded. Write tests when the design stabilizes.
- **Spikes** — answers a single viability question; gets thrown away regardless.
- **Migrations of well-tested code** — existing tests *are* the verification. Only add tests for new behaviors the migration introduces.
- **One-shot scripts** — verified by inspecting output. Testing code that runs once is theatre.

## TDD looks wrong but isn't

- **"Too complex to test up front"** — split into smaller pieces; test the smallest
- **"Don't know the API yet"** — TDD is *how* you find out; the test forces an interface decision
- **"Library doesn't support testing"** — verify the gap is real before invoking it
- **"Just configuration"** — declarative config may not need tests, but branching config logic does
