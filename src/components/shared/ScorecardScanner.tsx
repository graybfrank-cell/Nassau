"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";

interface ScannedPlayer {
  name: string;
  holes: number[];
}

interface ScorecardScannerProps {
  scanEndpoint: string;
  onScanned: (players: ScannedPlayer[]) => void;
}

export default function ScorecardScanner({
  scanEndpoint,
  onScanned,
}: ScorecardScannerProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleScan() {
    if (!fileRef.current?.files?.[0]) return;
    setScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", fileRef.current.files[0]);

    try {
      const res = await fetch(scanEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Scan failed");
      }

      const data = await res.json();
      if (data.players && Array.isArray(data.players)) {
        onScanned(data.players);
        handleClose();
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <Camera className="h-3.5 w-3.5" />
        Scan Scorecard
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Scan Scorecard Photo
        </h3>
        <button
          onClick={handleClose}
          className="rounded-md p-1 text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {!preview ? (
        <div className="flex flex-col items-center gap-3">
          <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-8 transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
            <Upload className="h-8 w-8 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-600">
              Upload or take a photo
            </span>
            <span className="text-xs text-zinc-400">
              JPG, PNG, or WEBP up to 20 MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div>
          <div className="relative rounded-lg overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Scorecard preview"
              className="w-full max-h-64 object-contain"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D5A3D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#244A32] disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reading scores...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Scan Scores
                </>
              )}
            </button>
            <button
              onClick={() => {
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              disabled={scanning}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
