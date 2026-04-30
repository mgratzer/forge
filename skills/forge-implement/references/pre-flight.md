# Pre-flight Checks

Validate the foundation before writing feature code. Foundation failures disguise themselves as feature bugs — pre-flight reveals them in seconds instead of hours.

## Checklist

Run all applicable checks before the first line of feature code:

- [ ] **Code generators** — run codegen, verify output is current (`git diff --stat -- generated/`). Stale artifacts make the type system lie.
- [ ] **Config placement** — grep for where similar config is consumed before placing a new value. Config defined but never read is a silent failure.
- [ ] **External services** — verify dependencies are reachable and authenticated (`curl`, health check, or known-good request). Don't wire against vapor.
- [ ] **Env vars / secrets** — confirm required variables exist in the running environment (`echo "${VAR:?not set}"`). Many setups silently substitute empty strings.
- [ ] **Existing patterns** — grep for similar implementations before writing new code. Skipping this creates duplicate approaches.

## When to skip

A check can be skipped only when its failure mode is impossible for this specific work:
- No new config → skip config placement
- No external dependency → skip service health
- Pure refactor touching no env-var code → skip env var check
