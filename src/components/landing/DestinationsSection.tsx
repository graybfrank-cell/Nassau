import Link from "next/link";
import Image from "next/image";

const destinations = [
  {
    name: "Scottsdale, AZ",
    price: "from $1,650",
    info: "3N · 3 rounds",
    id: "scottsdale-az",
    img: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Bandon Dunes, OR",
    price: "from $3,200",
    info: "3N · 4 rounds",
    id: "bandon-dunes-or",
    img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Pinehurst, NC",
    price: "from $2,200",
    info: "3N · 3 rounds",
    id: "pinehurst-nc",
    img: "https://images.unsplash.com/photo-1592919355415-9db1cd94b2ba?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Myrtle Beach, SC",
    price: "from $850",
    info: "3N · 4 rounds",
    id: "myrtle-beach-sc",
    img: "https://images.unsplash.com/photo-1600011689032-8b628b8a8747?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Pebble Beach, CA",
    price: "from $3,500",
    info: "3N · 3 rounds",
    id: "pebble-beach-monterey-ca",
    img: "https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "St. Andrews, Scotland",
    price: "from $5,000",
    info: "4N · 3 rounds",
    id: "st-andrews-scotland",
    img: "https://images.unsplash.com/photo-1633078654544-61b3455b9161?q=80&w=800&auto=format&fit=crop",
  },
];

export default function DestinationsSection() {
  return (
    <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          Where to next
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          Explore 50+ golf destinations
        </h2>
        <p className="mt-3 text-[16px] text-[#111111]/60">
          50+ curated golf trips. Real courses. Real pricing.
        </p>

        {/* Horizontal scroll */}
        <div className="mt-10 flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={`/explore#${dest.id}`}
              className="group relative h-[420px] w-[280px] flex-shrink-0 overflow-hidden rounded-2xl sm:w-[320px]"
            >
              <Image
                src={dest.img}
                alt={dest.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Hover button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#111111]">
                  Plan this trip
                </span>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-headline text-[22px] font-medium text-white">
                  {dest.name}
                </h3>
                <p className="mt-1 text-sm text-white/60">{dest.price}</p>
                <p className="text-xs text-white/40">{dest.info}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/explore"
            className="text-sm font-medium text-[#2D5A3D] transition-colors hover:text-[#244B33]"
          >
            See all destinations &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
