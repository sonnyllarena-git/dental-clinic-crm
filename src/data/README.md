# Data layer

This is the entire boundary between the UI and "where data comes from."
Every component reaches data through the typed hooks in `src/data/hooks/`
(Stage 3) — never through `repository.ts`, `localRepository.ts`, `db.ts`,
or `seed/` directly.

## What's here today

- **`repository.ts`** — the `Repository` interface. This is the contract;
  everything else in this folder exists to satisfy it.
- **`db.ts`** — the Dexie (IndexedDB) schema. One table per entity,
  indexed on whatever `LocalRepository` actually queries by.
- **`localRepository.ts`** — the only implementation right now. Seeds
  itself from `seed/` on first access, and reseeds automatically if the
  seed generator's `SEED` constant ever changes, so a code update doesn't
  leave an existing browser stuck with a stale dataset.
- **`index.ts`** — the single import point (`{ repository }`) every hook
  uses. This is the file that changes when the backend changes; nothing
  downstream of it does.
- **`seed/`** — deterministic mock data generation. See `seed/README.md`
  (Stage 4) for how to regenerate it, add an entity, or add a scenario.

## When the real API lands

1. Write `apiRepository.ts` implementing the same `Repository` interface
   from `repository.ts`, calling `fetch` (or your HTTP client) instead of
   Dexie tables.
2. In `index.ts`, change the export:
   ```diff
   - export { localRepository as repository } from './localRepository';
   + export { apiRepository as repository } from './apiRepository';
   ```
3. Delete `db.ts`, `localRepository.ts`, and everything under `seed/`.

Nothing else changes. Every hook, every component, every test that
doesn't test the repository implementation directly keeps working
unmodified, because they only ever imported `{ repository }` from here —
never a concrete class.

## What's mock-only and has no equivalent in the API version

- **Determinism** (`SEED`, the seeded PRNG in `seed/prng.ts`) — real data
  isn't reproducible by design. This machinery doesn't get ported.
- **`resetAndReseed()`** — "wipe and regenerate from the seed" only makes
  sense when there's a seed. The Settings page action that calls it
  (Stage 6) gets removed or repointed at a real "restore demo tenant"
  endpoint if one ever exists.
- **`actingUserId?: string` on mutating methods** — passed explicitly
  today because auth is stubbed (see the app shell's dev role switcher).
  A real API infers the actor from the authenticated request; the
  parameter disappears and every call site simply drops the second
  argument.
- **Artificial read latency** — deliberately *not* implemented in
  `LocalRepository` itself. Dexie/IndexedDB calls are already genuinely
  async, so there's nothing to fake at this layer. The configurable delay
  described in the brief (default 250ms, 0 for tests) is a Stage 3
  concern that wraps the hooks, not the repository — that's also where it
  gets removed when swapping to a real API, since a real network call
  already has real latency.
