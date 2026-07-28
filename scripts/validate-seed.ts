/**
 * `pnpm validate:seed` — builds the deterministic seed dataset and asserts
 * every integrity rule from the brief against it. Exits non-zero and
 * prints exactly which rule broke and which record, so a broken generator
 * fails loudly in CI rather than shipping quietly-wrong demo data.
 */
import { buildSeedDataset } from '../src/data/seed';
import { RULE_CHECKS, runAllRules } from '../src/data/seed/validate/rules';

const dataset = buildSeedDataset();
const violations = runAllRules(dataset);

if (violations.length === 0) {
  console.log(`✓ All ${RULE_CHECKS.length} integrity rules passed against the seeded dataset.`);
  process.exit(0);
}

console.error(`✗ ${violations.length} integrity violation(s) found:\n`);

const byRule = new Map<string, typeof violations>();
violations.forEach((v) => {
  const list = byRule.get(v.rule) ?? [];
  list.push(v);
  byRule.set(v.rule, list);
});

byRule.forEach((list, rule) => {
  console.error(`  [${rule}] ×${list.length}`);
  list.slice(0, 5).forEach((v) => {
    console.error(`    - record ${v.recordId}: ${v.message}`);
  });
  if (list.length > 5) {
    console.error(`    ...and ${list.length - 5} more`);
  }
});

process.exit(1);
