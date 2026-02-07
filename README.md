<p align="center">
  <strong>Agent skills for structured, GitHub-centric development.</strong><br>
  One workflow. Six skills. From issue to shipped code.
</p>

<p align="center">
  <a href="docs/architecture.md">Architecture</a> &middot;
  <a href="docs/development.md">Development</a> &middot;
  <a href="docs/coding-guidelines.md">Guidelines</a> &middot;
  <a href="docs/testing.md">Testing</a> &middot;
  <a href="docs/pr-workflow.md">PR Workflow</a>
</p>

---

A forge is where raw material meets intention. You bring the codebase — these skills shape the workflow from issue to implementation to review.

---

## Skills

Forge skills follow the [Agent Skills](https://agentskills.io) open standard and work with any compatible agent.

| Skill | Command | Purpose |
|-------|---------|---------|
| Setup Project | `/forge-setup-project` | Create CLAUDE.md, docs/, README, and other meta-structure |
| Create Issue | `/forge-create-issue` | Collaboratively plan and create GitHub issues |
| Implement Issue | `/forge-implement-issue <number>` | Implement a feature or fix from a GitHub issue |
| Reflect on PR | `/forge-reflect-pr` | Self-review before requesting peer review |
| Address PR Feedback | `/forge-address-pr-feedback` | Address unresolved PR review comments |
| Update Changelog | `/forge-update-changelog` | Update CHANGELOG.md with user-facing changes |

## Workflow

The skills form a pipeline — each step feeds into the next:

```
forge-setup-project → forge-create-issue → forge-implement-issue → forge-reflect-pr → forge-address-pr-feedback → forge-update-changelog
```

## Install

Forge skills follow the [Agent Skills](https://agentskills.io) open standard. Copy or symlink the skill directories into your agent's skills folder:

```bash
# Symlink all skills (easy updates)
ln -s /path/to/forge/skills/forge-* <your-agent-skills-dir>/

# Or a single skill
ln -s /path/to/forge/skills/forge-setup-project <your-agent-skills-dir>/forge-setup-project
```

Check your agent's documentation for the skills directory location. Common paths:

| Scope | Path |
|-------|------|
| Personal (all projects) | `~/.claude/skills/`, `~/.agents/skills/`, or equivalent |
| Project-scoped | `.claude/skills/`, `.agents/skills/`, or equivalent |

## Documentation

| Document | Purpose |
|----------|---------|
| [Architecture](docs/architecture.md) | Skill pipeline, file format, design decisions |
| [Development](docs/development.md) | How to create and modify skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill authoring conventions and style rules |
| [Testing](docs/testing.md) | How to validate skills manually |
| [PR Workflow](docs/pr-workflow.md) | Commits, PRs, branch naming, review process |

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for project principles and conventions
2. Follow [docs/coding-guidelines.md](docs/coding-guidelines.md) for skill authoring rules
3. Test your changes by invoking the skill on a real project
4. Use conventional commits: `feat(skills): add new skill`
