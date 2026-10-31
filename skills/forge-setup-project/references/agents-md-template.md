# AGENTS.md Template

Use this template when creating or updating AGENTS.md. Keep it under ~200 lines. Every line must pass the undiscoverability test — if an agent can find it by exploring, it doesn't belong here.

````markdown
# <Project Name>

<one-line description — derive from exploration, confirm with user for greenfield>

## Commands

```bash
<all verified commands — install, dev, build, test, lint, format, typecheck>
```

<run recipe (see unattended-shipping.md): start the app, drive it, test credentials, stop; a <!-- TODO --> for each part nobody knows>

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
<Invariants: rules that cause bugs or security issues when violated, each with its reason>
<Preferences: team choices where multiple valid approaches exist>
<for each rule, note enforcement mechanism — linter, CI, script, or manual>

<important if="<the situation, e.g. changes touch db/migrations>">
<guidance only that situation needs; agents skip the block otherwise>
</important>
<use a conditional block for each rule that applies to some tasks only; omit when there are none>

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

## Unattended Shipping

<settings per unattended-shipping.md, only when the project ships through PRs and the user accepted; never an Auto-merge line>
````
