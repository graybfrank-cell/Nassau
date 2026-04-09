"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface DestinationGridCardProps {
  name: string;
  slug: string;
  imagePath: string;
}

export default function DestinationGridCard({ name, slug, imagePath }: DestinationGridCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/trip/preview/${slug}`}
      className="group relative aspect-square overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
    >
      {imagePath && !imgError ? (
        <Image
          src={imagePath}
          alt={name}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A3D] to-[#1a3625]" />
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-headline text-xl font-medium text-white sm:text-2xl">
          {name}
        </h3>
        <p className="mt-1 font-sans text-xs text-[#F2F0EB]/70">
          Preview trip →
        </p>
      </div>
    </Link>
  );
}
