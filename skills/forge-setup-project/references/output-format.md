# Setup Summary Output Format

Use the format matching the work performed.

## Fresh Setup

```text
## Setup Complete

### Context Infrastructure

**Tier 1, hot memory (always loaded):**
- AGENTS.md: <line count> lines

**Tier 2, warm memory (on demand):**
- docs/architecture.md: design decisions and data flow
<list only docs that were created>

**Tier 3, cold memory (recommended for later):**
<suggest for complex projects: API docs, DB schemas, deployment runbooks>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <status> | <action> |
| Module structure | <status> | <action> |
| App legibility | <status> | <action> |
| Known risks | <risks> | <where documented> |

### Supporting Files
<CLAUDE.md removed, or reduced to an @AGENTS.md import; only when one existed>
- .gitignore

### Next Steps
1. Fill any <!-- TODO --> markers
2. Add failure modes as you encounter agent mistakes
3. Re-run /forge-setup-project periodically
4. Use /forge-create-issue to plan your first piece of work, or /forge-shape if the idea is still rough
```

## Audit / Update of Existing Guidance

```text
## Audit Complete

### Changes Applied
<list each changed file with specific changes>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <status> | <action> |
| Module structure | <status> | <action> |
| App legibility | <status> | <action> |
| Known risks | <risks> | <where documented> |

### Recommendations Not Applied
<items the user chose not to apply>

### Next Steps
1. Review changes and verify accuracy
2. Revisit recommendations not applied
3. Re-run /forge-setup-project periodically
```
