import type { Course } from "@/lib/destination-utils";

function difficultyColor(difficulty: string) {
  if (difficulty.includes("hard")) return "text-[#C4423B]";
  if (difficulty.includes("moderate")) return "text-[#B8976A]";
  return "text-[#2D5A3D]";
}

function ratingDots(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const dots: string[] = [];
  for (let i = 0; i < full; i++) dots.push("●");
  if (half) dots.push("◐");
  return dots.join("");
}

export default function PreviewCourses({ courses }: { courses: Course[] }) {
  const display = (courses ?? []).slice(0, 5);
  if (display.length === 0) return null;

  return (
    <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          Top courses
        </p>
        <h2 className="mt-3 font-headline text-[32px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[36px]">
          Where you&apos;ll play
        </h2>

        <div className="mt-10 space-y-6">
          {display.map((course, i) => (
            <div
              key={course.name}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#8A8A8A]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-headline text-[20px] font-medium text-[#111111]">
                      {course.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#8A8A8A]">
                    {course.must_know}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-[#2D5A3D]">
                  {course.greens_fee_range}
                </span>
              </div>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#8A8A8A]">
                <span className={difficultyColor(course.difficulty)}>
                  {course.difficulty}
                </span>
                {course.designer && <span>Design: {course.designer}</span>}
                {course.condition_rating && (
                  <span title={`Condition: ${course.condition_rating}/5`}>
                    Condition {ratingDots(course.condition_rating)}
                  </span>
                )}
                {course.scenery_rating && (
                  <span title={`Scenery: ${course.scenery_rating}/5`}>
                    Scenery {ratingDots(course.scenery_rating)}
                  </span>
                )}
              </div>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#2D5A3D]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#2D5A3D]"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
