import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { buildSeedDataset, SEED } from './index';

/**
 * Committed snapshot hash of the full seeded dataset under SEED
 * ('DENTAL_CRM_SEED_V1'). If a generator change is intentional, recompute
 * with:
 *
 *   npx tsx -e "import('node:crypto').then(({createHash}) => import('./src/data/seed').then(({buildSeedDataset}) => console.log(createHash('sha256').update(JSON.stringify(buildSeedDataset())).digest('hex'))))"
 *
 * and update COMMITTED_HASH below — don't just delete this test. A
 * mismatch here means the "same seed in -> identical records out"
 * guarantee broke somewhere, which is the one thing this whole mock data
 * layer promises above all else.
 */
const COMMITTED_HASH = '13ab5271c531b3121be8425f5aed76a630e34563537b5ec6f5c7c61c497fd127';

function hashDataset(seed: string): string {
  return createHash('sha256').update(JSON.stringify(buildSeedDataset(seed))).digest('hex');
}

describe('seed determinism', () => {
  it('produces byte-identical output across repeated builds in the same process', () => {
    const first = JSON.stringify(buildSeedDataset(SEED));
    const second = JSON.stringify(buildSeedDataset(SEED));
    expect(first).toBe(second);
  });

  it('matches the committed hash snapshot', () => {
    expect(hashDataset(SEED)).toBe(COMMITTED_HASH);
  });

  it('changes if the seed string changes (sanity check that the hash is actually sensitive to input)', () => {
    expect(hashDataset('DIFFERENT_SEED')).not.toBe(COMMITTED_HASH);
  });
});
