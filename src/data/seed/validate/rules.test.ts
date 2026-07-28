import { describe, it, expect } from 'vitest';
import { buildSeedDataset } from '../index';
import { RULE_CHECKS, runAllRules } from './rules';

/**
 * The same rule functions `pnpm validate:seed` runs, wired into the normal
 * test suite too — so a generator regression fails `pnpm test` (and CI)
 * immediately, not only when someone remembers to run the standalone
 * script by hand.
 */
describe('seed integrity rules', () => {
  const dataset = buildSeedDataset();

  it('has no violations across the full rule set', () => {
    const violations = runAllRules(dataset);
    if (violations.length > 0) {
      const summary = violations.map((v) => `[${v.rule}] ${v.recordId}: ${v.message}`).join('\n');
      expect.fail(`${violations.length} integrity violation(s):\n${summary}`);
    }
  });

  it.each(RULE_CHECKS.map((r) => [r.name, r.check] as const))('passes: %s', (_name, check) => {
    expect(check(dataset)).toEqual([]);
  });
});
