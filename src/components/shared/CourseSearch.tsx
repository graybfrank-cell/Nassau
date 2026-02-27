"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin } from "lucide-react";

interface CourseSearchProps {
  onSelect: (course: {
    name: string;
    id?: string;
    location?: string;
    lat?: number;
    lng?: number;
  }) => void;
  placeholder?: string;
  allowFreeText?: boolean;
  initialValue?: string;
}

interface CourseResult {
  id: string;
  name: string;
  location: string;
  lat?: number;
  lng?: number;
}

export default function CourseSearch({
  onSelect,
  placeholder = "Search courses...",
  allowFreeText = true,
  initialValue = "",
}: CourseSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // On blur, if free text is allowed and no course was selected, emit the text
        if (allowFreeText && query.trim()) {
          onSelect({ name: query.trim() });
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, allowFreeText]);

  function handleInputChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Use a simple search approach - try GolfCourseAPI if available
        const res = await fetch(
          `/api/course-search?q=${encodeURIComponent(value.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.courses || []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      }
      setLoading(false);
      setIsOpen(true);
    }, 300);
  }

  function handleSelect(course: CourseResult) {
    setQuery(course.name);
    setIsOpen(false);
    onSelect({
      name: course.name,
      id: course.id,
      location: course.location,
      lat: course.lat,
      lng: course.lng,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {results.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {course.name}
                </p>
                {course.location && (
                  <p className="text-xs text-zinc-500">{course.location}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !loading && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
          <p className="text-sm text-zinc-500">
            No courses found.{" "}
            {allowFreeText && "Type the course name manually."}
          </p>
        </div>
      )}
    </div>
  );
}
