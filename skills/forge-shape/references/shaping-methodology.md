# Shaping Methodology

Converge on a shared design concept through one-at-a-time structured questioning. The summary is a side effect — the real product is alignment.

## Why one question at a time

Batching questions fails three ways:
- **Committed assumptions** — five batched questions anchor the user to the LLM's framing before answers exist
- **Missed dependencies** — question 4's correct framing depends on question 1's answer
- **Fatigue trade** — five cursory answers < one considered answer

One at a time forces the LLM to reckon with each answer before composing the next question.

## Provide a recommended answer

Each question should include a recommendation ("I'd suggest X because Y", not "X"). Two reasons:
- **Speed** — the user who agrees says "yes"
- **Visibility** — surfaces the LLM's current understanding; user can push back against something concrete

Risk: anchor too strong silences disagreement. Mitigate by phrasing as recommendation, not assertion.

## Walk the dependency tree

Order questions so each is resolvable given prior answers. Patterns: decision → consequence, scope → detail, persona → flow. If unsure whether two questions are dependent, ask the simpler one first.

## When to challenge

Convergence without challenge produces polite alignment on bad plans. Push back when:

- **Terminology conflicts with CONTEXT.md** — "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?" Pick one canonical term and list the other as an alias to avoid.
- **Claims contradict the code** — "Your code does X, but you just said Y — which is right?" Don't let stated intent and actual behavior diverge silently.
- **Vague or overloaded terms** — "You're saying 'account' — do you mean the Customer or the User? Those are different things." Propose a precise term.
- **Fuzzy boundaries** — invent a concrete scenario that probes the edge case. "What happens when an order is partially shipped and the customer cancels? Does the cancellation apply to the whole order or just the unshipped items?" Force precision.

The goal is still convergence — but convergence on something that survives contact with the codebase and the domain, not just convergence on what sounds good in conversation.

## When to stop

- User accepted recommended answers for several consecutive questions
- Remaining questions are taste-level, not decision-level
- User volunteers a summary

**Not done** when: a specific request hasn't been addressed, "fine" signals disengagement not agreement, or you can't summarize without filling in details.

## Common failure modes

- **Eager plan-writing** — composing before alignment; "enough to write" ≠ "enough to write *right*"
- **Not checking consistency** — new answer contradicts old one; surface the conflict
- **Anchoring too hard** — "we'll go with X" is a decision, not a recommendation
- **Asking what the codebase already answers** — if Postgres is in use, don't ask about the database
