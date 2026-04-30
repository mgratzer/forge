# Verify Before Assume

When using an API you haven't called in this session, verify it exists before writing code against it. This is the single most effective defense against the agent failure mode where code looks correct but calls things that don't exist.

## The principle

An agent's training data is a snapshot. Libraries release new versions, CLI tools add and remove flags, HTTP endpoints change shape, internal functions get renamed. When an agent writes code that calls an API, it is *guessing* based on what was true at training time — not checking what is true now.

The guess is usually right. When it's wrong, the failure is uniquely expensive: the code compiles (or at least parses), the structure looks plausible, and the developer debugging it has no reason to suspect the *method itself* doesn't exist. They spend time debugging the call, the arguments, the context — everything except the one thing that's wrong.

## Why agents hallucinate APIs

Agents produce *plausible completions*. An API call is plausible when it follows the naming conventions of the library, takes the right number of arguments, and fits the surrounding code. Plausibility is not correctness. A method named `createWithOptions()` is plausible for almost any SDK — that doesn't mean it exists.

Three common triggers:

1. **Version drift.** The agent's training data has v2 of a library; the project uses v3 (or v1). Methods were added, removed, or renamed between versions.
2. **Interpolation.** The agent has seen similar APIs in similar libraries and interpolates a method that *should* exist based on the pattern — but doesn't.
3. **Flag invention.** CLI tools are especially prone. The agent has seen `--parent`, `--recursive`, `--dry-run` on various commands and confidently applies them to commands that don't support them.

## The verification discipline

Before using an unfamiliar API — any method, flag, endpoint, or type you haven't already seen used in this codebase or verified in this session:

### 1. Check the codebase first

```bash
grep -rn "<method-or-flag>" src/
```

If the codebase already uses this API, follow the existing usage pattern. Existing usage is the strongest evidence that the API exists and works in this project's version.

### 2. Check the source or docs

For **libraries**: read the actual type definitions or source.

```bash
# For Node.js / TypeScript — check installed type definitions
grep -rn "<method-name>" node_modules/<package>/
```

For **CLI tools**: use the tool's own help.

```bash
gh issue create --help
```

For **HTTP APIs**: make a lightweight probe before writing the integration (pre-flight check #3 already covers service reachability — this extends it to endpoint shape).

### 3. Check the version

When the project pins a specific version of a dependency, verify the API exists *at that version*, not just in the latest release.

```bash
# Check what version is installed
cat package.json | grep "<package>"
```

## When verification isn't needed

- **Standard library.** Language builtins are stable enough that training-data knowledge is reliable. `Array.map`, `os.path.join`, `fmt.Sprintf` — these don't need verification.
- **Already used in this codebase.** If you've seen `fetchUser()` called in three files, it exists. Follow the existing call pattern.
- **Already verified this session.** One check per API per session is enough. Don't re-verify on every use.
- **The project has type checking.** A type checker will catch nonexistent methods on typed interfaces. Verification still helps for untyped code, dynamic languages, CLI calls, and HTTP endpoints — anything the type checker can't reach.

## Common failure modes

**Confident usage of a plausible flag.** The agent writes `gh issue create --parent 42` with full confidence. The flag doesn't exist in the installed `gh` version. The command fails with an unhelpful error, and the developer spends time debugging arguments instead of questioning the flag's existence.

**Version-shifted method names.** A library renamed `client.query()` to `client.execute()` in v4. The agent writes `client.query()` because it has more training examples of v3. The code fails at runtime with "method not found" — a confusing error when the method *did* exist in a different version.

**Interpolated convenience methods.** The agent assumes a library has `findOrCreate()` because similar ORMs do. The actual library only has `find()` and `create()` separately. The agent writes clean, readable code that calls a function that was never implemented.

**Skipping verification because "I know this library."** The agent's training data is not current knowledge. "Knowing" a library means having seen examples of it — possibly from a version that no longer matches the project. Verification takes seconds; debugging hallucinated APIs takes hours.

## Decision

The bar is low: **one grep, one `--help`, or one type-definition read** before using an API you haven't seen in the current codebase. The cost is seconds. The cost of skipping is a debugging session where the developer trusts the code and hunts for bugs that aren't there — because the real bug is that the API the agent called doesn't exist.
