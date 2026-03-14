# AGENTS.md Template

Use this template when creating or updating AGENTS.md. Target ~150-200 lines. Every line must pass the undiscoverability test — if an agent can find it by exploring, it doesn't belong here.

````markdown
# <Project Name>

<one-line description — derive from exploration, confirm with user for greenfield>

## Commands

```bash
<all verified commands — install, dev, build, test, lint, format, typecheck>
```

## Documentation

| Document | Purpose |
|----------|---------|
<only rows for docs that actually exist — this is the agent's Tier 2 entry point>

## Context Discovery

| Working on... | Read first |
|---------------|------------|
<map project domains/features to the docs an agent should read before making changes>
<omit this section for small projects with 1-2 docs>

## Core Principles

<3-5 numbered rules from user input — never invented>

## Conventions

<project-specific naming, imports, preferred libraries, patterns>
<organize by constraint level:>
<MUST / MUST NOT — invariants that cause bugs or security issues when violated>
<PREFER / AVOID — team preferences where multiple valid approaches exist>
<for each rule, note enforcement mechanism — linter, CI, script, or manual>

## Commits

Format: `<type>(<scope>): <description>`

Types: feat, fix, docs, refactor, test, chore, perf

<2-3 examples using actual project scopes>

## Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
<each entry traces to an observed agent mistake — omit section entirely if none>

## Domain Invariants

<numbered must-always-hold rules — omit section entirely if none provided>
````
