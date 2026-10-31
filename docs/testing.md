# Testing

The skills are prompt templates, not executable code: their behavior is validated by hand, below. What can be checked mechanically runs in CI (`.github/workflows/checks.yml`) on every pull request, and locally with the same commands:

```bash
scripts/check-skills.sh                        # skill structure; the script lists its checks
npx @biomejs/biome@2.6.2 ci .                  # lint and format of lens/ and the plugin JSON
claude plugin validate .                       # plugin and marketplace manifests, the lens's hooks
claude plugin test .                           # lens/tests/*.test.tsx
```

CI pins Biome (matching the `$schema` in `biome.json`) and Claude Code; bump both on purpose. `validate` exits 0 on warnings, so CI also fails on any warning except the missing `version` (left out so installs track commits) and, through `--profile directory`, on anything the plugin directory would refuse, such as a missing LICENSE. Run the lens checks when a change touches `lens/`, `.claude-plugin/`, or a text format the lens reads (see [Lens: The Text It Reads](lens.md#the-text-it-reads)).

## How to Validate a Skill

### 1. Structural Review

Before committing a new or modified skill, verify:

- [ ] YAML frontmatter has `name` and `description`
- [ ] `name` matches the directory name (e.g., `forge-setup-project` in `skills/forge-setup-project/`)
- [ ] All sections follow the standard order (see [Coding Guidelines](coding-guidelines.md))
- [ ] "Related Skills" section references the correct next step or follow-up skill in the workflow
- [ ] Workflow order is consistent: `forge-setup-project` → [`forge-shape` →] `forge-create-issue` → `forge-implement` → `forge-reflect` → `forge-address-pr-feedback` → `forge-guard` → `forge-land`

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
7. For `forge-guard` (or `forge-ship --guard`), run it on a PR whose CI you can make fail once: verify it fixes the failure, re-requests the peer review, replies on every thread, and ends in `review-ready` without merging; then run it with `--max-rounds 1` against a PR with two rounds of feedback and verify it ends in `needs-human`. Add a check that already fails on the base branch and one that fails only on its first attempt: the guard leaves the first alone, reruns the second once and waits for the rerun, and neither costs a round. Push a conflicting commit to the base branch: the guard merges it in, resolves the conflict, and still ends in `review-ready`
8. For `forge-implement` (or `forge-ship`), run it on an Issue in a project that can run its app, such as `mgratzer/forge-e2e-sandbox`: verify the PR's `## Exercised` section lists real commands with their observed output and one failure case; then run it in a project with no way to run the app and verify the section says `not exercised: <why>` instead of describing a run. In a fresh worktree of a project whose Commands name an install step, verify pre-flight runs it before the first phase; then unset an env var the base commit already needs: when `.env.example` provides it, verify the PR's Notes report an environment failure and the diff has no code change for it; when it doesn't, verify an unattended run stops at `needs-human` naming the variable
9. For `forge-land` (or `forge-ship --guard`), run it on two green PRs in `mgratzer/forge-e2e-sandbox`: a small docs-plus-code PR ends in `merge-ready`; a PR touching a CI workflow ends in `review-ready` with a Where to look list; a code PR whose `## Exercised` says `not exercised: no way to run the app` ends in `review-ready` with an `Exercise:` line naming it, while a docs-only PR with `not exercised: no runtime change` can still be `merge-ready`. Verify the PR body's `## Risk` section names the head commit, a re-run replaces the section instead of adding a second one, a PR without `## Exercised` ends in `needs-human`, a PR that opened with a deviation from its `## Plan` it doesn't list ends in `review-ready` with a `Plan:` line naming it, while guard-round commits after the open don't trip it, and the review request goes to a linked Issue's assignee or author only when they did not open the PR. Then add `Auto-merge: low-risk` to the sandbox's `## Unattended Shipping` section: the low-risk PR merges itself after CI and land reports `merged`; push a commit after the verdict and before the merge, and verify the merge is refused (`--match-head-commit`) and land reports `needs-human`

### 4. Cross-Skill Consistency Check

After modifying any shared convention, grep across all relevant skills to ensure consistency:

```bash
# Check commit format references
grep -rn "type.*scope.*description" skills/

# Check workflow order
grep -rn "forge-setup-project\|forge-shape\|forge-create-issue\|forge-implement\|forge-reflect\|forge-address-pr-feedback\|forge-ship\|forge-guard\|forge-land\|forge-batch" skills/

# Check guidance file references
grep -rn "AGENTS.md\|CLAUDE.md" skills/

# Check trailing context syntax (all skills support it)
grep -rn "additional context\|-- <additional context>" skills/

# Check Issue-touching skills reference _shared/issue-operations.md (not inline conditionals; setup-project has none)
grep -rn "issue-operations" skills/*/SKILL.md

# Structural checks (prints nothing when healthy; the script lists what it checks)
scripts/check-skills.sh
```
