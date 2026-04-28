import Link from "next/link";

export const metadata = {
  title: "Private Beta | Nassau",
  description: "Nassau is in private beta. We'll open access soon.",
};

export default function PrivateBetaPage() {
  return (
    <main className="min-h-screen bg-[#F2F0EB] flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
          PRIVATE BETA
        </div>
        <h1 className="font-serif text-4xl text-[#111111] mb-4">
          Nassau is invitation-only right now.
        </h1>
        <p className="text-[15px] leading-relaxed text-[#111111]/70 mb-8">
          We&apos;re testing with a small group of captains before opening up. If you&apos;re a golf trip captain who wants early access, drop your email and we&apos;ll be in touch.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-[#2D5A3D] px-6 py-3 text-white font-semibold text-[15px] hover:bg-[#244a31] transition"
        >
          ← Back to home
        </Link>

        <p className="mt-6 text-[12px] text-[#111111]/50">
          Already have access? Make sure you&apos;re logged in with the right email.
        </p>
      </div>
    </main>
  );
}
