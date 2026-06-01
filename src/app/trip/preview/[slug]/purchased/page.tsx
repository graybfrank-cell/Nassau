import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDestinationBySlug, type Destination } from "@/lib/destination-utils";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata: Metadata = {
  title: "Your kit is unlocked — Nassau",
  description: "Your Captain's Kit purchase is confirmed.",
};

export default async function PurchaseSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { session_id } = await searchParams;
  const dest: Destination | null = getDestinationBySlug(slug);

  if (!dest) {
    return notFound();
  }

  const kitTitle = dest.kit_title ?? dest.destination;

  return (
    <main className="min-h-screen bg-[#F2F0EB]">
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          Your kit is unlocked
        </p>

        <h1 className="mt-4 font-headline text-[40px] font-medium leading-[1.05] tracking-tight text-[#111111] sm:text-[52px]">
          {kitTitle}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#3A3A3A]">
          Thanks for picking up the Captain&apos;s Kit for {dest.destination}. Your $29 purchase is confirmed, and your kit is yours.
        </p>

        <div className="mt-12 rounded-2xl border border-[#111111]/10 bg-white/50 p-8 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
            What happens next
          </p>
          <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-[#3A3A3A]">
            <li>
              <span className="font-medium text-[#111111]">Check your inbox.</span> A confirmation email is on its way with your full kit access.
            </li>
            <li>
              <span className="font-medium text-[#111111]">Stripe receipt.</span> A separate email from Stripe with your $29 charge details — for your records.
            </li>
            <li>
              <span className="font-medium text-[#111111]">Got questions?</span> Email me directly at{" "}
              <a href="mailto:support@nassau.golf" className="underline">
                support@nassau.golf
              </a>
              .
            </li>
          </ol>
        </div>

        <p className="mt-12 text-[13px] italic text-[#5A5A5A]">
          Show up and run the trip.
        </p>
        <p className="mt-2 text-[13px] text-[#5A5A5A]">— Grayson, founder of Nassau</p>

        <div className="mt-16 border-t border-[#111111]/10 pt-8">
          <Link
            href="/"
            className="text-[14px] text-[#5A5A5A] underline transition-colors hover:text-[#111111]"
          >
            ← Back to Nassau
          </Link>
        </div>

        {session_id && (
          <p className="mt-12 text-[10px] uppercase tracking-[0.08em] text-[#5A5A5A]/40">
            Reference: {session_id.slice(0, 20)}...
          </p>
        )}
      </section>
    </main>
  );
}
