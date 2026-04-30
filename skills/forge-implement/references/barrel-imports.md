# Barrel Imports

Agents reflexively create barrel files (index re-exports) because the shape looks clean. The costs usually outweigh the benefits.

## Decision tree

1. **Does the directory already have a barrel?** → Follow the existing convention.
2. **Is this a published API boundary?** (library consumed by external callers) → Barrel is justified.
3. **Is this an internal directory?** → Use direct imports. The barrel adds indirection without value.

**Default: no barrel file.** Direct imports are explicit, safe, and tooling-friendly.

## Costs of barrels

- **Circular dependency risk** — barrel pulls entire directory into one module; cross-directory barrels create silent import failures
- **Unnecessary loading** — bundlers/runtimes load all re-exports even when caller needs one symbol
- **Obscured origin** — `import { X } from './lib'` doesn't show where X is defined
- **Merge conflict magnet** — every new export touches the barrel file
- **IDE friction** — auto-import resolves to barrel path; "go to definition" requires double-jump

## When barrels earn their cost

- Published package boundary (the barrel *is* the public API)
- Project already uses them consistently (mixing styles is worse)
- Framework convention requires them (Angular modules, Next.js route groups)

## Common failure modes

- **Barrel-per-directory by default** — agent creates index files reflexively
- **Re-exporting everything** — mirrors internals instead of curating an API
- **Importing from own barrel** — file within a directory imports from its own index → circular dependency
- **Adding barrels during refactoring** — introduces new dependency structure as a side effect
