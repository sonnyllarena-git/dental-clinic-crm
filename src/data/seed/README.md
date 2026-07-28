# Seed data

Deterministic mock data for the whole clinic — one clinic, 8 staff, 60
patients, ~220 appointments, ~180 treatments, ~125 invoices, 45 inventory
items, 300 audit log entries — built pure and side-effect free, with every
edge case in the brief's coverage matrix baked in at a fixed, named index
(see `coverageIndex.ts`).

## How to regenerate

You don't, in the sense of "run a command that writes new files" — there's
nothing to write. `buildSeedDataset()` in `index.ts` *is* the regeneration:
call it and you get the dataset, identical every time, because everything
in `generators/` pulls randomness only from the seeded PRNG in `prng.ts`
(never `Math.random()`) and every date from `REFERENCE_DATE` in
`../demoClock.ts` (never `new Date()`).

To pick up a change you made to a generator:

- **In the running app**: click "Reset demo data" in the top bar (or the
  Scenario Switcher, Ctrl+Shift+D) — `LocalRepository` also reseeds
  automatically the next time anyone opens the app, because it compares
  its stored `SEED` value against the current one and wipes/rebuilds on
  mismatch.
- **In tests**: nothing to do — `buildSeedDataset()` is called fresh in
  every test file that needs it.
- **The committed determinism hash** (`determinism.test.ts`) will fail
  after any change that alters the output. That's intentional — see that
  file's comment for how to recompute and update it.

Always run `pnpm validate:seed` after touching a generator. It's the same
15 integrity rules (`validate/rules.ts`) as `rules.test.ts`, just with a
CLI-friendly report of exactly which rule and which record broke.

## How to add a new entity

1. Add the type to `../types/` (or a new file there, re-exported from
   `../types/index.ts`).
2. Add it to the `SeedDataset` interface in `../types/index.ts`.
3. Write a generator in `generators/`, following the existing ones'
   shape: `(rng: SeededRandom, clinicId: string, ...alreadyBuiltEntities) => T[]`.
   Dependency order matters — a generator can only take entities that are
   built *before* it in `index.ts`.
4. Wire it into `buildSeedDataset()` in `index.ts`, in dependency order.
5. If the new entity has foreign keys, add a `checkForeignKey(...)` call
   to `checkNoOrphanForeignKeys` in `validate/rules.ts`. If it has its own
   invariants (like "quantity >= 0"), add a new rule function and register
   it in `RULE_CHECKS`.
6. If any row in the brief's coverage matrix needs a specific instance of
   the new entity, reserve a named index/offset in `coverageIndex.ts`
   rather than a magic number in the generator itself — that's what Stage
   5's audit cites back to.

## How to add a scenario

Scenarios live at the hooks layer (`../hooks/`), not here — this folder
only builds the one real, full dataset. To add scenario #9:

1. Add it to `SCENARIOS` in `@/store/scenario.store.ts` (and its label).
2. `useRepositoryQuery` already handles delay/loading/error/empty/single
   uniformly — a new scenario only needs entity-specific handling if it
   transforms data rather than just changing timing. If so, add a
   transform function to `../scenarios/overlays.ts` (see
   `applyBusyMondayOverlay` / `applyMonthEndOverlay` for the pattern:
   accept the scenario as a parameter, no-op unless it matches) and call
   it from whichever hook(s) it applies to.
3. Add it to the `ScenarioSwitcher` panel's list — it already iterates
   `SCENARIOS`, so this is automatic.

## What gets deleted when the real API arrives

Everything in this folder. `buildSeedDataset()`, the seeded PRNG, the
locale pools, the coverage-index map, `validate/` — none of it has a
server-side equivalent, because a real API's data isn't reproducible by
design and doesn't need edge cases *manufactured*, it already has real
ones. `pnpm validate:seed` and its CI job go too. See `../README.md` for
what happens one level up, in the repository layer itself.
