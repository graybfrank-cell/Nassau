/**
 * Detects whether a golf course API response represents a combined facility
 * (e.g. "Jimmy Clay/Roy Kizer") with multiple 18-hole layouts sharing one record.
 *
 * Detection strategy: split each tee name by " - " and look at the prefix.
 * If there are 2+ unique prefixes, the course is combined.
 */

export interface TeeBox {
  name: string;
  gender: string;
  rating: number | null;
  slope: number | null;
  pars: number[];
  yardages: number[];
  handicaps: number[];
}

export interface CourseWithTees {
  id: number | string;
  name: string;
  location: string;
  tees: TeeBox[];
}

/**
 * Returns an array of layout names if the course is a combined facility,
 * or null if it's a normal single-layout course.
 */
export function detectCourseLayouts(course: CourseWithTees): string[] | null {
  if (!course.tees || course.tees.length === 0) return null;

  const prefixes = new Set<string>();

  for (const tee of course.tees) {
    const dashIndex = tee.name.indexOf(" - ");
    if (dashIndex > 0) {
      prefixes.add(tee.name.substring(0, dashIndex).trim());
    }
  }

  // Need at least 2 distinct prefixes to be a combined course
  if (prefixes.size >= 2) {
    return Array.from(prefixes);
  }

  // Fallback: check if the course name itself contains "/"
  if (course.name.includes("/")) {
    const parts = course.name.split("/").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Verify at least some tees match these names as prefixes
      const matching = parts.filter((part) =>
        course.tees.some((t) => t.name.toLowerCase().startsWith(part.toLowerCase()))
      );
      if (matching.length >= 2) return parts;
    }
  }

  return null;
}

/**
 * Filters a course's tee array to only include tees belonging to the selected layout.
 */
export function filterTeesByLayout(tees: TeeBox[], layout: string): TeeBox[] {
  return tees
    .filter((t) => {
      const dashIndex = t.name.indexOf(" - ");
      if (dashIndex > 0) {
        const prefix = t.name.substring(0, dashIndex).trim();
        return prefix.toLowerCase() === layout.toLowerCase();
      }
      return t.name.toLowerCase().startsWith(layout.toLowerCase());
    })
    .map((t) => {
      // Strip the layout prefix from the tee name for cleaner display
      const dashIndex = t.name.indexOf(" - ");
      if (dashIndex > 0) {
        return { ...t, name: t.name.substring(dashIndex + 3).trim() };
      }
      return t;
    });
}
