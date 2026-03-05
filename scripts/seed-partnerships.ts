/**
 * Script to generate SQL INSERT statements for seeding marketing_partnerships
 * from the Nassau knowledge base.
 *
 * Usage: npx tsx scripts/seed-partnerships.ts > seed-partnerships.sql
 *
 * Or just run it and copy the output into the Supabase SQL Editor.
 */

import { readFileSync } from "fs";
import { join } from "path";

const kbPath = join(__dirname, "../src/data/nassau-knowledge-base.json");
const raw = readFileSync(kbPath, "utf-8");
const kb = JSON.parse(raw);

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

const inserts: string[] = [];

for (const dest of kb.destinations) {
  const destination = dest.destination || dest.name || "";
  const region = dest.region || "";
  const destId = dest.id || "";

  // top_courses
  if (Array.isArray(dest.top_courses)) {
    for (const course of dest.top_courses) {
      // Only include entries that look like actual golf courses (have greens_fee_range or tags with golf-related terms)
      if (!course.name) continue;
      // Skip lodging, restaurants, etc. that might appear in hidden_gems
      const tags = course.tags || [];
      const isLodging =
        tags.includes("lodging") ||
        tags.includes("restaurant") ||
        tags.includes("dining") ||
        tags.includes("bar");
      if (isLodging) continue;

      inserts.push(
        `INSERT INTO marketing_partnerships (course_name, destination, region, course_type, tier, outreach_status, kb_destination_id) VALUES ('${escapeSQL(course.name)}', '${escapeSQL(destination)}', '${escapeSQL(region)}', 'top_course', 'standard', 'not_contacted', '${escapeSQL(destId)}');`
      );
    }
  }

  // hidden_gems — only actual courses, not lodging/restaurants
  if (Array.isArray(dest.hidden_gems)) {
    for (const gem of dest.hidden_gems) {
      if (!gem.name) continue;
      // Filter out non-course entries by checking for greens_fee_range or golf-related tags
      const tags = gem.tags || [];
      const hasGreensFee = !!gem.greens_fee_range;
      const isGolfCourse =
        hasGreensFee ||
        tags.some(
          (t: string) =>
            t === "muni" ||
            t === "budget" ||
            t === "value" ||
            t === "hidden_gem" ||
            t === "public" ||
            t === "resort" ||
            t === "links" ||
            t === "championship" ||
            t === "must_play" ||
            t === "desert" ||
            t === "challenging" ||
            t === "parkland" ||
            t === "mountain" ||
            t === "coastal" ||
            t === "island"
        );
      if (!isGolfCourse) continue;

      inserts.push(
        `INSERT INTO marketing_partnerships (course_name, destination, region, course_type, tier, outreach_status, kb_destination_id) VALUES ('${escapeSQL(gem.name)}', '${escapeSQL(destination)}', '${escapeSQL(region)}', 'hidden_gem', 'standard', 'not_contacted', '${escapeSQL(destId)}');`
      );
    }
  }
}

console.log("-- Seed marketing_partnerships from Nassau Knowledge Base");
console.log(`-- Generated: ${new Date().toISOString()}`);
console.log(`-- Total rows: ${inserts.length}`);
console.log("");
for (const sql of inserts) {
  console.log(sql);
}
