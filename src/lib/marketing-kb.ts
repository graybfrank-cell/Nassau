import { readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedKB: any = null;

/**
 * Load the Nassau knowledge base JSON file.
 * Returns null if the file doesn't exist or is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadKnowledgeBase(): any {
  if (cachedKB) return cachedKB;
  try {
    const filePath = join(process.cwd(), "src/data/nassau-knowledge-base.json");
    const raw = readFileSync(filePath, "utf-8");
    cachedKB = JSON.parse(raw);
    return cachedKB;
  } catch {
    return null;
  }
}

/**
 * Find a destination by ID or slug in the knowledge base.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findDestination(destinationId: string): any {
  const kb = loadKnowledgeBase();
  if (!kb) return null;
  const destinations = kb.destinations || kb;
  if (!Array.isArray(destinations)) return null;
  return destinations.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => d.id === destinationId || d.slug === destinationId
  ) || null;
}
