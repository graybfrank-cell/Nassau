import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-[#111111] px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-headline text-[40px] font-medium leading-tight text-white sm:text-[52px]">
          Your golf trip,
          <br />
          handled.
        </h2>
        <p className="mt-4 text-[16px] text-[#8A8A8A]">
          Plan trips. Track rounds. Settle bets.
        </p>

        {/* Email CTA */}
        <div className="mx-auto mt-10 flex max-w-md items-center overflow-hidden rounded-full bg-white/10 backdrop-blur">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-transparent px-6 py-3.5 text-sm text-white placeholder-white/40 outline-none"
          />
          <Link
            href="/login"
            className="mr-1.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] transition-colors hover:bg-[#244B33]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        {/* Social icons */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {/* X / Twitter */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8A8A8A] transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8A8A8A] transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <a
            href="mailto:grayson@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Feedback
          </a>
          <Link
            href="/privacy"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Terms
          </Link>
          <a
            href="mailto:support@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Support
          </a>
        </div>

        <p className="mt-6 text-xs text-[#8A8A8A]">
          &copy; 2026 Nassau Golf. All rights reserved.
        </p>
      </div>
    </section>
  );
}
