import Link from "next/link";
import Image from "next/image";
import DestinationGridCard from "./DestinationGridCard";
import { getDestinationImageUrl } from "@/lib/destination-images";

// Last-resort Unsplash URLs, used only when the resolver has nothing for a slug.
const featuredDestinations = [
  { name: "Scottsdale, AZ", price: "from $1,650", info: "3N · 3 rounds", id: "scottsdale-az", fallbackImg: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop" },
  { name: "Bandon Dunes, OR", price: "from $3,200", info: "3N · 4 rounds", id: "bandon-dunes-or", fallbackImg: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop" },
  { name: "Pinehurst, NC", price: "from $2,200", info: "3N · 3 rounds", id: "pinehurst-nc", fallbackImg: "https://images.unsplash.com/photo-1592919355415-9db1cd94b2ba?q=80&w=800&auto=format&fit=crop" },
  { name: "Myrtle Beach, SC", price: "from $850", info: "3N · 4 rounds", id: "myrtle-beach-sc", fallbackImg: "https://images.unsplash.com/photo-1600011689032-8b628b8a8747?q=80&w=800&auto=format&fit=crop" },
  { name: "Pebble Beach, CA", price: "from $3,500", info: "3N · 3 rounds", id: "pebble-beach-monterey-ca", fallbackImg: "https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?q=80&w=800&auto=format&fit=crop" },
  { name: "St. Andrews, Scotland", price: "from $5,000", info: "4N · 3 rounds", id: "st-andrews-scotland", fallbackImg: "https://images.unsplash.com/photo-1633078654544-61b3455b9161?q=80&w=800&auto=format&fit=crop" },
];

const gridImageMap: Record<string, string> = {
  "kiawah-island-sc": "/images/destinations/KiwahIslandSCtripcard.png",
  "kohler-wi": "/images/destinations/Kohler%2C%20WI-tripcard.png",
  "reynolds-lake-oconee-ga": "/images/destinations/Reynolds%20Lake%20Oconee%2C%20GATripCard.png",
  "cabo-san-lucas-mx": "/images/destinations/CaboSanLucasTripCard.png",
  "kapalua-maui-hi": "/images/destinations/Kapalua%2C%20HITrip%20Card.png",
  "palm-springs-ca": "/images/destinations/PalmSpringsTripCard.png",
  "hilton-head-sc": "/images/destinations/hilton-head-sc.png",
};

const exploreDestinations = [
  { name: "Kiawah Island, SC", slug: "kiawah-island-sc" },
  { name: "Kohler / Whistling Straits, WI", slug: "kohler-wi" },
  { name: "Reynolds Lake Oconee, GA", slug: "reynolds-lake-oconee-ga" },
  { name: "Cabo San Lucas, MX", slug: "cabo-san-lucas-mx" },
  { name: "Kapalua, Maui, HI", slug: "kapalua-maui-hi" },
  { name: "Palm Springs, CA", slug: "palm-springs-ca" },
  { name: "Hilton Head Island, SC", slug: "hilton-head-sc" },
];

export default function DestinationsSection() {
  return (
    <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Featured destinations */}
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          Featured destinations
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          Where captains are planning
        </h2>

        <div className="mt-10 flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {featuredDestinations.map((dest) => {
            const resolvedImg = getDestinationImageUrl(dest.id) ?? dest.fallbackImg;
            return (
            <Link
              key={dest.id}
              href={`/trip/preview/${dest.id}`}
              className="group relative h-[420px] w-[280px] flex-shrink-0 overflow-hidden rounded-2xl sm:w-[320px]"
            >
              <Image src={resolvedImg} alt={dest.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#111111]">Preview trip →</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-headline text-[22px] font-medium text-white">{dest.name}</h3>
                <p className="mt-1 text-sm text-white/60">{dest.price}</p>
                <p className="text-xs text-white/40">{dest.info}</p>
              </div>
            </Link>
            );
          })}
        </div>

        {/* More destinations grid */}
        <div className="pt-20 lg:pt-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
            More destinations
          </p>
          <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
            Every trip deserves a better captain
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {exploreDestinations.map((dest) => (
              <DestinationGridCard
                key={dest.slug}
                name={dest.name}
                slug={dest.slug}
                imagePath={gridImageMap[dest.slug] ?? ""}
              />
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-[#8A8A8A]">
          50+ more destinations coming at launch
        </p>
      </div>
    </section>
  );
}
