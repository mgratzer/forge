# Deep Modules

Design modules whose interfaces are simpler than their implementations, and give each decision one home: a deep module hides significant complexity behind a simple interface, and a decision written in two places drifts.

## Design block

A Plan or an Issue that adds a module, an exported function, or another variant of something that exists (a third workflow, a second renderer) states these lines; any other writes `Design: no new module or variant`.

- **Interface** — what a caller sees (signature, type shape, API contract), written before the implementation
- **Hides** — the decision or complexity that stays inside
- **Already lives** — every place that makes this decision or runs this sequence today, searched by the calls it makes and not only by name, each with a choice: `extend`, `replace` (the old one goes in this change), or `copy` with the reason the two must differ; `nowhere` when there is none
- **Leaves behind** — for a `replace` only: what exists only because of the old one (a recovery job, a retry, a flag or column, a second copy of a check, a compatibility branch, a config key, its tests, its words in docs). Each goes in this change, or is named with the open Issue that removes it

An export, parameter, option or injection point that exists only so a test can reach code, or that only a test sets, is a **test seam**.

## When depth doesn't apply

- **Glue code and orchestrators** — top-level wiring is inherently shallow; the modules it connects should be deep
- **Data transfer objects** — DTOs are meant to be transparent
- **Early exploration** — during spikes, shallow is fine; deepen when the interface stabilizes
