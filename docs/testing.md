# Testing

Forge has no automated test suite — the skills are prompt templates, not executable code. Validation is manual.

## How to Validate a Skill

### 1. Structural Review

Before committing a new or modified skill, verify:

- [ ] YAML frontmatter has `name` and `description`
- [ ] `name` matches the directory name (e.g., `forge-setup-project` in `skills/forge-setup-project/`)
- [ ] All sections follow the standard order (see [Coding Guidelines](coding-guidelines.md))
- [ ] "Related Skills" section references the correct next step or follow-up skill in the workflow
- [ ] Workflow order is consistent: `forge-setup-project` → [`forge-shape` →] `forge-create-issue` → `forge-implement` → `forge-reflect` → `forge-address-pr-feedback` → `forge-guard`

### 2. Bash Command Validation

Every `gh` and `git` command in a skill should be valid:

```bash
# Verify gh commands parse correctly (--help won't execute but validates syntax)
gh issue create --help
gh api graphql --help
gh pr create --help
```

For GraphQL queries in `forge-address-pr-feedback`, verify the query structure against the [GitHub GraphQL API docs](https://docs.github.com/en/graphql).

**Markdown provider path:** when modifying skills that use the `plan/` folder provider, verify that file operations match [plan-folder-spec.md](../skills/_shared/plan-folder-spec.md) — correct directory structure, frontmatter fields, and INDEX.md updates.

### 3. End-to-End Manual Testing

The most reliable test is running the skill on a real project:

1. Open a compatible coding agent in a test repository
2. Invoke the skill with `/forge-<skill-name>`
3. Walk through the full process
4. Verify all generated output (issues, branches, PRs, files) is correct
5. If the skill delegates to sub-agents (for example `forge-reflect` or `forge-ship`), verify the delegated runs use either the parent session's model/provider or whatever compatible runtime-level model routing/configuration you intentionally set up
6. For `forge-reflect` and `forge-ship`, verify review stays lean by default — tiny low-risk diffs stay inline, ordinary diffs use one reviewer, and a second pass appears only for clearly high-risk or broad changes
7. For `forge-guard` (or `forge-ship --guard`), run it on a PR whose CI you can make fail once: verify it fixes the failure, re-requests the peer review, replies on every thread, and ends in `review-ready` without merging; then run it with `--max-rounds 1` against a PR with two rounds of feedback and verify it ends in `needs-human`. Add a check that already fails on the base branch and one that fails only on its first attempt: the guard leaves the first alone, reruns the second once, and neither costs a round. Push a conflicting commit to the base branch: the guard merges it in, resolves the conflict, and still ends in `review-ready`
8. For `forge-implement` (or `forge-ship`), run it on an Issue in a project that can run its app, such as `mgratzer/forge-e2e-sandbox`: verify the PR's `## Exercised` section lists real commands with their observed output and one failure case; then run it in a project with no way to run the app and verify the section says `not exercised: <why>` instead of describing a run

### 4. Cross-Skill Consistency Check

After modifying any shared convention, grep across all relevant skills to ensure consistency:

```bash
# Check commit format references
grep -rn "type.*scope.*description" skills/

# Check workflow order
grep -rn "forge-setup-project\|forge-shape\|forge-create-issue\|forge-implement\|forge-reflect\|forge-address-pr-feedback\|forge-ship\|forge-guard\|forge-batch" skills/

# Check guidance file references
grep -rn "AGENTS.md\|CLAUDE.md" skills/

# Check trailing context syntax (all skills support it)
grep -rn "additional context\|-- <additional context>" skills/

# Check Issue-touching skills reference _shared/issue-operations.md (not inline conditionals; setup-project has none)
grep -rn "issue-operations" skills/*/SKILL.md

# Check every skill bundles the shared layer and no sibling-relative links remain (both should print nothing)
for d in skills/forge-*/; do [ "$(readlink "${d}_shared")" = "../_shared" ] || echo "missing: ${d}_shared"; done
grep -rn "\.\./_shared" skills/
```
