"use client";

import { useState } from "react";

interface LayoutSelectorProps {
  courseName: string;
  courseLocation?: string;
  layouts: string[];
  onSelect: (layout: string) => void;
  onCancel: () => void;
}

export default function LayoutSelector({
  courseName,
  courseLocation,
  layouts,
  onSelect,
  onCancel,
}: LayoutSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="font-semibold text-zinc-900">{courseName}</h3>
      {courseLocation && (
        <p className="mt-0.5 text-sm text-zinc-500">{courseLocation}</p>
      )}

      <p className="mt-3 text-sm text-zinc-600">
        This facility has multiple courses. Which layout are you playing?
      </p>

      <div className="mt-3 space-y-2">
        {layouts.map((layout) => (
          <label
            key={layout}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
              selected === layout
                ? "border-emerald-500 bg-emerald-50"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <input
              type="radio"
              name="course-layout"
              value={layout}
              checked={selected === layout}
              onChange={() => setSelected(layout)}
              className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-zinc-900">
              {layout}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
