#!/usr/bin/env node

/**
 * Golf Course Par Data Audit
 *
 * Queries GolfCourseAPI.com for each course, checks whether hole-by-hole
 * par data is available, and writes the results to course-par-audit.md.
 *
 * Usage:  node audit-course-pars.mjs
 * Requires: Node 18+ (uses native fetch)
 */

const API_KEY = "GTN32K6AKZQGYO2C7ZSIV66C7I";
const BASE = "https://golfcourseapi.com/v1";
const DELAY_MS = 500;

const COURSES = [
  "TPC Scottsdale Stadium",
  "TPC Scottsdale Champions",
  "We-Ko-Pa Saguaro",
  "We-Ko-Pa Cholla",
  "Pinehurst No. 2",
  "Pinehurst No. 4",
  "Pinehurst No. 8",
  "Pebble Beach Golf Links",
  "Spyglass Hill",
  "Kiawah Island Ocean Course",
  "Kiawah Island Osprey Point",
  "Bandon Dunes",
  "Pacific Dunes",
  "Old Macdonald",
  "Bandon Trails",
  "Streamsong Red",
  "Streamsong Blue",
  "Streamsong Black",
  "Torrey Pines South",
  "Torrey Pines North",
  "Bethpage Black",
  "Bethpage Red",
  "Whistling Straits",
  "Erin Hills",
  "TPC Sawgrass Stadium",
  "TPC Sawgrass Dye's Valley",
  "Harbour Town Golf Links",
  "Caledonia Golf & Fish Club",
  "Arcadia Bluffs",
  "Forest Dunes",
  "Sand Valley",
  "Mammoth Dunes",
  "Myrtle Beach National King's North",
  "Barefoot Resort Dye Course",
  "Barefoot Resort Fazio Course",
  "RTJ Golf Trail Capitol Hill Judge",
  "RTJ Golf Trail Ross Bridge",
  "Chambers Bay",
  "Gamble Sands",
  "Pasatiempo",
  "Half Moon Bay Old Course",
];

const headers = { Authorization: `Key ${API_KEY}` };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extract par array from a course detail response.
 * GolfCourseAPI nests hole data in various possible shapes — try them all.
 */
function extractPars(course) {
  // Shape 1: course.holes is an array of { hole_number, par, ... }
  if (Array.isArray(course.holes) && course.holes.length > 0) {
    const sorted = [...course.holes].sort(
      (a, b) => (a.hole_number ?? a.number ?? 0) - (b.hole_number ?? b.number ?? 0)
    );
    const pars = sorted.map((h) => h.par).filter((p) => typeof p === "number");
    if (pars.length > 0) return pars;
  }

  // Shape 2: course.scorecard or course.scorecards contains tee-specific data
  const scorecards = course.scorecard ?? course.scorecards;
  if (scorecards) {
    // Could be an array of tee objects
    const teeData = Array.isArray(scorecards) ? scorecards[0] : scorecards;
    if (teeData) {
      // Shape 2a: teeData.holes array
      if (Array.isArray(teeData.holes)) {
        const sorted = [...teeData.holes].sort(
          (a, b) => (a.hole_number ?? a.number ?? 0) - (b.hole_number ?? b.number ?? 0)
        );
        const pars = sorted.map((h) => h.par).filter((p) => typeof p === "number");
        if (pars.length > 0) return pars;
      }
      // Shape 2b: teeData is { "1": { par: 4, ... }, "2": { par: 3, ... } }
      const numericKeys = Object.keys(teeData).filter((k) => /^\d+$/.test(k));
      if (numericKeys.length > 0) {
        const sorted = numericKeys.sort((a, b) => Number(a) - Number(b));
        const pars = sorted.map((k) => teeData[k]?.par).filter((p) => typeof p === "number");
        if (pars.length > 0) return pars;
      }
    }
  }

  // Shape 3: course.tees array, each tee has holes
  if (Array.isArray(course.tees) && course.tees.length > 0) {
    for (const tee of course.tees) {
      if (Array.isArray(tee.holes) && tee.holes.length > 0) {
        const sorted = [...tee.holes].sort(
          (a, b) => (a.hole_number ?? a.number ?? 0) - (b.hole_number ?? b.number ?? 0)
        );
        const pars = sorted.map((h) => h.par).filter((p) => typeof p === "number");
        if (pars.length > 0) return pars;
      }
    }
  }

  // Shape 4: walk the entire object looking for a "par" array-like structure
  const json = JSON.stringify(course);
  if (json.includes('"par"')) {
    // Deep search: find any array of objects with par fields
    function findParsDeep(obj, depth = 0) {
      if (depth > 5 || !obj || typeof obj !== "object") return null;
      if (Array.isArray(obj)) {
        const pars = obj
          .filter((item) => item && typeof item === "object" && typeof item.par === "number")
          .sort((a, b) => (a.hole_number ?? a.number ?? 0) - (b.hole_number ?? b.number ?? 0))
          .map((item) => item.par);
        if (pars.length >= 9) return pars;
      }
      for (const val of Object.values(obj)) {
        const result = findParsDeep(val, depth + 1);
        if (result) return result;
      }
      return null;
    }
    const deepPars = findParsDeep(course);
    if (deepPars) return deepPars;
  }

  return null;
}

async function searchCourse(query) {
  const url = `${BASE}/search?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return { error: `Search returned ${res.status}` };
  const data = await res.json();

  // The response might be { courses: [...] } or just an array
  const courses = Array.isArray(data) ? data : data.courses ?? data.results ?? [];
  if (courses.length === 0) return { error: "No results" };
  return { course: courses[0] };
}

async function getCourseDetail(courseId) {
  const url = `${BASE}/courses/${courseId}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return { error: `Detail returned ${res.status}` };
  return await res.json();
}

async function auditCourse(searchName) {
  // Step 1: Search
  const searchResult = await searchCourse(searchName);
  if (searchResult.error) {
    return { searchName, matchedName: null, error: searchResult.error, pars: null };
  }

  const hit = searchResult.course;
  const courseId = hit.id ?? hit.course_id ?? hit.courseId;
  const matchedName =
    hit.name ?? hit.course_name ?? hit.courseName ?? hit.club_name ?? "Unknown";

  if (!courseId) {
    return { searchName, matchedName, error: "No course ID in result", pars: null };
  }

  await sleep(DELAY_MS);

  // Step 2: Get detail
  const detail = await getCourseDetail(courseId);
  if (detail.error) {
    return { searchName, matchedName, error: detail.error, pars: null };
  }

  // Step 3: Extract pars
  const pars = extractPars(detail);
  return { searchName, matchedName, error: null, pars };
}

// --- Main ---

async function main() {
  console.log(`Auditing ${COURSES.length} courses against GolfCourseAPI.com...\n`);

  const results = [];

  for (let idx = 0; idx < COURSES.length; idx++) {
    const name = COURSES[idx];
    process.stdout.write(`[${idx + 1}/${COURSES.length}] ${name}... `);

    try {
      const result = await auditCourse(name);
      results.push(result);

      if (result.error) {
        console.log(`MISSING (${result.error})`);
      } else if (result.pars) {
        console.log(`YES [${result.pars.join(",")}]`);
      } else {
        console.log("NO par data in response");
      }
    } catch (err) {
      const msg = err.name === "TimeoutError" ? "Timeout" : err.message;
      results.push({ searchName: name, matchedName: null, error: msg, pars: null });
      console.log(`ERROR (${msg})`);
    }

    if (idx < COURSES.length - 1) await sleep(DELAY_MS);
  }

  // --- Generate report ---
  const found = results.filter((r) => r.pars && r.pars.length > 0);
  const missing = results.filter((r) => !r.pars || r.pars.length === 0);

  const lines = [];
  lines.push("# Golf Course Par Data Audit");
  lines.push("");
  lines.push(`**Date:** ${new Date().toISOString().split("T")[0]}`);
  lines.push(`**API:** GolfCourseAPI.com (v1)`);
  lines.push(`**Courses tested:** ${COURSES.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total courses tested | ${COURSES.length} |`);
  lines.push(`| Par data available | ${found.length} |`);
  lines.push(`| Par data missing | ${missing.length} |`);
  lines.push(`| Coverage | ${((found.length / COURSES.length) * 100).toFixed(1)}% |`);
  lines.push("");
  lines.push("## Detailed Results");
  lines.push("");
  lines.push("### Par Data Available");
  lines.push("");

  if (found.length === 0) {
    lines.push("_None_");
    lines.push("");
  } else {
    lines.push("| # | Searched | Matched | Holes | Par Array |");
    lines.push("|---|----------|---------|-------|-----------|");
    found.forEach((r, i) => {
      const holes = r.pars.length;
      lines.push(
        `| ${i + 1} | ${r.searchName} | ${r.matchedName} | ${holes} | \`[${r.pars.join(",")}]\` |`
      );
    });
    lines.push("");
  }

  lines.push("### Missing");
  lines.push("");

  if (missing.length === 0) {
    lines.push("_None_");
    lines.push("");
  } else {
    lines.push("| # | Searched | Matched | Reason |");
    lines.push("|---|----------|---------|--------|");
    missing.forEach((r, i) => {
      const matched = r.matchedName || "—";
      const reason = r.error || "No par data in API response";
      lines.push(`| ${i + 1} | ${r.searchName} | ${matched} | ${reason} |`);
    });
    lines.push("");
  }

  // Also dump first course's raw structure for debugging
  lines.push("## Notes");
  lines.push("");
  lines.push("- API key: `GTN32K6AKZQGYO2C7ZSIV66C7I`");
  lines.push("- 500ms delay between API calls to avoid rate limiting");
  lines.push("- Par data extracted from first tee/scorecard when multiple exist");
  lines.push("- 9-hole courses will show 9 pars, 18-hole courses show 18");
  lines.push("");

  const report = lines.join("\n");

  const fs = await import("fs");
  fs.writeFileSync("course-par-audit.md", report);
  console.log(`\nReport saved to course-par-audit.md`);
  console.log(`  Found: ${found.length}/${COURSES.length}  Missing: ${missing.length}/${COURSES.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
