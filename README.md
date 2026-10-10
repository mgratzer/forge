<p align="center">
  <strong>Agent skills for structured development with pluggable issue tracking.</strong><br>
  One workflow. Nine skills. From idea to review-ready code.
</p>

<p align="center">
  <a href="CONTEXT.md">Context</a> &middot;
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
| Shape | `/forge-shape` | Shape a vague idea into a clear plan through one-at-a-time structured questioning |
| Create Issue | `/forge-create-issue` | Collaboratively plan and create Issues (GitHub, markdown, or other provider) |
| Implement | `/forge-implement <input>` | Implement from an Issue, plan file, or description |
| Reflect | `/forge-reflect` | Self-review changes (PR, branch, or uncommitted) |
| Address PR Feedback | `/forge-address-pr-feedback` | Address unresolved PR review comments |
| **Ship** | **`/forge-ship <input>`** | **Implement + review in one invocation; `--guard` continues until the PR is review-ready** |
| Guard | `/forge-guard [pr]` | Drive an open PR to review-ready: quality passes, CI, peer review, feedback rounds — never merges |
| Batch | `/forge-batch <scope>` | Group Issues into Waves that can ship concurrently |

All skills accept optional trailing execution guidance using `-- <additional context>`.

## Workflow

The skills form a simple workflow — each step feeds into the next:

```
forge-setup-project → [forge-shape →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback → forge-guard
                                                                        ╰──── forge-ship ────╯╰──── forge-ship --guard ────╯
```

For many Issues at once, `forge-batch` groups them into Waves and a launcher from [`contrib/launchers/`](contrib/launchers/) starts one guarded ship per Issue. See [Unattended Shipping](docs/unattended.md).

`forge-ship` composes implement + review into a single invocation; its review always delegates to a fresh-context reviewer (the session authored the diff), adding a second pass only when risk justifies it. Standalone `forge-reflect` keeps tiny diffs inline when the session didn't author them. Scout and review work should use cheaper models when the runtime supports per-task model choice; otherwise they should inherit the parent session model cleanly.

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

Check your agent's docs for the correct skills directory path. Each skill reaches the shared modules through its own `_shared` symlink, so no separate `_shared/` install is needed with either method.

For unattended runs in fresh checkouts, install the [worktree hooks](contrib/worktree/) once and put a [launcher](contrib/launchers/) on your PATH.

## Project Guidance

- [`AGENTS.md`](AGENTS.md) is the canonical project guidance file
- [`CLAUDE.md`](CLAUDE.md) is a compatibility symlink for tools that still look for that filename

## Documentation

| Document | Purpose |
|----------|---------|
| [Context](CONTEXT.md) | Shared vocabulary used across forge skills |
| [Architecture](docs/architecture.md) | Skill workflow, operating constraints, design decisions |
| [Development](docs/development.md) | How to create and modify skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill and role file format, authoring conventions, style rules |
| [Testing](docs/testing.md) | How to validate skills manually |
| [PR Workflow](docs/pr-workflow.md) | Commits, PRs, branch naming, review process |
| [Unattended Shipping](docs/unattended.md) | Guard loop, Waves, launchers, project setup |

## Contributors

- [@denrase](https://github.com/denrase) — configurable git workflow idea ([#7](https://github.com/mgratzer/forge/pull/7))

## Contributing

1. Read [AGENTS.md](AGENTS.md) for project principles and conventions
2. Follow [docs/coding-guidelines.md](docs/coding-guidelines.md) for skill authoring rules
3. Test your changes by invoking the skill on a real project
4. Use conventional commits: `feat(skills): add new skill`
