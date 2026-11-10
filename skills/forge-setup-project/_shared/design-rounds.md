# Design Rounds

How to settle a visual decision (a screen, an email, a character, a brand mark) when words can't: draw it, show it, take the feedback, and draw again. `forge-shape` runs the design rounds.

A **board** is one rendered proposal, on whatever canvas the project uses (Claude Design, an HTML artifact, Figma). A **design round** is one brief, the boards drawn for it, and the person's verdict on them.

## Ground the Boards

Before the first board, read what it has to stay true to, and say what you read: the project's design home (a design doc, brand rules, tokens, earlier boards), the real copy (message files, templates), and the rules behind the surface (limits, states, what the code does at the edges). A project rule on which of these wins over a board stands.

Every string, number, and state on a board comes from what you read. Mark anything else on the board: `proposed` for new copy or a new state, `sample` for example data.

## Each Round

1. **Brief.** Say in one or two lines what this round decides and what the last verdict changed.
2. **Draw.** Two or three directions that differ in kind while the direction is open; one board per change once it is chosen. With no canvas named or in use, an HTML page beside the spec that the person can open.
3. **Look.** Render each board to PNG, outside the working tree, with the runtime's browser or screenshot tool, and look at it before showing it: clipped text, overlaps, a shape that doesn't read at its real size. With no way to render, say so when you show it.
4. **Show.** Give the link and the PNGs, recommend one, and ask one question, as in the rest of shaping.
5. **Record.** Add the round to the spec's log, the person's reason in their own words:

   ```markdown
   ## Design rounds

   | Round | Board | Verdict | Why |
   |-------|-------|---------|-----|
   | 1 | Upright crayon | rejected | "not good", no room for a face |
   | 2 | Crayon box | chosen | the crayons left show the pages left |
   ```

Later rounds don't bring back a rejected direction unless the person asks for it.

The spec and its log live in the repo on every canvas, in the project's design home (with none, `docs/design/<slug>/README.md`), and link each board.

## Close the Rounds

Stop when the person accepts a direction. Then find each state, string, or rule that only the spec or only the chosen board has; styling the board already shows needs no copy in the spec. Fix the spec when the board is right, and ask when you can't tell which one is.

The spec and its log reach the default branch through a PR: shaping's docs PR, or the open PR a rejection came from. Publish the rounds' PNGs the way [exercise](exercise.md#screenshots) publishes screenshots and show them in that PR's body, so a reviewer sees them without opening the canvas. That publish replaces the whole branch, so on a PR with screenshots, put them in the same directory. Work the direction still needs in code goes into shaping's Issue breakdown, and each such Issue names the spec; a spec with nothing to build yet has none.

## A Design Rejected on an Open PR

A person rejecting the design on an open PR is a new design round, not a code fix: run it from the rejected board, close the rounds, and only then rework the code. The new board changes the Plan: the PR body's `## Plan` carries the changed Plan (see [pr-body](pr-body.md#plan)).

An unattended run can't run a design round: it leaves the thread or comment as needing a human decision, naming the rejected board.
