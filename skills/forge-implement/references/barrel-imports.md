# Barrel Imports

Why agents create barrel files, when they cause real harm, and the few cases where they earn their cost.

## The principle

A *barrel file* is an `index.ts` (or `index.js`, `__init__.py`, `mod.rs`) that re-exports symbols from other modules in the same directory. Its purpose is to let callers import from the directory path instead of the specific file:

```ts
// components/index.ts — the barrel
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// caller
import { Button } from './components';      // via barrel
import { Button } from './components/Button'; // direct
```

The barrel adds a layer of indirection. That layer has a cost. The question is whether the cost is justified.

## Why agents create barrel files

Agents produce *plausible structure*. Barrel files look like good engineering: they shorten import paths, centralize a directory's public API, and mirror patterns the agent has seen in popular open-source libraries. The agent creates them reflexively — the same way it creates wrapper classes and one-function-per-concept modules — because the *shape* looks clean, not because the *trade-off* was evaluated.

The result is a codebase where every directory has an index file that re-exports everything in it. No caller asked for this. No bundler benefits from it. The barrel exists because the agent thought it should.

## The costs

**Circular dependency risk.** Barrel files pull an entire directory's exports into a single module. When two directories barrel-import from each other — or when a file within the directory imports from its own barrel — the result is a circular dependency that may fail silently (undefined at import time) or noisily (runtime crash), depending on the module system.

**Tree-shaking breakage.** Bundlers that don't analyze re-exports deeply treat a barrel import as "this caller needs everything in this directory." The unused exports survive into the bundle. In large codebases this adds meaningful dead code to production builds.

**Obscured origin.** `import { fetchUser } from '@/lib'` tells the reader nothing about where `fetchUser` is defined. They must open the barrel, find the re-export, then navigate to the source file. Direct imports — `import { fetchUser } from '@/lib/api/users'` — are self-documenting.

**Merge conflict surface.** Every new export in a directory means a line added to the barrel. When multiple contributors add exports to the same directory in parallel, the barrel becomes a merge conflict magnet — a file that exists only for organizational ceremony, not for functionality, yet blocks merges.

**IDE and tooling friction.** Auto-import features often resolve to the barrel path instead of the source path, creating inconsistent import styles. "Go to definition" lands on the re-export line, requiring a second jump. These are small frictions that compound across a codebase.

## When barrels earn their cost

**Published package boundary.** A library consumed by external callers needs a stable, curated public API. The barrel *is* the API surface — it declares what's public and what's internal. This is the original use case and the one where the trade-off is clearly positive.

**The project already uses them consistently.** If the codebase has an established convention of barrel files, follow it. Mixing barrel and direct imports is worse than either style alone. The pattern audit applies here: match what exists.

**Framework convention.** Some frameworks (e.g., Angular modules, certain Next.js patterns) expect or generate barrel files. Fighting the framework's convention creates more friction than the barrel does.

## The discipline

Before creating a barrel file, check:

1. **Does this directory already have one?** If yes, follow the existing pattern — add the export, don't fight the convention.
2. **Is this a public API boundary?** If the directory is consumed by external callers (other packages, published library users), a barrel is justified.
3. **Is this an internal directory?** If callers are within the same project, direct imports are almost always better. The barrel adds indirection without adding value.

When in doubt, use direct imports. They are always correct, never create circular dependencies, never break tree-shaking, and never obscure where a symbol is defined.

## Common failure modes

**Barrel-per-directory by default.** The agent creates an `index.ts` in every new directory as a matter of course. No caller requested it. No convention requires it. The barrel exists because the agent's training data associates directories with index files.

**Re-exporting everything.** A barrel that exports every symbol in the directory is not curating an API — it's adding an indirection layer with no filtering. Barrels earn their cost by *hiding* internals, not by *mirroring* them.

**Importing from own barrel.** A file within a directory imports from its own `index.ts` instead of from sibling files directly. This is the shortest path to a circular dependency and a sign the barrel is being used for convenience rather than architecture.

**Adding barrels during refactoring.** An agent tasked with "clean up imports" introduces barrel files as part of the cleanup. The cleanup adds a new dependency structure the codebase didn't have, creating risk where none existed.

## Decision

The default is **no barrel file**. Direct imports are explicit, safe, and tooling-friendly. A barrel earns its place only at a published API boundary or where the project already uses them by convention. When an agent reaches for an index file, the question is not "would this look cleaner?" — it's "does this directory need a curated public API that hides internals from external consumers?" If the answer is no, skip the barrel.
