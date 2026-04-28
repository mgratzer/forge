# Pre-flight Checks

Validate the foundation before writing feature code. Pre-flight catches the failures that look like "I built the thing and nothing works" — and reveals them in seconds instead of hours.

## The principle

Implementation depends on a foundation: generated artifacts, configuration values, external services, environment variables, credentials. When the foundation is wrong or absent, feature code fails in confusing ways that *look like bugs in the feature* but are actually bugs in the foundation.

Pre-flight is the discipline of validating the foundation *before* the feature exists, so a foundation failure produces a clear "the foundation is broken" signal instead of a confusing "the feature doesn't work" signal.

The cost is small (minutes, sometimes seconds). The cost of skipping it is the worst kind of debugging session: hours spent staring at correct feature code that fails because of a silently misconfigured foundation.

## What to check

Run all of these *before* the first line of feature code:

### 1. Code generators

If the project uses code generators (typed clients, schema bindings, route stubs, ORM models), run them and verify the output is current.

```bash
# whatever the project's codegen command is
npm run codegen
git diff --stat -- generated/
```

If generators emit a diff, the foundation is stale. Either commit the regenerated artifacts (in their own commit, before the feature work) or investigate why they drifted. Building feature code on stale generated artifacts means the type-checker and the tests are lying to you about what the system actually does.

### 2. Config placement

When adding a new configuration value, *grep for where similar config is consumed before placing the new value*.

```bash
grep -rn "<EXISTING_RELATED_CONFIG_KEY>" src/
```

Config that's defined but never read is the most common silent failure. Config readers usually live in one or two files; placing a new value in the wrong file means the system *parses* it but never *uses* it. The feature appears to be built; it has no effect.

### 3. External services and APIs

If the work depends on an external service (a SaaS API, an internal microservice, a database, a third-party SDK), verify it's reachable and authenticated *before* writing the integration code.

```bash
# Health-check the external dependency in whatever way is cheapest
curl -fsSL "$EXTERNAL_API_URL/health"
# or: ping the actual endpoint with a known-good request
```

Wiring code against a service you've never successfully called is wiring against vapor. Half the integration bugs are in the wiring; the other half are in the service being unavailable, returning a different shape than documented, or requiring authentication you don't have. Find out which class of bug you have before writing 200 lines.

### 4. Environment variables, secrets, credentials

Verify all required environment variables, secrets, and credentials are available in the environment where the work will run.

```bash
# Spot-check the variables the work needs
echo "${REQUIRED_VAR:?REQUIRED_VAR is not set}"
```

Missing env vars are silently substituted as empty strings in many setups. The code runs. Nothing works. Check first.

### 5. Existing patterns

Grep for similar past implementations *before* writing new code. If a pattern exists, the implementation should follow it (or explicitly diverge with a reason). Skipping this is how a codebase ends up with three slightly different ways of doing the same thing.

```bash
# Find prior art
grep -rn "<RELATED_FUNCTION_OR_TYPE_NAME>" src/
```

## Why this order

The five checks are ordered by how cheaply they reveal foundation problems:

1. Codegen runs in seconds and tells you whether the type system is honest.
2. Config placement is a one-line grep that tells you whether the new config will be read.
3. External service health is a curl that tells you whether the dependency exists.
4. Env vars are an echo that tells you whether secrets reached this environment.
5. Existing patterns is a grep that tells you whether you're about to duplicate.

In total, this takes minutes. In total, it prevents the most expensive debugging sessions.

## Common skips and what they cost

**"The codegen probably hasn't drifted."** It has, and the type errors you'll catch later won't be the type errors you'd catch now — they'll be type errors *masking* the real change.

**"I'll wire the config later."** "Later" is the moment of debugging when the feature appears built but does nothing. The fix is one-line; finding which line takes 45 minutes.

**"The API works in the docs."** Docs and reality drift. A 30-second curl against the real endpoint is the difference between a 1-hour integration and an 8-hour integration.

**"The env vars are in the .env file."** Are they in the *running* environment? Containers, sandboxes, and CI often diverge from local. Echo the variable in the actual runtime.

**"I'll find existing patterns as I go."** "As I go" produces parallel implementations. Each is correct in isolation; the next maintainer pays the cost of choosing between them.

## When to skip

A pre-flight check can be skipped only when its failure mode is impossible *for this specific work*. Examples:

- No new config → skip the config placement grep.
- No external dependency → skip the service health check.
- A pure refactor that touches no env-var-reading code → skip the env var check.

The skip should be deliberate and justified. The default is to run them.

## Decision

Pre-flight is **fast, boring, and high-value**. It catches the foundation failures that disguise themselves as feature bugs and would otherwise consume the first hours of debugging. The five checks together cost minutes. Skipping them is a false economy.
