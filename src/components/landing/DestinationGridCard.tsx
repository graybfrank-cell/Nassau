import Link from "next/link";

interface DestinationGridCardProps {
  name: string;
  slug: string;
}

export default function DestinationGridCard({ name, slug }: DestinationGridCardProps) {
  return (
    <Link
      href={`/trip/preview/${slug}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
    >
      {/* Placeholder gradient — swap for real images later */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A3D] to-[#1a3625]" />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Destination name */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-headline text-[20px] font-medium text-white">
          {name}
        </h3>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white/60 transition-colors group-hover:text-[#B8976A]">
          Preview trip →
        </p>
      </div>
    </Link>
  );
}
