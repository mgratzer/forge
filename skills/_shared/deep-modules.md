# Deep Modules

Design modules whose interfaces are simpler than their implementations. A deep module hides significant complexity behind a simple interface; a shallow module exposes an interface nearly as complex as its implementation.

Agents default to shallow modules — one function per concept, interfaces mirroring internals. The cost surfaces when the next reader must understand internals to use the module correctly.

## Module-shape checklist

- [ ] **Interface simpler than implementation?** — a function with 5 params calling one library method is shallow; 2 params orchestrating 3 subsystems is deep
- [ ] **Caller ignorance** — can a caller use this without reading the source?
- [ ] **Change absorption** — if the implementation changes, do callers need to change?
- [ ] **Test shape** — tests exercise the interface, not internals? Interface-level tests = deep; tests mocking internals = shallow
- [ ] **No pass-through methods** — methods that relay without transforming indicate shallow layering

## Design guidance

- **Define interface first** — function signature, type shape, API contract — before implementing
- **Evaluate interface in isolation** — can a caller use this without reading the body?
- **Let the agent fill in the body** — implementation is where agents excel; interface design is where they need guidance

## When depth doesn't apply

- **Glue code and orchestrators** — top-level wiring is inherently shallow; the modules it connects should be deep
- **Data transfer objects** — DTOs are meant to be transparent
- **Early exploration** — during spikes, shallow is fine; deepen when the interface stabilizes
