# Deep Modules

Design modules whose interfaces are simpler than their implementations, and give each decision one home: a deep module hides significant complexity behind a simple interface, and a decision written in two places drifts.

## Design block

A Plan or an Issue that adds a module, an exported function, or another variant of something that exists (a third workflow, a second renderer) states three lines; any other writes `Design: no new module or variant`.

- **Interface** — what a caller sees (signature, type shape, API contract), written before the implementation
- **Hides** — the decision or complexity that stays inside
- **Already lives** — every place that makes this decision or runs this sequence today, searched by the calls it makes and not only by name, each with a choice: `extend`, `replace` (the old one goes in this change), or `copy` with the reason the two must differ; `nowhere` when there is none

## Module-shape checklist

- [ ] **Interface simpler than implementation?** — a function with 5 params calling one library method is shallow; 2 params orchestrating 3 subsystems is deep
- [ ] **Caller ignorance** — can a caller use this without reading the source?
- [ ] **Change absorption** — if the implementation changes, do callers need to change?
- [ ] **Test shape** — tests exercise the interface, not internals. An export, parameter or injection point that exists only so a test can reach code is a **test seam**
- [ ] **No pass-through** — methods that relay without transforming, and fields or results nothing reads, indicate shallow layering

## When depth doesn't apply

- **Glue code and orchestrators** — top-level wiring is inherently shallow; the modules it connects should be deep
- **Data transfer objects** — DTOs are meant to be transparent
- **Early exploration** — during spikes, shallow is fine; deepen when the interface stabilizes
