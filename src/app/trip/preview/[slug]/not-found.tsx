import Link from "next/link";

export default function PreviewNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F2F0EB] px-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
        Coming soon
      </p>
      <h1 className="mt-4 font-headline text-[40px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[48px]">
        Destination not found
      </h1>
      <p className="mt-4 max-w-md text-[16px] text-[#8A8A8A]">
        We&apos;re adding new golf destinations every week. This one isn&apos;t
        ready yet &mdash; but it will be soon.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#244B33]"
        >
          Back to Nassau
        </Link>
        <Link
          href="/login?next=/trips/new"
          className="rounded-full border border-[#111111]/20 px-8 py-3.5 text-sm font-medium text-[#111111] transition-colors hover:border-[#2D5A3D] hover:text-[#2D5A3D]"
        >
          Plan a trip →
        </Link>
      </div>
    </main>
  );
}
