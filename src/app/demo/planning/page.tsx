"use client";

import { HeroBackdrop } from "@/components/HeroBackdrop";
import {
  DEMO_TRIP, DEMO_CREW, DEMO_LODGING, DEMO_TEE_TIMES,
  DEMO_CREW_CONTRIBUTIONS, DEMO_PLANNING_ITINERARY,
} from "@/lib/demo-data";
import {
  Home, MapPin, Users, CalendarDays, DollarSign,
  Check, Clock,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, string> = {
  tee_time: "⛳", dinner: "🍽️", travel: "✈️", activity: "🎯",
};

export default function DemoPlanningPage() {
  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-16">
      {/* ── Hero ── */}
      <HeroBackdrop
        src="/heroes/bandon-dunes.png"
        alt="Bandon Dunes coastal links"
        height="md"
        priority
      >
        <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
          Captain&apos;s command center
        </p>
        <h1 className="font-headline text-4xl md:text-5xl tracking-tight">
          {DEMO_TRIP.name}
        </h1>
        <p className="mt-2 text-white/80 text-sm flex gap-4">
          <span>🗓 May 8–11, 2026</span>
          <span>⏱ T-minus 14 days</span>
        </p>
      </HeroBackdrop>

      <div className="mx-auto max-w-lg px-4 -mt-4">
        {/* ── Lodging ── */}
        <Section icon={Home} label="Lodging">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{DEMO_LODGING.name}</p>
              <p className="text-xs text-[#8A8078] mt-0.5">
                ${DEMO_LODGING.perNight}/night · {DEMO_LODGING.nights} nights
              </p>
            </div>
            <StatusPill label={DEMO_LODGING.status} variant="green" />
          </div>
        </Section>

        {/* ── Courses ── */}
        <Section icon={MapPin} label="Courses">
          <div className="space-y-2">
            {DEMO_TEE_TIMES.map((t) => (
              <div key={t.course} className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{t.course}</p>
                  <p className="text-xs text-[#8A8078]">
                    {new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {t.time}
                  </p>
                </div>
                <StatusPill label={t.status} variant="green" />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Crew ── */}
        <Section icon={Users} label={`Crew — ${DEMO_CREW.length} players`}>
          <div className="flex flex-wrap gap-2">
            {DEMO_CREW.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F0EB] px-3 py-1.5 text-sm font-medium text-[#1A1A1A]">
                {m.name.split(" ")[0]}
                <Check className="h-3 w-3 text-[#2D5A3D]" />
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8A8078]">
            Total contributions collected: <span className="font-bold text-[#1A1A1A]">${DEMO_CREW_CONTRIBUTIONS.total.toLocaleString()}</span>
          </p>
        </Section>

        {/* ── Itinerary ── */}
        <Section icon={CalendarDays} label="Itinerary">
          <div className="space-y-4">
            {DEMO_PLANNING_ITINERARY.map((day) => (
              <div key={day.day}>
                <p className="text-xs font-bold text-[#1A1A1A] mb-2">{day.label}</p>
                <div className="space-y-1">
                  {day.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[#F2F0EB] px-3 py-2">
                      <span>{ACTIVITY_ICONS[item.type] ?? "📌"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                      </div>
                      <span className="text-xs text-[#8A8078]">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Budget ── */}
        <Section icon={DollarSign} label="Budget">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                ${DEMO_CREW_CONTRIBUTIONS.perPerson.toLocaleString()}
                <span className="text-sm font-normal text-[#8A8078]">/person</span>
              </p>
            </div>
            <StatusPill label={DEMO_CREW_CONTRIBUTIONS.status} variant="green" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-[#8A8078]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">{label}</p>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ label, variant }: { label: string; variant: "green" | "stone" }) {
  const cls = variant === "green"
    ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
    : "bg-[#8A8A8A]/10 text-[#8A8A8A]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${cls}`}>
      {variant === "green" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}
