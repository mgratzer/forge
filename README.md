<p align="center">
  <strong>Agent skills for structured, GitHub-centric development.</strong><br>
  One workflow. Six skills. From idea to review-ready code.
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
| Setup Project | `/forge-setup-project` | Set up or audit a project's context infrastructure for agentic engineering |
| Brainstorm | `/forge-brainstorm` | Explore a vague idea and converge on a plan before creating issues |
| Create Issue | `/forge-create-issue` | Collaboratively plan and create GitHub issues |
| Implement | `/forge-implement <input>` | Implement from a GitHub issue, plan file, or description |
| Reflect | `/forge-reflect` | Self-review changes (PR, branch, or uncommitted) |
| Address PR Feedback | `/forge-address-pr-feedback` | Address unresolved PR review comments |
| **Ship** | **`/forge-ship <number>`** | **Implement + review in one invocation** |

Skills with structured primary input also accept optional trailing execution guidance using `-- <additional context>`.

## Workflow

The skills form a simple workflow — each step feeds into the next:

```
forge-setup-project → [forge-brainstorm →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback
                                                                        ╰──── forge-ship ────╯
```

`forge-ship` composes implement + review into a single invocation. For fresh-context review in Pi, pair with [pi-interactive-subagents](https://github.com/HazAT/pi-interactive-subagents).

## Install

Forge skills follow the [Agent Skills](https://agentskills.io) open standard and work with any compatible agent.

**Via [npx skills](https://skills.sh)** — auto-detects your agents and installs to all of them:

```bash
npx skills add mgratzer/forge
```

**Manual** — symlink into your agent's skills directory:

```bash
ln -s /path/to/forge/skills/forge-* <your-agent-skills-dir>/
```

Check your agent's docs for the correct skills directory path.

## Project Guidance

- [`AGENTS.md`](AGENTS.md) is the canonical project guidance file
- [`CLAUDE.md`](CLAUDE.md) is a compatibility symlink for tools that still look for that filename

## Documentation

| Document | Purpose |
|----------|---------|
| [Architecture](docs/architecture.md) | Skill workflow, file format, design decisions |
| [Development](docs/development.md) | How to create and modify skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill authoring conventions and style rules |
| [Testing](docs/testing.md) | How to validate skills manually |
| [PR Workflow](docs/pr-workflow.md) | Commits, PRs, branch naming, review process |

## Contributors

- [@denrase](https://github.com/denrase) — configurable git workflow idea ([#7](https://github.com/mgratzer/forge/pull/7))

## Contributing

1. Read [AGENTS.md](AGENTS.md) for project principles and conventions
2. Follow [docs/coding-guidelines.md](docs/coding-guidelines.md) for skill authoring rules
3. Test your changes by invoking the skill on a real project
4. Use conventional commits: `feat(skills): add new skill`
