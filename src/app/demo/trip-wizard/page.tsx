"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { DEMO_CREW, DEMO_TRIP } from "@/lib/demo-data";

const DAYS_IN_MAY = Array.from({ length: 31 }, (_, i) => i + 1);
const SELECTED = [8, 9, 10, 11];

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${n <= current ? "bg-[#2D5A3D] text-white" : "bg-[#2A2A2A] text-[#8A8A8A]"}`}>
            {n < current ? <Check className="h-3.5 w-3.5" /> : n}
          </div>
          {i < 2 && <div className={`h-[2px] w-8 ${n < current ? "bg-[#2D5A3D]" : "bg-[#2A2A2A]"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function DemoTripWizardPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-[#111111] pb-16">
      <div className="px-6 pt-12 pb-6">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-6">Create a trip</p>
        <StepDots current={step} />
      </div>
      <div className="mx-auto max-w-lg px-6">
        {step === 1 && (
          <div>
            <h2 className="font-headline text-3xl tracking-tight text-[#F2F0EB]">Where are we going?</h2>
            <p className="mt-2 text-sm text-[#8A8A8A]">Choose your destination</p>
            <div className="mt-6 rounded-[10px] border-2 border-[#2D5A3D] bg-[#1A1A1A] overflow-hidden">
              <div className="relative h-48 w-full">
                <Image src="/heroes/bandon-dunes.png" alt="Bandon Dunes" fill className="object-cover" />
                <div className="absolute top-3 right-3 rounded-full bg-[#2D5A3D] px-3 py-1 text-[10px] font-bold uppercase text-white">Selected</div>
              </div>
              <div className="p-4">
                <h3 className="font-headline text-xl text-[#F2F0EB]">Bandon Dunes, Oregon</h3>
                <p className="mt-1 text-xs text-[#8A8A8A]">5 world-class links courses · from $3,200/person</p>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="mt-8 w-full rounded-xl bg-[#2D5A3D] py-3.5 text-sm font-bold text-white active:scale-[0.98] flex items-center justify-center gap-2">
              Next — Who&apos;s coming? <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="font-headline text-3xl tracking-tight text-[#F2F0EB]">Who&apos;s coming?</h2>
            <p className="mt-2 text-sm text-[#8A8A8A]">Add your crew — you can invite more later</p>
            <div className="mt-6 space-y-2">
              {DEMO_CREW.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-[10px] bg-[#1A1A1A] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#2F4F4F] flex items-center justify-center text-[11px] font-medium text-white">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F2F0EB]">{m.name}</p>
                      <p className="text-xs text-[#8A8A8A]">{m.handicap} HCP</p>
                    </div>
                  </div>
                  <div className="h-5 w-5 rounded-full bg-[#2D5A3D] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[#2A2A2A] py-3.5 text-sm font-bold text-[#8A8A8A] active:scale-[0.98]">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-[#2D5A3D] py-3.5 text-sm font-bold text-white active:scale-[0.98] flex items-center justify-center gap-2">
                Next — When? <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="font-headline text-3xl tracking-tight text-[#F2F0EB]">When?</h2>
            <p className="mt-2 text-sm text-[#8A8A8A]">Select your travel dates</p>
            <div className="mt-6 rounded-[10px] bg-[#1A1A1A] p-5">
              <p className="text-center font-semibold text-[#F2F0EB] mb-4">May 2026</p>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="text-[10px] font-medium text-[#5C5C5C] pb-2">{d}</span>
                ))}
                {Array.from({ length: 5 }).map((_, i) => <span key={`b${i}`} />)}
                {DAYS_IN_MAY.map((day) => (
                  <span key={day} className={`flex h-9 w-9 items-center justify-center rounded-full text-sm mx-auto ${SELECTED.includes(day) ? "bg-[#2D5A3D] text-white font-bold" : "text-[#8A8A8A]"}`}>
                    {day}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-[#8A8A8A]">May 8–11, 2026 · 3 nights</p>
            </div>
            <div className="mt-6 rounded-[10px] bg-[#1A1A1A] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">Trip summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#8A8A8A]">Destination</span><span className="text-[#F2F0EB] font-medium">Bandon Dunes, OR</span></div>
                <div className="flex justify-between"><span className="text-[#8A8A8A]">Crew</span><span className="text-[#F2F0EB] font-medium">{DEMO_CREW.length} players</span></div>
                <div className="flex justify-between"><span className="text-[#8A8A8A]">Dates</span><span className="text-[#F2F0EB] font-medium">May 8–11, 2026</span></div>
                <div className="flex justify-between"><span className="text-[#8A8A8A]">Est. cost</span><span className="text-[#F2F0EB] font-medium">${DEMO_TRIP.costPerPerson.toLocaleString()}/person</span></div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[#2A2A2A] py-3.5 text-sm font-bold text-[#8A8A8A] active:scale-[0.98]">Back</button>
              <Link href="/demo" className="flex-1 rounded-xl bg-[#2D5A3D] py-3.5 text-sm font-bold text-white active:scale-[0.98] flex items-center justify-center gap-2">
                Create trip <Check className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
