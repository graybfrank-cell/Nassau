"use client";

import { useState } from "react";
import { Search, Loader2, ImagePlus, Star } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  thumb: string;
  alt?: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

interface PhotoSearchPanelProps {
  onInsert: (url: string, alt: string, photographer: string, photographerUrl: string) => void;
  onSetFeatured: (url: string, alt: string) => void;
}

const CURATED_QUERIES = [
  "golf course",
  "golf green",
  "golf fairway",
  "golf sunset",
  "golf trip",
  "golf resort",
];

export default function PhotoSearchPanel({ onInsert, onSetFeatured }: PhotoSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchPhotos(searchQuery: string) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/admin/photos/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-zinc-700 mb-3">
        Search Photos
      </h4>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchPhotos(query)}
            placeholder="Search for photos..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          onClick={() => searchPhotos(query)}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Curated quick tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CURATED_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuery(q);
              searchPhotos(q);
            }}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results grid */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}

      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100"
            >
              <img
                src={photo.thumb}
                alt={photo.alt || "Photo"}
                className="h-full w-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    onInsert(
                      photo.url,
                      photo.alt || "Golf course photo",
                      photo.photographer,
                      photo.photographerUrl
                    )
                  }
                  className="inline-flex items-center gap-1 rounded bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  <ImagePlus className="h-3 w-3" />
                  Insert
                </button>
                <button
                  onClick={() =>
                    onSetFeatured(photo.url, photo.alt || "Golf course photo")
                  }
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <Star className="h-3 w-3" />
                  Set Featured
                </button>
                <a
                  href={photo.unsplashUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-white/70 hover:text-white"
                >
                  {photo.photographer} / Unsplash
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && photos.length === 0 && (
        <p className="text-center text-sm text-zinc-400 py-4">
          No photos found. Try a different search term.
        </p>
      )}
    </div>
  );
}
