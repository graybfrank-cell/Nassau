'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Check, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function FoundingMemberPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    if (!email) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (!error) {
        setSubmitted(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* DARK HERO */}
      <section className="relative min-h-[90vh] flex flex-col justify-end pt-24 pb-16 px-6 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1762980966910-d854b689726e?q=80&w=2232&auto=format&fit=crop"
          fill
          className="object-cover"
          priority
          alt="Golf course at golden hour"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181B]/40 to-[#18181B]/95" />

        <div className="relative z-10 max-w-xl mx-auto w-full flex flex-col gap-6">
          <div>
            <span className="inline-block bg-[#D94F2B] text-white font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full mb-6 uppercase">
              88 SPOTS REMAINING
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#F3EDE4] leading-none">
              FOUNDING
              <br />
              MEMBERS
              <br />
              ONLY.
            </h1>
            <p className="text-[#F3EDE4]/80 text-lg mt-4">
              Lock in $49.99/year before prices go up. Forever.
            </p>
          </div>

          {submitted ? (
            <p className="text-[#0D7377] text-center text-lg font-bold">
              Check your email! Magic link sent.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                className="w-full bg-[#18181B]/60 border border-[#F3EDE4]/30 text-[#F3EDE4] px-6 py-4 rounded-lg focus:ring-2 focus:ring-[#D94F2B] focus:border-transparent placeholder:text-gray-500"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="w-full bg-[#D94F2B] hover:opacity-90 text-white font-black text-lg py-5 rounded-lg transition-all uppercase"
                onClick={handleClaim}
                disabled={loading}
              >
                {loading ? 'SENDING...' : 'CLAIM MY SPOT'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CREAM BODY */}
      <section className="bg-[#F3EDE4] py-24 px-6">
        {/* BENEFITS BLOCK */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#18181B] mb-10">
            WHAT YOU GET
          </h2>
          <div className="flex flex-col gap-8">
            {[
              'Nassau Pro free for 30 days',
              '$49.99/year locked in — never increases',
              'Founding Member badge on your profile',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-5">
                <div className="bg-[#0D7377]/10 p-2 rounded-lg">
                  <CheckCircle2 className="text-[#0D7377] w-6 h-6" />
                </div>
                <span className="text-lg text-[#18181B] font-bold">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING COMPARISON */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Commissioner Card */}
          <div className="bg-white/50 border border-gray-300 rounded-2xl p-8 flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest text-[#71717A] mb-2">
              COMMISSIONER
            </span>
            <div className="text-4xl font-black text-[#18181B] mb-8">$0</div>
            <div className="flex flex-col gap-4 mb-12 flex-grow">
              {[
                'Score rounds, basic skins tracking',
                'Shareable recap link',
                'No bet tracking, no trips',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-[#71717A]">
                  <Minus className="text-[#71717A] w-4 h-4 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className="w-full border border-gray-400 text-[#71717A] font-black py-4 rounded-lg hover:bg-gray-50 transition-colors mt-auto text-center block"
            >
              GET STARTED FREE
            </Link>
          </div>

          {/* Nassau Pro Card */}
          <div className="bg-white border-2 border-[#D94F2B] rounded-2xl p-8 flex flex-col shadow-xl shadow-[#D94F2B]/10 relative">
            <div className="absolute -top-3 right-6 bg-[#C9A54E] text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider">
              FOUNDING MEMBER
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[#D94F2B] mb-2">
              NASSAU PRO
            </span>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-black text-[#18181B]">$49.99</span>
              <span className="text-lg font-medium text-[#18181B]">/yr</span>
              <span className="text-lg text-[#71717A] line-through ml-2">$69.99</span>
            </div>
            <div className="flex flex-col gap-4 mb-12 flex-grow">
              {[
                'Full trip planning + itinerary',
                'Nassau bet + skins settlements',
                'Expense tracking + splits',
                'Founding Member badge forever',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-[#18181B] font-medium">
                  <Check className="text-[#D94F2B] w-5 h-5 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href="/login?redirect=/dashboard"
              className="w-full bg-[#D94F2B] text-white font-black py-5 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[#D94F2B]/20 mt-auto uppercase text-center block"
            >
              CLAIM THIS RATE
            </Link>
          </div>
        </div>
      </section>

      {/* DARK FOOTER */}
      <footer className="bg-[#18181B] py-16 px-6 text-center">
        <h3 className="text-2xl font-black text-[#F3EDE4] mb-2">NASSAU</h3>
        <p className="text-[#F3EDE4]/60 text-sm mb-8">
          Built by a golfer, for golfers.
        </p>
        <div className="flex justify-center gap-8">
          <Link href="/privacy" className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors">
            Terms
          </Link>
          <Link href="/support" className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors">
            Support
          </Link>
        </div>
        <p className="text-[#71717A] text-xs mt-4">
          &copy; 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
