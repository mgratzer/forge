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
5. Update the pipeline references in adjacent skills' "Related Skills" sections
6. Update the docs table in `AGENTS.md` and `README.md` if a new doc category is needed

## Modifying an Existing Skill

1. Read the full SKILL.md to understand the current flow
2. Make targeted changes — avoid rewriting entire skills when a small edit suffices
3. If changing conventions (commit format, branch naming, guidance filenames, etc.), grep across all skills to update consistently:
   ```bash
   grep -r "conventional commit" skills/
   grep -r "branch naming" skills/
   grep -r "AGENTS.md\|CLAUDE.md" skills/
   ```
4. Verify cross-skill consistency: shared conventions must be identical in every skill that references them

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

1. **Cross-reference check**: Ensure conventions mentioned in the modified skill match all other skills (commit format, branch naming, pipeline order, canonical guidance file)
2. **Pipeline continuity**: Verify the "Related Skills" section correctly links to adjacent skills
3. **Frontmatter validity**: Confirm `name` and `description` are present and accurate
4. **Bash example accuracy**: All `gh` and `git` commands in examples must be valid and runnable
