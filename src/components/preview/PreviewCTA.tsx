import Link from "next/link";

export default function PreviewCTA({
  destinationName,
}: {
  destinationName: string;
}) {
  return (
    <section className="bg-[#111111] px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-headline text-[40px] font-medium leading-[1.05] text-white sm:text-[48px]">
          Plan this trip
          <br />
          on Nassau
        </h2>
        <p className="mt-4 text-[16px] text-[#8A8A8A]">
          {destinationName} is waiting. Be first in line when Nassau opens to
          captains.
        </p>

        <div className="mt-10">
          <Link
            href="/login?next=/trips/new"
            className="inline-block rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#244B33]"
          >
            Plan a trip &rarr;
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/40">
          2,347+ captains already on the list
        </p>
      </div>
    </section>
  );
}
