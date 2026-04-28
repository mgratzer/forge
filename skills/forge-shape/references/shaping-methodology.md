# Shaping Methodology

How to converge on a shared design concept through structured one-at-a-time questioning.

## The principle

A shaping session is not "produce an asset" — it is "reach a shared design concept." The summary or plan that comes out is a side effect; the real product is alignment between the user and the agent.

When an LLM "eagerly produces a plan," it is compensating for missing alignment by inventing details. The tell: the plan is plausible but the user reading it thinks "wait, I never said X." That X is the LLM filling in absent context.

The fix is not better plan-writing. The fix is to keep questioning until there is no missing context to fill in.

## Why one question at a time

Batching questions feels efficient. It is not — it produces three failure modes:

**The committed assumption.** When the LLM presents five questions in a batch, it has already silently committed to assumptions that *shape the questions themselves*. The user answering each question accepts those assumptions by not contesting them. Each batched question is an *anchor*, not just an inquiry.

**The missed dependency.** Question 4's correct framing depends on the answer to question 1. Batching freezes the framing before the answer exists. The user who would have flagged a different framing for question 4 never gets the chance.

**The fatigue trade.** Five questions in a batch get five cursory answers. One question at a time gets one considered answer. The total information content is *higher* with the slower mode even though the throughput is lower.

One question at a time forces the LLM to reckon with each answer before composing the next question. That is the point.

## Provide a recommended answer

Each question should come with the LLM's recommended answer. This is an *anchor*, deliberately. Two reasons:

1. **Speed.** The user who agrees says "yes" and moves on. Without a recommendation, every question requires composing an answer from scratch.
2. **Visibility.** A recommendation surfaces the LLM's current understanding. The user who *disagrees* now has a concrete thing to push back against ("not that — this") rather than a blank prompt.

The risk: an anchor that is too strong silences disagreement. Mitigate by phrasing recommendations as recommendations ("I'd suggest X because Y") rather than assertions ("X"), and by inviting pushback explicitly when the question is high-stakes.

## Walk the dependency tree

Order questions so each one is *resolvable* given prior answers. If question 4 depends on question 1, ask question 1 first; if questions are independent, order does not matter.

This sounds obvious; the failure mode it prevents is asking question 4 first, getting an answer that turns out wrong-relative-to-question-1, and then having to revisit. The user feels rework as wasted effort even when the LLM treats it as iteration.

Common dependency patterns:

- **Decision → consequence** ("we are going with approach X" → "how does X handle case Y")
- **Scope → detail** ("we are building Z" → "what is the minimum viable Z")
- **Persona → flow** ("admins do this" → "what does the admin permission look like")

If you cannot tell whether two questions are independent or dependent, ask the simpler one first.

## When to stop

A shaping session is done when:

- **The user accepted recommended answers for several consecutive questions.** Strong signal of alignment.
- **The remaining questions are taste-level.** "Should the button be blue or green" is not a shaping question; it is an implementation detail. Save it for the implementer.
- **The user volunteers a summary.** "OK, so we're doing X end-to-end with Y as the constraint" — they are done; capture and move on.

The session is *not* done when:

- The user asked for something specific and it has not been mentioned
- A question's recommended answer received a one-word "fine" — that signals disengagement, not agreement
- You cannot summarize the design concept yet without filling in details

## Common failure modes

**Eager plan-writing before alignment.** The LLM's instinct is to compose a plan as soon as it has enough information to *write something*. That is the wrong moment — it is "enough to write something" before "enough to write something *right*." The plan that comes out is an LLM-shaped plan, not a user-shaped plan. Resist the instinct.

**Accepting the first plausible answer.** The user gives an answer; the LLM accepts it; the LLM does not notice it conflicts with an earlier answer. Consistency-checking is part of shaping. If a new answer contradicts an old one, surface the conflict — do not paper over it.

**Recommendations that anchor too hard.** "I'd suggest X because Y" is a recommendation. "We'll go with X" is a decision. Phrasing matters; an LLM that asserts decisions instead of recommending answers is doing specs-to-code in disguise — pretending the user is steering when the LLM is steering.

**Asking what the codebase already answers.** Step 1 explored the codebase; the shaping session should not ask questions whose answers are sitting in the code. If the project uses Postgres, do not ask "what database should we use." Reference what was found and ask what was *not* answered.

**The infinite shaping session.** Some users will go 60 questions deep without converging. Watch for diminishing returns — when each question's answer no longer changes the design, stop. Better to finish with 80% alignment and discover gaps in implementation than to keep grinding for 100% on paper.

**Treating the summary as the goal.** The summary at the end of shaping is *evidence* of alignment, not the alignment itself. If the user reads the summary and finds nothing surprising, the shaping worked. If they find surprises, the shaping was incomplete and the summary is a false-positive.

## Decision

Shape the design through *the user's* answers, not by writing what you think the design should be. The session's success is measured in alignment, not output volume. A 30-minute session that produced 12 questions and a clear shared concept beats a 5-minute session that produced a 3-page plan nobody read carefully.
