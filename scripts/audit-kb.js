#!/usr/bin/env node
// scripts/audit-kb.js
// Audit Nassau KB against the v3 kit-ready schema.
// Output: per-destination completeness score + gap report.

const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'nassau-knowledge-base.json'
);

const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
const destinations = kb.destinations || [];

// ─── REQUIRED FIELDS FOR KIT-READY STATUS ─────────────────
const FIELD_CHECKS = [
  // Already in KB v2 — should be present
  { field: 'destination', weight: 2, check: (d) => !!d.destination },
  { field: 'region', weight: 2, check: (d) => !!d.region },
  { field: 'why_go', weight: 3, check: (d) => !!d.why_go && d.why_go.length > 50 },
  { field: 'best_months', weight: 2, check: (d) => Array.isArray(d.best_months) && d.best_months.length > 0 },
  { field: 'top_courses', weight: 5, check: (d) => Array.isArray(d.top_courses) && d.top_courses.length >= 3 },
  { field: 'lodging_options', weight: 3, check: (d) => Array.isArray(d.lodging_options) && d.lodging_options.length > 0 },
  { field: 'avg_cost_per_person_per_day', weight: 3, check: (d) => d.avg_cost_per_person_per_day && d.avg_cost_per_person_per_day.mid },
  { field: 'group_size_sweet_spot', weight: 1, check: (d) => !!d.group_size_sweet_spot },
  { field: 'nearest_airport', weight: 2, check: (d) => !!d.nearest_airport },
  { field: 'dining', weight: 2, check: (d) => Array.isArray(d.dining) && d.dining.length > 0 },
  { field: 'hidden_gems', weight: 1, check: (d) => Array.isArray(d.hidden_gems) },

  // NEW for kit-ready (v3 additions)
  { field: 'kit_title', weight: 2, check: (d) => !!d.kit_title },
  { field: 'kit_subtitle', weight: 1, check: (d) => !!d.kit_subtitle },
  { field: 'kit_tagline', weight: 1, check: (d) => !!d.kit_tagline },
  { field: 'region_visual_category', weight: 2, check: (d) => !!d.region_visual_category },
  { field: 'default_recommended_dates', weight: 3, check: (d) => d.default_recommended_dates && d.default_recommended_dates.start },
  { field: 'recommended_itinerary', weight: 8, check: (d) => Array.isArray(d.recommended_itinerary) && d.recommended_itinerary.length >= 3 },
  { field: 'recommended_lodging', weight: 4, check: (d) => d.recommended_lodging && d.recommended_lodging.name },
  { field: 'cost_breakdown_4day', weight: 5, check: (d) => Array.isArray(d.cost_breakdown_4day) && d.cost_breakdown_4day.length >= 4 },
  { field: 'bonus_plays', weight: 3, check: (d) => Array.isArray(d.bonus_plays) && d.bonus_plays.length >= 3 },
  { field: 'booking_contacts', weight: 8, check: (d) => Array.isArray(d.booking_contacts) && d.booking_contacts.length >= 3 },
  { field: 'founder_note', weight: 3, check: (d) => !!d.founder_note && d.founder_note.length > 50 },
];

const TOTAL_WEIGHT = FIELD_CHECKS.reduce((sum, c) => sum + c.weight, 0);

// ─── RUN AUDIT ──────────────────────────────────────────
const results = destinations.map((d) => {
  const checks = FIELD_CHECKS.map((c) => ({
    field: c.field,
    weight: c.weight,
    pass: c.check(d),
  }));

  const earnedWeight = checks
    .filter((c) => c.pass)
    .reduce((sum, c) => sum + c.weight, 0);

  const score = Math.round((earnedWeight / TOTAL_WEIGHT) * 100);

  const missing = checks.filter((c) => !c.pass).map((c) => c.field);

  return {
    id: d.id,
    destination: d.destination,
    region: d.region,
    score,
    missing,
    checks,
  };
});

// ─── SORT + REPORT ──────────────────────────────────────
results.sort((a, b) => b.score - a.score);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('NASSAU KB AUDIT — Kit-Readiness Scorecard');
console.log(`Schema: v3 (kit-ready) | Destinations: ${destinations.length}`);
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('LAUNCH-READY (≥80 score) → ship as flagship kits');
console.log('───────────────────────────────────────────────────────────────');
const ready = results.filter((r) => r.score >= 80);
ready.forEach((r) => {
  console.log(`  ${r.score}/100  ${r.destination.padEnd(30)} (${r.region})`);
});
if (!ready.length) console.log('  (none yet — all destinations need v3 enrichment)');
console.log('');

console.log('NEAR-READY (50-79) → quick wins, focus enrichment here');
console.log('───────────────────────────────────────────────────────────────');
const near = results.filter((r) => r.score >= 50 && r.score < 80);
near.forEach((r) => {
  console.log(`  ${r.score}/100  ${r.destination.padEnd(30)} (${r.region})`);
  console.log(`         missing: ${r.missing.slice(0, 4).join(', ')}${r.missing.length > 4 ? ', ...' : ''}`);
});
console.log('');

console.log('DEEP GAPS (<50) → defer until after launch wave');
console.log('───────────────────────────────────────────────────────────────');
const deep = results.filter((r) => r.score < 50);
deep.forEach((r) => {
  console.log(`  ${r.score}/100  ${r.destination.padEnd(30)} (${r.region})`);
});
console.log('');

// ─── AGGREGATE GAP SUMMARY ──────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log('AGGREGATE GAPS — what\'s most often missing across the KB');
console.log('═══════════════════════════════════════════════════════════════\n');

const fieldMissingCounts = {};
FIELD_CHECKS.forEach((c) => (fieldMissingCounts[c.field] = 0));
results.forEach((r) => {
  r.missing.forEach((f) => fieldMissingCounts[f]++);
});

const gapsRanked = Object.entries(fieldMissingCounts)
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1]);

gapsRanked.forEach(([field, count]) => {
  const pct = Math.round((count / destinations.length) * 100);
  const bar = '█'.repeat(Math.round(pct / 5));
  console.log(`  ${field.padEnd(35)} ${count}/${destinations.length} (${pct}%)  ${bar}`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('NEXT STEPS');
console.log('═══════════════════════════════════════════════════════════════');
console.log('1. Pick top 5 from LAUNCH-READY or NEAR-READY for first wave');
console.log('2. Focus enrichment on the most-missing fields (top of agg gaps)');
console.log('3. Re-run this audit after each enrichment wave to track progress');
console.log('4. Goal: 5 destinations at ≥80 score within 2 weeks\n');

// Optional: write JSON for further use
fs.writeFileSync(
  path.join(__dirname, '..', 'kb-audit-report.json'),
  JSON.stringify(results, null, 2)
);
console.log('Detailed JSON report saved to: kb-audit-report.json\n');
