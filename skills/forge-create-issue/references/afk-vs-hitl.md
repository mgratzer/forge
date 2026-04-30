# AFK vs HITL

Classify whether an Issue can be implemented autonomously (AFK) or requires human judgment during execution (HITL).

## The core test

> *If the human disappears the moment the agent picks up this Issue, where does it get stuck?*

**AFK** = "nowhere — finishes, opens PR, waits for review."
**HITL** = "stalls at decision X because X depends on context the Issue doesn't capture."

## AFK requirements

All must hold:
- [ ] Acceptance criteria are testable (commands, outputs, flows — not "does this feel right?")
- [ ] Chosen approach is in the Issue (not just the problem)
- [ ] Scope is contained (no "and any related issues you find")
- [ ] No external blockers
- [ ] Test coverage exists or the Issue says how to add it

## HITL signals

- Architectural decision still open
- Tradeoff between user-visible alternatives (taste, not technical)
- External coordination needed
- Missing source of truth (copy, design)
- Compliance/legal/security sign-off required mid-flight
- Refactor with no test coverage

## Common mis-classifications

- **"It's small, so AFK"** — smallness ≠ specifiability. Two-line change with hidden ambiguity is HITL.
- **"The implementer can decide"** — sometimes true for taste-neutral choices; false for "break the public API?"
- **"We'll figure it out as we go"** — this is HITL with a friendlier name.

## Mode lock-in

Classification is set at creation. If an AFK Issue surfaces ambiguity mid-flight: pause, resolve, update the Issue. A silently-HITL implementation mixes agent work with ad-hoc human decisions and destroys the audit trail.
