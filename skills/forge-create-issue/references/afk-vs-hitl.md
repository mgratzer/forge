# AFK vs HITL

How to classify whether an Issue can be implemented autonomously by an agent (AFK) or requires human judgment during execution (HITL).

## Definitions

**AFK** (away-from-keyboard) — the Issue is fully specified. Every decision an implementer needs to make is either already in the Issue or discoverable from the codebase. An agent can pick this up, implement it, run quality gates, open a PR, and wait for review. The human's involvement is reviewing the PR, not steering the implementation.

**HITL** (human-in-the-loop) — the Issue requires judgment calls during implementation that can't be made from the Issue and the codebase alone. An agent picking this up will get partway through and stall on a question that needs a human to answer.

## The core test

> *If the human disappears the moment the agent picks up this Issue, where does the agent get stuck?*

If the answer is "nowhere — the agent finishes, opens a PR, the PR sits there until I review it," it's AFK.

If the answer is "the agent will stall when it hits decision X, because X depends on context the Issue doesn't capture," it's HITL.

Apply this test honestly. The instinct is to label things AFK because AFK feels lighter. Resist that instinct — a misclassified AFK Issue creates more work than an honest HITL Issue, because the agent burns a session before stalling and you have to recover.

## What makes something HITL

Common patterns that imply HITL:

- **Architectural decision still open.** "Should this be a queue or a cron job?" If the Issue doesn't pick one (and the codebase doesn't imply one), it's HITL.
- **Tradeoff between user-visible alternatives.** "Faster but uglier loading state vs. slower but smoother." Someone has to choose, and the choice is taste, not technical.
- **External coordination.** "We need to align with the mobile team on the API shape." Until that conversation happens, the implementation can't be picked.
- **Missing source of truth.** "What's the right copy for this empty state?" If the Issue doesn't have it and there's no design system to consult, it's HITL.
- **Compliance / legal / security review required.** Any change that touches PII, auth, billing, or the like, where someone other than the implementer has to sign off mid-flight.
- **Refactor with no test coverage.** The agent can't verify it didn't break anything, so each step requires a human eyeballing diff-vs-behavior.

## What makes something AFK

If all of these hold, the Issue is AFK:

- **Acceptance criteria are testable.** Each criterion can be verified by running a command, reading an output, or executing a flow — not by asking "does this feel right?"
- **The chosen approach is in the Issue.** Not just the problem; the *what to do about it*. The Implementation Constraints section is doing real work.
- **Scope is contained.** The Issue doesn't say "and any related issues you find while in there" — it says "do exactly this."
- **No external blockers.** No "waiting on X to merge their PR first." No "need feedback from Y before implementing."
- **Test coverage exists or the Issue says how to add it.** The agent can verify behavior either through existing tests or by writing the tests called for.

## Common mis-classifications

**"It's small, so it's AFK."** Smallness ≠ specifiability. A two-line change with hidden ambiguity is HITL. A 500-line refactor with crystal-clear acceptance criteria is AFK.

**"The implementer can decide."** Sometimes true (taste-neutral choices like "use the existing utility instead of writing a new one"). Sometimes false ("decide whether to break the public API" is not the implementer's call). When in doubt, lift the decision into the Issue.

**"We'll figure it out as we go."** This is HITL with a friendlier name. AFK requires the figuring out to happen *before* the agent picks the Issue, not during.

**"It's HITL because the codebase is messy."** A messy codebase doesn't change the classification — it changes the *risk* of an AFK Issue going wrong. Mitigation: tighter acceptance criteria, more explicit Implementation Constraints, or explicit instruction to stop and ask if something unexpected appears. A well-specified Issue in a messy codebase is still AFK.

## Mode lock-in

The classification is set when the Issue is *created*, not when it's picked up. A change that turns an AFK Issue into HITL during implementation (e.g., the agent discovers an architectural ambiguity that wasn't visible at creation time) means the Issue should be paused, the new ambiguity resolved, and the Issue updated — not silently continued as HITL.

This sounds bureaucratic. The reason for the rule: an Issue that quietly becomes HITL mid-flight produces a PR that mixes "the agent's implementation" with "decisions the human made during implementation," and the audit trail is destroyed. Pausing preserves the trail.
