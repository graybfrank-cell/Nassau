import Image from "next/image";
import { ReactNode } from "react";

type HeroBackdropProps = {
  src: string;
  alt: string;
  children: ReactNode;
  height?: "sm" | "md" | "lg";
  priority?: boolean;
};

const heightMap: Record<NonNullable<HeroBackdropProps["height"]>, string> = {
  sm: "h-[280px] md:h-[340px]",
  md: "h-[360px] md:h-[440px]",
  lg: "h-[440px] md:h-[560px]",
};

export function HeroBackdrop({
  src,
  alt,
  children,
  height = "md",
  priority = false,
}: HeroBackdropProps) {
  return (
    <div className={`relative w-full ${heightMap[height]} overflow-hidden`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(17,17,17,0.85) 0%, rgba(17,17,17,0.55) 35%, rgba(17,17,17,0.15) 70%, rgba(17,17,17,0) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 max-w-7xl mx-auto">
        <div className="text-white">{children}</div>
      </div>
    </div>
  );
}
