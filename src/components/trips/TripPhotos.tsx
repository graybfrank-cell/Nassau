"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, Loader2, Trash2, ZoomIn } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TripPhoto {
  name: string;
  path: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

interface TripPhotosProps {
  tripId: string;
  currentUserId: string;
  isTripCreator: boolean;
  photos: TripPhoto[];
  onPhotosChange: (photos: TripPhoto[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripPhotos({
  tripId,
  currentUserId,
  isTripCreator,
  photos,
  onPhotosChange,
}: TripPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<TripPhoto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadProgress(30);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setUploadProgress(60);

        const res = await fetch(`/api/trips/${tripId}/photos`, {
          method: "POST",
          body: formData,
        });

        setUploadProgress(90);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data: { url: string; path: string } = await res.json();

        // Add to photos list optimistically
        const newPhoto: TripPhoto = {
          name: file.name,
          path: data.path,
          url: data.url,
          uploadedBy: currentUserId,
          createdAt: new Date().toISOString(),
        };

        onPhotosChange([newPhoto, ...photos]);
        setUploadProgress(100);
      } catch (err) {
        console.error("Upload failed:", err);
        alert(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setUploadProgress(0);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [tripId, currentUserId, photos, onPhotosChange]
  );

  const handleDelete = useCallback(
    async (photo: TripPhoto) => {
      if (!confirm("Delete this photo?")) return;

      setDeleting(photo.path);

      try {
        const res = await fetch(`/api/trips/${tripId}/photos`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: photo.path }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delete failed");
        }

        // Remove from list optimistically
        onPhotosChange(photos.filter((p) => p.path !== photo.path));

        if (lightboxPhoto?.path === photo.path) {
          setLightboxPhoto(null);
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setDeleting(null);
      }
    },
    [tripId, photos, onPhotosChange, lightboxPhoto]
  );

  const canDelete = (photo: TripPhoto): boolean => {
    return photo.uploadedBy === currentUserId || isTripCreator;
  };

  // Empty state
  if (photos.length === 0 && !uploading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <Camera className="mx-auto h-10 w-10 text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">
          No photos yet. Be the first to capture the trip.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2D5A3D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#244A32]">
          <Upload className="h-4 w-4" />
          Upload Photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>
    );
  }

  return (
    <div>
      {/* Upload bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700">
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-[#2D5A3D] transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Photo grid: 3 columns mobile, 4 desktop */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.path}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-zinc-800"
            onClick={() => setLightboxPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            <div className="absolute bottom-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-4 w-4 text-white drop-shadow" />
            </div>
            {canDelete(photo) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo);
                }}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                disabled={deleting === photo.path}
              >
                {deleting === photo.path ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.name}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {canDelete(lightboxPhoto) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(lightboxPhoto);
              }}
              className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              disabled={deleting === lightboxPhoto.path}
            >
              {deleting === lightboxPhoto.path ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
