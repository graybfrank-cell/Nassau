"use client";

import Image from "next/image";
import type { TodayPayload } from "@/app/api/trips/[id]/today/route";

type Props = {
  photos: TodayPayload["recent_photos"];
};

export default function TodayPhotos({ photos }: Props) {
  const recent = photos.slice(0, 6);

  return (
    <section className="bg-[#0A0A0A] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h2 className="font-headline text-xl text-cream sm:text-2xl">Photos</h2>
        </header>

        {recent.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-cream/45">
            No photos yet — add some from the trip page
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {recent.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-md bg-cream/[0.04]"
              >
                <Image
                  src={photo.url}
                  alt={`Photo by ${photo.uploaded_by}`}
                  fill
                  sizes="(max-width: 640px) 33vw, 200px"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/85">
                    {photo.uploaded_by}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
