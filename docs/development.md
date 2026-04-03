# Development

## Prerequisites

- Git
- [GitHub CLI](https://cli.github.com/) (`gh`) — used by skills for all GitHub operations
- A compatible coding agent that supports Agent Skills slash commands

No language runtime, package manager, or build tools are needed. The repository contains only Markdown files.

## Setup

```bash
git clone <repo-url>
cd forge
```

No dependency installation required.

## Adding a New Skill

1. Create a directory under `skills/` named `forge-<skill-name>/`
2. Create a `SKILL.md` file inside it
3. Add YAML frontmatter with `name` and `description` (see [Architecture](architecture.md) for field reference)
4. Write the structured prompt body following the section order: Title → Input → Process → Guidelines → Related Skills → Example Usage
5. Update workflow references in relevant skills' "Related Skills" sections
6. Update the docs table in `AGENTS.md` and `README.md` if a new doc category is needed

## Modifying an Existing Skill

1. Read the full SKILL.md to understand the current flow
2. Make targeted changes — avoid rewriting entire skills when a small edit suffices
3. If changing conventions (commit format, branch naming, guidance filenames, structured-input syntax, etc.), grep across all relevant skills to update consistently:
   ```bash
   grep -r "conventional commit" skills/
   grep -r "branch naming" skills/
   grep -r "AGENTS.md\|CLAUDE.md" skills/
   grep -r "additional context\|-- <additional context>" \
     skills/forge-setup-project \
     skills/forge-brainstorm \
     skills/forge-implement-issue \
     skills/forge-reflect-pr \
     skills/forge-address-pr-feedback
   ```
4. Verify cross-skill consistency: shared conventions must be identical in every skill that references them
5. If adding or modifying a `(delegate)` step, ensure sub-agent instructions are fully self-contained and the skill works correctly when executed inline

## Available Commands

This is a documentation-only repository. The relevant commands are:

| Command | Purpose |
|---------|---------|
| `git status` | Check working tree state |
| `git diff` | Review changes before committing |
| `gh issue list` | List open issues |
| `gh pr list` | List open pull requests |
| `gh issue create` | Create a new issue |
| `gh pr create` | Create a pull request |

## Quality Gates

Before committing changes to any SKILL.md:

1. **Cross-reference check**: Ensure conventions mentioned in the modified skill match all other relevant skills (commit format, branch naming, workflow order, canonical guidance file, shared trailing context syntax where applicable)
2. **Workflow continuity**: Verify the "Related Skills" section correctly links to the next relevant step
3. **Frontmatter validity**: Confirm `name` and `description` are present and accurate
4. **Bash example accuracy**: All `gh` and `git` commands in examples must be valid and runnable
