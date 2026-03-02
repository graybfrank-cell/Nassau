"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface CourseResult {
  id: number;
  name: string;
  location: string;
}

interface TeeBox {
  name: string;
  gender: string;
  rating: number | null;
  slope: number | null;
  pars: number[];
  yardages: number[];
  handicaps: number[];
}

interface CourseDetails {
  id: number;
  name: string;
  location: string;
  tees: TeeBox[];
}

interface CourseSearchProps {
  onSelect: (data: {
    courseName: string;
    courseApiId: number | null;
    teeName: string;
    pars: number[];
    yardages: number[];
    handicaps: number[];
  }) => void;
  initialCourseName?: string;
}

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

export default function CourseSearch({ onSelect, initialCourseName = "" }: CourseSearchProps) {
  const [query, setQuery] = useState(initialCourseName);
  const [results, setResults] = useState<CourseResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedTee, setSelectedTee] = useState<string>("");
  const [isManual, setIsManual] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      }
    } catch {
      // silently fail
    }
    setSearching(false);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedCourse(null);
    setIsManual(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 500);
  }

  async function handleSelectCourse(course: CourseResult) {
    setQuery(course.name);
    setShowDropdown(false);
    setLoadingDetails(true);
    setIsManual(false);

    try {
      const res = await fetch("/api/courses/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (res.ok) {
        const details: CourseDetails = await res.json();
        setSelectedCourse(details);
        // Auto-select first tee matching gender
        const filtered = details.tees.filter((t) => t.gender === gender);
        if (filtered.length > 0) {
          setSelectedTee(filtered[0].name);
          emitSelection(details, filtered[0]);
        } else if (details.tees.length > 0) {
          setSelectedTee(details.tees[0].name);
          emitSelection(details, details.tees[0]);
        }
      }
    } catch {
      // silently fail
    }
    setLoadingDetails(false);
  }

  function emitSelection(course: CourseDetails, tee: TeeBox) {
    onSelect({
      courseName: course.name,
      courseApiId: course.id,
      teeName: tee.name,
      pars: tee.pars.length === 18 ? tee.pars : DEFAULT_PARS,
      yardages: tee.yardages.length === 18 ? tee.yardages : [],
      handicaps: tee.handicaps.length === 18 ? tee.handicaps : [],
    });
  }

  function handleTeeChange(teeName: string) {
    setSelectedTee(teeName);
    if (!selectedCourse) return;
    const tee = selectedCourse.tees.find((t) => t.name === teeName);
    if (tee) emitSelection(selectedCourse, tee);
  }

  function handleGenderChange(g: "male" | "female") {
    setGender(g);
    if (!selectedCourse) return;
    const filtered = selectedCourse.tees.filter((t) => t.gender === g);
    if (filtered.length > 0) {
      setSelectedTee(filtered[0].name);
      emitSelection(selectedCourse, filtered[0]);
    }
  }

  function handleManual() {
    setIsManual(true);
    setSelectedCourse(null);
    setShowDropdown(false);
    onSelect({
      courseName: query.trim(),
      courseApiId: null,
      teeName: "",
      pars: DEFAULT_PARS,
      yardages: [],
      handicaps: [],
    });
  }

  function handleClear() {
    setQuery("");
    setSelectedCourse(null);
    setResults([]);
    setIsManual(false);
    setSelectedTee("");
    onSelect({
      courseName: "",
      courseApiId: null,
      teeName: "",
      pars: DEFAULT_PARS,
      yardages: [],
      handicaps: [],
    });
  }

  const filteredTees = selectedCourse
    ? selectedCourse.tees.filter((t) => t.gender === gender)
    : [];

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">Course Name</label>
        <div className="relative mt-1" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search courses..."
              className="block w-full rounded-lg border border-zinc-300 pl-9 pr-8 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
              <ul className="max-h-48 overflow-y-auto py-1">
                {results.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 transition-colors"
                    >
                      <div className="font-medium text-zinc-900">{course.name}</div>
                      {course.location && (
                        <div className="text-xs text-zinc-400">{course.location}</div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-100 px-3 py-2">
                <button
                  type="button"
                  onClick={handleManual}
                  className="text-xs text-zinc-500 hover:text-emerald-600 transition-colors"
                >
                  Use &quot;{query}&quot; as manual entry
                </button>
              </div>
            </div>
          )}
        </div>
        {searching && (
          <p className="mt-1 text-xs text-zinc-400">Searching...</p>
        )}
        {isManual && (
          <p className="mt-1 text-xs text-amber-600">Manual entry — pars default to standard</p>
        )}
      </div>

      {/* Loading indicator */}
      {loadingDetails && (
        <p className="text-xs text-zinc-400">Loading course details...</p>
      )}

      {/* Tee selector */}
      {selectedCourse && selectedCourse.tees.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tee Box</label>
          <div className="mt-1 flex items-center gap-3">
            {/* Gender toggle */}
            <div className="flex rounded-md border border-zinc-300 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => handleGenderChange("male")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  gender === "male"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Men
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange("female")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  gender === "female"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Women
              </button>
            </div>

            {/* Tee dropdown */}
            <div className="relative flex-1">
              <select
                value={selectedTee}
                onChange={(e) => handleTeeChange(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-1.5 pr-8 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {filteredTees.map((tee) => (
                  <option key={tee.name} value={tee.name}>
                    {tee.name}
                    {tee.rating ? ` (${tee.rating}/${tee.slope})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
          {filteredTees.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No {gender === "male" ? "men's" : "women's"} tees available — try the other gender
            </p>
          )}
        </div>
      )}
    </div>
  );
}
