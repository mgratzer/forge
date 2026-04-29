# Deep Modules

How to design modules whose interfaces are simpler than their implementations — and why this matters more when an AI is writing the code.

## The principle

A *deep module* hides significant complexity behind a simple interface. A *shallow module* exposes an interface nearly as complex as its implementation. The depth of a module is the ratio of complexity it hides to the complexity it exposes. Deeper is better.

This is John Ousterhout's central claim in *A Philosophy of Software Design*: the purpose of a module boundary is to hide complexity. A boundary that hides nothing — a function whose signature tells you everything the body does — is a net cost: the caller must understand the interface *and* the implementation, and the module boundary is just ceremony between the two.

## Why deep modules matter more for AI

When an agent implements code, it generates *plausible* structures. Plausible structures tend to be shallow: one function per concept, each doing one small thing, interfaces that mirror internals. The result compiles, passes lint, and distributes complexity across many modules without actually hiding any of it.

The cost surfaces when the next agent (or human) works on the code. Shallow modules force callers to understand internals to use them correctly. Deep modules let callers stay ignorant of internals — and ignorance is the entire point of abstraction.

An agent designing interfaces should ask: *what can the caller not know?* The more the caller can ignore, the deeper the module.

## Delegate implementation, design interfaces

When working with an AI agent, spend design effort on **interfaces**, not implementations. The agent is good at filling in implementation details once the interface shape is right. It is bad at choosing interface shapes — it defaults to mirroring the internal structure, which produces shallow modules.

In practice:
- **Define the interface first** — function signature, type shape, API contract — before asking the agent to implement the body
- **Evaluate the interface in isolation** — can a caller use this without reading the implementation? If not, the interface is too shallow
- **Let the agent fill in the body** — implementation is where the agent excels; interface design is where it needs guidance

## The testability argument

Deep modules have natural test boundaries. The interface is the contract; tests exercise the contract. When the interface is simple, tests are simple. When the implementation changes behind the interface, tests don't break — because they never depended on the implementation.

Shallow modules invert this. Tests must know about internals to exercise the module meaningfully, which means tests break when internals change. The module boundary provides no stability, so the tests provide no safety net.

If testing a module requires mocking its internals, the module is too shallow — its interface doesn't hide enough to test against.

## Module-shape audit

When designing or reviewing module boundaries, check:

1. **Interface-to-implementation ratio** — is the interface simpler than what it hides? A function with five parameters that calls one library method is shallow. A function with two parameters that orchestrates three subsystems is deep.
2. **Caller knowledge** — can a caller use this module correctly *without reading the source*? If the caller must know the implementation order, internal state transitions, or which errors to retry, the interface is leaking.
3. **Change propagation** — if the implementation changes, do callers need to change? Deep modules absorb change; shallow modules propagate it.
4. **Test shape** — do tests exercise the interface or the internals? Interface-level tests indicate a deep module; tests that mock internals or assert on private state indicate a shallow one.
5. **Pass-through methods** — methods that add no logic, just forward to another module, are a sign of shallow layering. Each layer should *transform*, not *relay*.

## Common failure modes

**One function per concept.** A module with 15 public functions each doing one small thing is shallow by construction — the caller must compose them, understanding the order and dependencies. Fewer, deeper public functions that compose internally are almost always better.

**Wrapper modules that add nothing.** A class that wraps a library, exposing the same methods with the same signatures, is pure ceremony. Wrappers earn their existence by simplifying the interface — fewer methods, fewer parameters, domain-specific defaults.

**Information leakage between modules.** Two modules that must change together because they share knowledge of the same internal format are a single module split in two. The fix is to consolidate the shared knowledge behind one interface, not to document the coupling.

**Confusing depth with size.** A deep module is not necessarily a large module. A 20-line function can be deep if it hides a non-obvious algorithm behind a two-parameter interface. A 500-line class can be shallow if every method is a pass-through.

## When this doesn't apply

- **Glue code and orchestrators** — top-level wiring that connects deep modules is inherently shallow, and that's fine. Not every layer needs to be deep; the modules it connects do.
- **Data transfer objects** — DTOs and simple value types have no implementation to hide. Their purpose is to be transparent, not deep.
- **Early exploration** — during spikes and prototypes, shallow structure is acceptable because the interface hasn't stabilized. Deepen during the refactor pass, not before the shape is known.

## Decision

When designing module boundaries in Step 2's plan, the question is not *"what are the concepts I need to represent?"* — it's *"what complexity can I hide behind a simple interface?"* The first question produces shallow modules that mirror the problem's structure. The second produces deep modules that absorb the problem's complexity, leaving callers with less to know and tests with more stability.
