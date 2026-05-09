#!/usr/bin/env node
// scripts/enrich-destination.js
// Enrich Nassau KB destinations with Layers 1-3 fields via Claude API.
//
// Usage:
//   node scripts/enrich-destination.js bandon-dunes-or            # single, write (skip existing fields)
//   node scripts/enrich-destination.js bandon-dunes-or --dry-run  # single, preview full JSON
//   node scripts/enrich-destination.js --all                      # batch all (skip existing fields)
//   node scripts/enrich-destination.js --all --dry-run            # batch all, preview each
//   node scripts/enrich-destination.js --all --force              # batch all, OVERWRITE existing v3 fields
//   node scripts/enrich-destination.js bandon-dunes-or --force    # single, overwrite

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { buildPrompt } = require('./enrichment-prompt');

const KB_PATH = path.join(__dirname, '..', 'src', 'data', 'nassau-knowledge-base.json');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_PATH = path.join(__dirname, '..', 'src', 'data', `nassau-knowledge-base.backup-PRE-ENRICH-${TIMESTAMP}.json`);
const LOG_PATH = path.join(__dirname, '..', `enrich-log-${TIMESTAMP}.json`);

// v3 fields that --force will overwrite. founder_note + booking_contacts are NOT in this list — they're human-polished and never auto-overwritten.
const V3_FIELDS = [
  'kit_title', 'kit_subtitle', 'kit_tagline',
  'region_visual_category', 'default_recommended_dates',
  'recommended_itinerary', 'recommended_lodging',
  'cost_breakdown_4day', 'bonus_plays',
];

const args = process.argv.slice(2);
const isAll = args.includes('--all');
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const targetId = args.find((a) => !a.startsWith('--'));

if (!isAll && !targetId) {
  console.error('Usage: node enrich-destination.js <destination-id> | --all [--dry-run] [--force]');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function enrichDestination(destination, tripStructureRules) {
  const prompt = buildPrompt(destination, tripStructureRules);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in response');
  const raw = textBlock.text.trim();

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`JSON parse failed: ${err.message}\n\nRaw response:\n${raw.slice(0, 500)}`);
  }

  const required = V3_FIELDS;
  const missing = required.filter((f) => !(f in parsed));
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return { parsed, usage: response.usage };
}

function mergeIntoDestination(destination, newFields, force) {
  const result = { ...destination };
  Object.entries(newFields).forEach(([key, value]) => {
    if (force) {
      // Overwrite, but only V3 fields. Never touch founder_note / booking_contacts.
      if (V3_FIELDS.includes(key)) {
        result[key] = value;
      }
    } else {
      // Non-destructive: only add if missing
      if (!(key in result)) {
        result[key] = value;
      }
    }
  });
  return result;
}

async function main() {
  console.log(`\n${'═'.repeat(63)}`);
  console.log(`NASSAU KB ENRICHMENT — Layers 1-3`);
  console.log(`${'═'.repeat(63)}`);
  const modeStr = isAll ? 'BATCH (all)' : `SINGLE (${targetId})`;
  const flagStr = [isDryRun && '[DRY RUN]', isForce && '[FORCE OVERWRITE V3 FIELDS]'].filter(Boolean).join(' ');
  console.log(`Mode: ${modeStr} ${flagStr}`);
  console.log('');

  const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
  const tripStructureRules = kb.trip_structure_rules || {};

  const targets = isAll
    ? kb.destinations
    : kb.destinations.filter((d) => d.id === targetId);

  if (targets.length === 0) {
    console.error(`No destination found with id="${targetId}"`);
    process.exit(1);
  }

  if (!isDryRun) {
    console.log(`Backup: ${BACKUP_PATH}`);
    fs.copyFileSync(KB_PATH, BACKUP_PATH);
    console.log('  ✓ Saved\n');
  }

  const log = [];
  let totalInTokens = 0;
  let totalOutTokens = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < targets.length; i++) {
    const dest = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;
    console.log(`${progress} ${dest.id} — ${dest.destination}`);

    try {
      const { parsed, usage } = await enrichDestination(dest, tripStructureRules);
      totalInTokens += usage.input_tokens;
      totalOutTokens += usage.output_tokens;
      consecutiveFailures = 0;

      log.push({
        id: dest.id,
        success: true,
        fields_added: Object.keys(parsed),
        in_tokens: usage.input_tokens,
        out_tokens: usage.output_tokens,
      });

      if (isDryRun) {
        console.log(`  ✓ would add ${Object.keys(parsed).length} fields (${usage.input_tokens}+${usage.output_tokens} tokens)`);
        console.log('');
        console.log('  ─── FULL ENRICHMENT JSON ───');
        const formatted = JSON.stringify(parsed, null, 2)
          .split('\n')
          .map(line => '  ' + line)
          .join('\n');
        console.log(formatted);
        console.log('  ─── END ───');
        console.log('');
      } else {
        const idx = kb.destinations.findIndex((d) => d.id === dest.id);
        kb.destinations[idx] = mergeIntoDestination(dest, parsed, isForce);
        fs.writeFileSync(KB_PATH, JSON.stringify(kb, null, 2));
        const action = isForce ? 'overwrote' : 'enriched';
        console.log(`  ✓ ${action} (${Object.keys(parsed).length} fields, ${usage.input_tokens}+${usage.output_tokens} tokens)`);
      }
    } catch (err) {
      consecutiveFailures++;
      log.push({ id: dest.id, success: false, error: err.message });
      console.log(`  ✗ FAILED: ${err.message.slice(0, 200)}`);

      if (consecutiveFailures >= 3) {
        console.log(`\n  ⚠️  3 consecutive failures — aborting batch.`);
        break;
      }
    }

    if (isAll && i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const costUSD = (totalInTokens * 3 / 1_000_000) + (totalOutTokens * 15 / 1_000_000);

  console.log(`\n${'═'.repeat(63)}`);
  console.log(`COMPLETE`);
  console.log(`${'═'.repeat(63)}`);
  const succeeded = log.filter(l => l.success).length;
  const failed = log.filter(l => !l.success).length;
  console.log(`  Succeeded:   ${succeeded}/${log.length}`);
  if (failed) console.log(`  Failed:      ${failed}/${log.length} (see log for details)`);
  console.log(`  Tokens:      ${totalInTokens.toLocaleString()} in + ${totalOutTokens.toLocaleString()} out`);
  console.log(`  Cost:        $${costUSD.toFixed(4)}`);
  if (!isDryRun) console.log(`  Backup:      ${BACKUP_PATH}`);
  console.log(`  Log:         ${LOG_PATH}\n`);

  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));

  if (!isDryRun) {
    console.log(`Next: node scripts/audit-kb.js   # confirm scores went up\n`);
  }
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
