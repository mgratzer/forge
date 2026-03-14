---
name: forge-update-changelog
description: Update CHANGELOG.md with user-facing changes from recent commits. Use when the user has merged a PR, completed a release, or wants to document recent changes in the changelog.
allowed-tools: Read, Bash, Grep, Glob, Edit
---

# Update Changelog

Update CHANGELOG.md with user-facing changes from recent development work.

## Input

Optional: A date (YYYY-MM-DD) or commit hash to start from: $ARGUMENTS

If not provided, look at commits since the last changelog update.

## Process

### Step 1: Read Current Changelog

Read `CHANGELOG.md` to understand the existing format and last update.

### Step 2: Gather Recent Commits

```bash
git log --format="%h %s" --since="1 month ago"
# Or from a specific commit:
git log --oneline <commit>..HEAD
```

### Step 3: Filter and Deduplicate

Include only changes users would notice: features, bug fixes, performance improvements.

Skip internal changes: refactors, tests, chore, CI, docs (unless user-facing help docs).

**Deduplicate against existing entries.** Compare each candidate commit against what's already in the changelog — if a commit is already covered by an existing entry (even with different wording), skip it.

### Step 4: Write Entries

Group by category (Features, Improvements, Bug Fixes, Performance). Adapt categories to the project's domain when appropriate.

**Writing rules:**
- Active voice: "Create shareable links" not "Shareable links were added"
- Describe what users can *do* differently, not how the implementation works — even for technical projects. "Project setup is now smarter and faster" not "Adopted three-tier context model with signal-to-noise scoring"
- Bold the feature name: **Feature name** - description
- One line per entry
- Combine multiple commits for one feature into a single entry

### Step 5: Update CHANGELOG.md

Add a new section at the top (after the header):

```markdown
## Month Year

### Category
- **Feature name** - Brief description

---
```

### Step 6: Verify

- Only user-facing changes included
- No technical jargon
- Consistent formatting with existing entries
- No duplicates with existing changelog content

**Example transformation** — `feat(auth): add OAuth2 login with Google` becomes `**Google sign-in** - Sign in with your Google account for faster access`.

## Guidelines

- **User perspective** — ask "Would a user notice or care about this?"
- **No duplicates** — check existing entries before adding
- **Combine related commits** — multiple commits for one feature = one entry
- **Positive framing** — "Fixed X" is better than "X was broken"

## Related Skills

**Before:** Use `forge-address-pr-feedback` to address reviewer feedback before merging.

## Example Usage

```
/forge-update-changelog
/forge-update-changelog 2025-01-01
```
