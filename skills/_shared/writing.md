# Writing for Humans

How to write anything forge produces for a person to read: PR bodies, review replies, Issues, docs, and summaries. Used by `forge-implement` (via [pr-body](pr-body.md)), `forge-ship`, `forge-create-issue`, `forge-address-pr-feedback`, and `forge-setup-project`.

- **Plain and short.** Say the thing once, in the words the reader uses. Cut filler, hedges, and superlatives.
- **Nothing the reader already has.** Don't restate the diff, CI results, or the Issue the reader can open.
- **Facts over impressions.** Name the command, the file, the observed result. Never claim something was checked when it wasn't.
- **Only claims with evidence.** A testing or verification claim comes from a recorded run in this session: the gate output, the exercise evidence, a CI result. A check that wasn't run is named as not run.
- **No agent byline.** Never name the agent, its model, or its vendor in commits, PR bodies, replies, or Issues. Attribution the runtime adds by configuration is the runtime's, not the text's.
