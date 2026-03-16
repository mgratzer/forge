# Testing

Forge has no automated test suite — the skills are prompt templates, not executable code. Validation is manual.

## How to Validate a Skill

### 1. Structural Review

Before committing a new or modified skill, verify:

- [ ] YAML frontmatter has `name` and `description`
- [ ] `name` matches the directory name (e.g., `forge-setup-project` in `skills/forge-setup-project/`)
- [ ] All sections follow the standard order (see [Coding Guidelines](coding-guidelines.md))
- [ ] "Related Skills" section references the correct next step or follow-up skill in the workflow
- [ ] Workflow order is consistent: `forge-setup-project` → `forge-create-issue` → `forge-implement-issue` → `forge-reflect-pr` → `forge-address-pr-feedback`

### 2. Bash Command Validation

Every `gh` and `git` command in a skill should be valid:

```bash
# Verify gh commands parse correctly (--help won't execute but validates syntax)
gh issue create --help
gh api graphql --help
gh pr create --help
```

For GraphQL queries in `forge-address-pr-feedback`, verify the query structure against the [GitHub GraphQL API docs](https://docs.github.com/en/graphql).

### 3. End-to-End Manual Testing

The most reliable test is running the skill on a real project:

1. Open a compatible coding agent in a test repository
2. Invoke the skill with `/forge-<skill-name>`
3. Walk through the full process
4. Verify all generated output (issues, branches, PRs, files) is correct

### 4. Cross-Skill Consistency Check

After modifying any shared convention, grep across all relevant skills to ensure consistency:

```bash
# Check commit format references
grep -rn "type.*scope.*description" skills/

# Check workflow order
grep -rn "forge-create-issue\|forge-implement-issue\|forge-reflect-pr\|forge-address-pr-feedback\|forge-setup-project" skills/

# Check guidance file references
grep -rn "AGENTS.md\|CLAUDE.md" skills/

# Check trailing context syntax in structured-input skills
grep -rn "additional context\|-- <additional context>" \
  skills/forge-setup-project \
  skills/forge-implement-issue \
  skills/forge-reflect-pr \
  skills/forge-address-pr-feedback
```
