# Development

## Prerequisites

- Git
- [GitHub CLI](https://cli.github.com/) (`gh`) — used by skills for GitHub issue and PR operations (only required when GitHub is the issue tracker provider)
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
     skills/forge-shape \
     skills/forge-implement \
     skills/forge-reflect \
     skills/forge-address-pr-feedback
   ```
4. Verify cross-skill consistency: shared conventions must be identical in every skill that references them
5. If adding or modifying a `(delegate)` step, ensure sub-agent instructions are self-contained (or composed from a role reference + task instructions) and the skill works correctly when executed inline
6. If modifying a role file, verify all skills referencing that role still work correctly

## Adding or Modifying Roles

Roles are sub-agent persona definitions. Skill-specific roles live under the skill's `roles/` directory; cross-skill roles live in `_shared/roles/`.

### Adding a New Role

1. Create a `roles/` directory inside the skill that will use it
2. Create a `<role-name>.md` file there
3. Add YAML frontmatter with `name` and `description`
4. Write the prompt body: identity, behavior rules, output format, constraints
5. Update the skill’s delegation step to reference the role

### When to Extract a Role

Extract a persona into a role file when:
- The persona has calibration rules or behavior that benefits from separation (severity rubrics, research methodology)
- The skill body is approaching the instruction budget and the persona can be loaded on demand

**Don’t extract** trivial personas that are just a sentence or two — inline them in the skill’s blockquote.

If multiple skills need the same role, place it in `skills/_shared/roles/` rather than duplicating across skills.

### Modifying an Existing Role

1. Read the role file and the skill that uses it
2. Make targeted changes
3. Verify the skill’s delegation step still works with the updated role
4. If the same role is duplicated across skills, update all copies

## Quality Gates

See [testing.md — Structural Review](testing.md#1-structural-review) for the pre-commit checklist.
