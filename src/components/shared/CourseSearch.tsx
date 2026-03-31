"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Keyboard } from "lucide-react";

export interface CourseInfo {
  id: string;
  name: string;
  location: string;
  holes: number | null;
  lat?: number;
  lng?: number;
}

interface CourseSearchProps {
  value: string;
  onChange: (value: string) => void;
  onCourseSelect?: (course: CourseInfo) => void;
  placeholder?: string;
}

export default function CourseSearch({
  value,
  onChange,
  onCourseSelect,
  placeholder = "Search for a course…",
}: CourseSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/course-search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();

      if (data.error) {
        setApiDown(true);
        setResults([]);
      } else {
        setResults(data.courses || []);
        setApiDown((data.courses || []).length === 0 && q.trim().length >= 3);
      }
      setOpen(true);
    } catch {
      setApiDown(true);
      setResults([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (manualMode) {
      onChange(val);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function selectCourse(course: CourseInfo) {
    setQuery(course.name);
    onChange(course.name);
    onCourseSelect?.(course);
    setOpen(false);
    setResults([]);
  }

  function switchToManual() {
    setManualMode(true);
    setOpen(false);
    setResults([]);
    // Keep whatever the user typed so far
    onChange(query);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => {
            if (!manualMode && results.length > 0) setOpen(true);
          }}
          placeholder={manualMode ? "Type the course name" : placeholder}
          className="block w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#2D5A3D] focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/20"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {open && !manualMode && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((course) => (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => selectCourse(course)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2D5A3D]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {course.name}
                      </p>
                      {course.location && (
                        <p className="text-xs text-zinc-400 truncate">
                          {course.location}
                          {course.holes ? ` · ${course.holes} holes` : ""}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center">
              {apiDown ? (
                <p className="text-xs text-zinc-400">
                  Course search is temporarily unavailable.
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  No courses found for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Manual entry fallback */}
          <div className="border-t border-zinc-100">
            <button
              type="button"
              onClick={switchToManual}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-50"
            >
              <Keyboard className="h-3.5 w-3.5" />
              Type the course name manually
            </button>
          </div>
        </div>
      )}

      {/* Manual mode indicator */}
      {manualMode && (
        <button
          type="button"
          onClick={() => {
            setManualMode(false);
            setApiDown(false);
          }}
          className="mt-1 text-xs text-[#2D5A3D] hover:text-[#2D5A3D]"
        >
          Switch back to search
        </button>
      )}
    </div>
  );
}
