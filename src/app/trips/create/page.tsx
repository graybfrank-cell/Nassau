'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Plus,
  Link2,
  Check,
  X,
  Minus,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import knowledgeBase from '@/data/nassau-knowledge-base.json';

function lookupDestinationName(slug: string): string {
  const kb = knowledgeBase as { destinations?: Array<{ id: string; destination: string }> };
  const match = kb.destinations?.find((d) => d.id === slug);
  return match?.destination || slug;
}

// ============================================================
// TYPES
// ============================================================

type VibeType = 'competitive' | 'party' | 'relaxed' | 'bucketlist' | 'fatherson' | 'corporate';
type BudgetTier = 'budget' | 'midrange' | 'premium';
type TimeFrame = 'april' | 'may' | 'june' | 'summer' | 'flexible';

interface VibeOption {
  type: VibeType;
  label: string;
}

interface BudgetOption {
  tier: BudgetTier;
  label: string;
  range: string;
}

interface InvitedPlayer {
  id: string;
  name: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const VIBE_OPTIONS: VibeOption[] = [
  { type: 'competitive', label: 'Competitive' },
  { type: 'party', label: 'Party' },
  { type: 'relaxed', label: 'Relaxed' },
  { type: 'bucketlist', label: 'Bucket list' },
  { type: 'fatherson', label: 'Father-son' },
  { type: 'corporate', label: 'Corporate' },
];

const BUDGET_OPTIONS: BudgetOption[] = [
  { tier: 'budget', label: 'Budget', range: 'Under $150/day' },
  { tier: 'midrange', label: 'Mid-range', range: '$150\u2013350/day' },
  { tier: 'premium', label: 'Premium', range: '$350+/day' },
];

const TIME_FRAMES: { key: TimeFrame; label: string }[] = [
  { key: 'april', label: 'April' },
  { key: 'may', label: 'May' },
  { key: 'june', label: 'June' },
  { key: 'summer', label: 'Summer' },
  { key: 'flexible', label: 'Flexible' },
];

// ============================================================
// PROGRESS BAR
// ============================================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1 px-5 pb-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            i < step ? 'bg-[#2D5A3D]' : 'bg-cream/10'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================
// SECTION LABEL
// ============================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
      {children}
    </label>
  );
}

// ============================================================
// STEP 1: WHERE & WHEN
// ============================================================

function StepWhereWhen({
  destination,
  onDestChange,
  timeFrame,
  onTimeFrameChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: {
  destination: string;
  onDestChange: (v: string) => void;
  timeFrame: TimeFrame | null;
  onTimeFrameChange: (v: TimeFrame) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
}) {
  return (
    <div className="px-5">
      <h2 className="mb-1 text-[20px] font-headline font-medium text-cream">Where & when?</h2>
      <p className="mb-6 text-[13px] text-[#8A8A8A]">Pick a destination and dates for your trip.</p>

      <SectionLabel>Destination</SectionLabel>
      <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 focus-within:border-[#2D5A3D]/40">
        <MapPin className="h-[18px] w-[18px] shrink-0 text-cream/35" strokeWidth={1.8} />
        <input
          type="text"
          value={destination}
          onChange={(e) => onDestChange(e.target.value)}
          placeholder="e.g. Scottsdale, Myrtle Beach..."
          className="w-full bg-transparent text-[15px] text-cream placeholder:text-cream/35 outline-none"
        />
      </div>

      <SectionLabel>When</SectionLabel>
      <div className="mb-4 flex flex-wrap gap-2">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf.key}
            onClick={() => onTimeFrameChange(tf.key)}
            type="button"
            className={`rounded-full px-4 py-2.5 text-[13px] font-medium transition-all ${
              timeFrame === tf.key
                ? 'border border-[#2D5A3D]/50 bg-[#2D5A3D]/12 text-[#2D5A3D]'
                : 'border border-cream/10 bg-cream/[0.06] text-cream/60 hover:border-cream/20'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[12px] text-[#5C5C5C]">Or pick exact dates:</p>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="cursor-pointer rounded-[10px] border border-cream/10 bg-cream/[0.06] p-3.5 transition-colors focus-within:border-[#2D5A3D]/40">
          <p className="mb-1 text-[11px] uppercase tracking-[0.5px] text-[#8A8A8A]">Start</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#8A8A8A]" strokeWidth={1.8} />
            <span className="text-[14px] font-medium text-cream">
              {startDate
                ? new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Select'}
            </span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="sr-only"
          />
        </label>

        <label className="cursor-pointer rounded-[10px] border border-cream/10 bg-cream/[0.06] p-3.5 transition-colors focus-within:border-[#2D5A3D]/40">
          <p className="mb-1 text-[11px] uppercase tracking-[0.5px] text-[#8A8A8A]">End</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#8A8A8A]" strokeWidth={1.8} />
            <span className="text-[14px] font-medium text-cream">
              {endDate
                ? new Date(endDate + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Select'}
            </span>
          </div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}

// ============================================================
// STEP 2: THE CREW
// ============================================================

function StepCrew({
  golferCount,
  onGolferCountChange,
  budget,
  onBudgetChange,
  players,
  onRemovePlayer,
  onCopyInviteLink,
  inviteLinkCopied,
  onShowAddModal,
}: {
  golferCount: number;
  onGolferCountChange: (n: number) => void;
  budget: BudgetTier;
  onBudgetChange: (b: BudgetTier) => void;
  players: InvitedPlayer[];
  onRemovePlayer: (id: string) => void;
  onCopyInviteLink: () => void;
  inviteLinkCopied: boolean;
  onShowAddModal: (v: boolean) => void;
}) {
  const getGroupLabel = (n: number): string => {
    if (n === 2) return 'duo';
    if (n === 3) return 'trio';
    if (n === 4) return 'foursome';
    if (n === 5) return 'fivesome';
    return 'golfers';
  };

  return (
    <div className="px-5">
      <h2 className="mb-1 text-[20px] font-headline font-medium text-cream">The crew</h2>
      <p className="mb-6 text-[13px] text-[#8A8A8A]">How many golfers and what&apos;s the budget?</p>

      <SectionLabel>Golfers</SectionLabel>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => onGolferCountChange(Math.max(2, golferCount - 1))}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream transition-colors hover:bg-cream/[0.06]"
        >
          <Minus className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="min-w-[60px] text-center">
          <span className="block text-[32px] font-medium leading-none text-cream">
            {golferCount}
          </span>
          <span className="mt-1 block text-[12px] text-[#8A8A8A]">
            {getGroupLabel(golferCount)}
          </span>
        </div>
        <button
          onClick={() => onGolferCountChange(Math.min(24, golferCount + 1))}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream transition-colors hover:bg-cream/[0.06]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <SectionLabel>Budget per person</SectionLabel>
      <div className="mb-6 flex gap-2">
        {BUDGET_OPTIONS.map((opt) => (
          <button
            key={opt.tier}
            onClick={() => onBudgetChange(opt.tier)}
            type="button"
            className={`flex-1 rounded-[10px] p-3.5 text-center transition-all ${
              budget === opt.tier
                ? 'border border-[#2D5A3D]/50 bg-[#2D5A3D]/12'
                : 'border border-cream/10 bg-cream/[0.06]'
            }`}
          >
            <p
              className={`text-[14px] font-medium ${
                budget === opt.tier ? 'text-[#2D5A3D]' : 'text-cream/60'
              }`}
            >
              {opt.label}
            </p>
            <p
              className={`mt-1 text-[11px] ${
                budget === opt.tier ? 'text-[#2D5A3D]/60' : 'text-[#5C5C5C]'
              }`}
            >
              {opt.range}
            </p>
          </button>
        ))}
      </div>

      <SectionLabel>Invite players</SectionLabel>
      {players.length > 0 && (
        <div className="mb-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex animate-slideDown items-center gap-3 border-b border-cream/[0.06] py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2F4F4F] text-[12px] font-medium text-cream">
                {player.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-[14px] text-cream">{player.name}</span>
              <button
                onClick={() => onRemovePlayer(player.id)}
                type="button"
                className="text-[#5C5C5C] hover:text-[#8A8A8A]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onShowAddModal(true)}
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-cream/15 bg-transparent py-3 text-[13px] font-medium text-[#8A8A8A] transition-colors hover:border-cream/25 hover:text-cream/70"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add players
        </button>
        <button
          onClick={onCopyInviteLink}
          type="button"
          className={`flex items-center gap-1.5 rounded-[10px] border px-4 py-3 text-[13px] font-medium transition-all ${
            inviteLinkCopied
              ? 'border-[#2D5A3D]/50 text-[#2D5A3D]'
              : 'border-[#2D5A3D]/30 bg-[#2D5A3D]/10 text-[#2D5A3D] hover:bg-[#2D5A3D]/15'
          }`}
        >
          {inviteLinkCopied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
              Invite link
            </>
          )}
        </button>
      </div>

      <p className="mt-2 text-[12px] text-[#5C5C5C]">
        You can also add players after creating the trip.
      </p>
    </div>
  );
}

// ============================================================
// STEP 3: NAME & CUSTOMIZE
// ============================================================

function StepNameCustomize({
  tripName,
  onTripNameChange,
  nameSuggestions,
  vibe,
  onVibeChange,
  notes,
  onNotesChange,
  destination,
  timeFrame,
  startDate,
  endDate,
  golferCount,
  budget,
}: {
  tripName: string;
  onTripNameChange: (v: string) => void;
  nameSuggestions: string[];
  vibe: VibeType | null;
  onVibeChange: (v: VibeType) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  destination: string;
  timeFrame: TimeFrame | null;
  startDate: string;
  endDate: string;
  golferCount: number;
  budget: BudgetTier;
}) {
  const budgetLabel = BUDGET_OPTIONS.find((b) => b.tier === budget)?.label || budget;

  const whenLabel = (() => {
    if (startDate && endDate) {
      const s = new Date(startDate + 'T12:00:00');
      const e = new Date(endDate + 'T12:00:00');
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (timeFrame) {
      const tf = TIME_FRAMES.find((t) => t.key === timeFrame);
      return tf ? tf.label + ' 2026' : '';
    }
    return 'Not set';
  })();

  return (
    <div className="px-5">
      <h2 className="mb-1 text-[20px] font-headline font-medium text-cream">Name your trip</h2>
      <p className="mb-6 text-[13px] text-[#8A8A8A]">Give it a name and set the vibe.</p>

      <SectionLabel>Trip name</SectionLabel>
      <input
        type="text"
        value={tripName}
        onChange={(e) => onTripNameChange(e.target.value)}
        className="mb-3 w-full rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 text-[16px] font-medium text-cream outline-none focus:border-[#2D5A3D]/40"
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {nameSuggestions.map((name) => (
          <button
            key={name}
            onClick={() => onTripNameChange(name)}
            type="button"
            className="rounded-lg border border-cream/10 bg-cream/[0.06] px-3 py-2 text-[12px] text-[#8A8A8A] transition-colors hover:text-cream/70"
          >
            {name}
          </button>
        ))}
      </div>

      <SectionLabel>Vibe</SectionLabel>
      <div className="mb-6 flex flex-wrap gap-2">
        {VIBE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onVibeChange(opt.type)}
            type="button"
            className={`rounded-full px-4 py-2.5 text-[13px] font-medium transition-all ${
              vibe === opt.type
                ? 'border border-[#2D5A3D]/50 bg-[#2D5A3D]/12 text-[#2D5A3D]'
                : 'border border-cream/10 bg-cream/[0.06] text-cream/60 hover:border-cream/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <SectionLabel>Notes</SectionLabel>
      <input
        type="text"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Anything the crew should know..."
        className="mb-6 w-full rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 text-[14px] text-cream placeholder:text-cream/35 outline-none focus:border-[#2D5A3D]/40"
      />

      {/* Trip summary card */}
      <div className="rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[1.2px] text-[#8A8A8A]">
          Trip summary
        </p>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
          <span className="text-[#8A8A8A]">Where</span>
          <span className="font-medium text-cream">{destination || 'Not set'}</span>

          <span className="text-[#8A8A8A]">When</span>
          <span className="text-cream">{whenLabel}</span>

          <span className="text-[#8A8A8A]">Crew</span>
          <span className="text-cream">{golferCount} golfers</span>

          <span className="text-[#8A8A8A]">Budget</span>
          <span className="text-cream">{budgetLabel}</span>

          {vibe && (
            <>
              <span className="text-[#8A8A8A]">Vibe</span>
              <span className="font-medium text-[#2D5A3D]">
                {VIBE_OPTIONS.find((v) => v.type === vibe)?.label || vibe}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADD PLAYER MODAL
// ============================================================

function AddPlayerModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
    return () => setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed) {
      onAdd(trimmed);
      setName('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-[420px] animate-slideUp rounded-t-2xl bg-[#1A1A1A] p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[17px] font-medium text-cream">Add player</h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8A8A] hover:bg-cream/10"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Player name or email"
          className="mb-4 w-full rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 text-[15px] text-cream placeholder:text-cream/35 outline-none focus:border-[#2D5A3D]/40"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 rounded-[10px] border border-cream/10 py-3.5 text-[14px] font-medium text-[#8A8A8A]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={!name.trim()}
            className="flex-1 rounded-[10px] bg-[#2D5A3D] py-3.5 text-[14px] font-medium text-cream transition-opacity disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CreateTripPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark" />}>
      <CreateTripPageInner />
    </Suspense>
  );
}

function CreateTripPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationParam = searchParams.get('destination') || '';
  const hasDestinationParam = destinationParam.trim().length > 0;
  const [step, setStep] = useState(hasDestinationParam ? 2 : 1);
  const TOTAL_STEPS = 3;

  // Step 1 state — pre-fill from query param if present (looks up KB slug → display name)
  const [destination, setDestination] = useState(
    hasDestinationParam ? lookupDestinationName(destinationParam) : ''
  );
  const [timeFrame, setTimeFrame] = useState<TimeFrame | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2 state
  const [golferCount, setGolferCount] = useState(4);
  const [budget, setBudget] = useState<BudgetTier>('midrange');
  const [players, setPlayers] = useState<InvitedPlayer[]>([]);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Step 3 state
  const [tripName, setTripName] = useState('');
  const [vibe, setVibe] = useState<VibeType | null>(null);
  const [notes, setNotes] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate trip name suggestions based on destination
  const nameSuggestions = (() => {
    const dest = destination.split(',')[0].trim() || 'Golf';
    return [
      `The ${dest} Classic`,
      `${dest} Showdown`,
      `${dest} Invitational`,
    ];
  })();

  // Auto-set trip name on step 3 if empty
  useEffect(() => {
    if (step === 3 && !tripName && destination) {
      const dest = destination.split(',')[0].trim();
      setTripName(`The ${dest} Classic`);
    }
  }, [step, tripName, destination]);

  function handleAddPlayer(name: string) {
    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name }]);
    setShowAddPlayer(false);
  }

  function handleRemovePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleCopyInviteLink() {
    try {
      await navigator.clipboard.writeText('https://nassau.golf/join/new-trip');
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      handleCreateTrip();
    }
  }

  function goBack() {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    } else {
      router.push('/trips');
    }
  }

  async function handleCreateTrip() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tripName,
          destination,
          vibe: vibe || 'relaxed',
          startDate: startDate || null,
          endDate: endDate || null,
          budgetTier: budget,
          groupSizeTarget: golferCount,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const tripId = data.id || data.tripId;
        router.push(`/trips/${tripId}`);
      } else {
        console.error('Failed to create trip');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Create trip error:', err);
      setIsSubmitting(false);
    }
  }

  const canProceed = (() => {
    if (step === 1) return destination.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return tripName.trim().length > 0;
    return false;
  })();

  return (
    <>
      <div className="min-h-screen bg-dark">
        {/* ── BANNER ── */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1600533396250-e8c6579e7186?q=80&w=2070&auto=format&fit=crop"
            alt="Scenic golf destination"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
          <div className="relative z-10 flex flex-col h-full">
            <TopBar />
            <div className="mt-auto px-5 pb-5">
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={goBack}
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/[0.12] bg-dark/30 transition-colors hover:bg-cream/[0.06]"
                >
                  <ArrowLeft className="h-[18px] w-[18px] text-cream" strokeWidth={2} />
                </button>
                <h1 className="flex-1 text-[22px] font-headline font-medium tracking-tight text-cream">
                  New trip
                </h1>
                <span className="text-[13px] text-[#8A8A8A]">
                  Step {step} of {TOTAL_STEPS}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Steps */}
        {step === 1 && (
          <StepWhereWhen
            destination={destination}
            onDestChange={setDestination}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
        )}

        {step === 2 && (
          <StepCrew
            golferCount={golferCount}
            onGolferCountChange={setGolferCount}
            budget={budget}
            onBudgetChange={setBudget}
            players={players}
            onRemovePlayer={handleRemovePlayer}
            onCopyInviteLink={handleCopyInviteLink}
            inviteLinkCopied={inviteLinkCopied}
            onShowAddModal={setShowAddPlayer}
          />
        )}

        {step === 3 && (
          <StepNameCustomize
            tripName={tripName}
            onTripNameChange={setTripName}
            nameSuggestions={nameSuggestions}
            vibe={vibe}
            onVibeChange={setVibe}
            notes={notes}
            onNotesChange={setNotes}
            destination={destination}
            timeFrame={timeFrame}
            startDate={startDate}
            endDate={endDate}
            golferCount={golferCount}
            budget={budget}
          />
        )}

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-cream/[0.06] bg-dark px-5 pb-8 pt-4">
          <div className="mx-auto flex max-w-[420px] gap-3">
            {step > 1 && (
              <button
                onClick={goBack}
                type="button"
                className="rounded-[10px] border border-cream/12 px-5 py-4 text-[15px] font-medium text-[#8A8A8A]"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed || isSubmitting}
              type="button"
              className={`flex-1 rounded-[10px] py-4 text-[16px] font-medium tracking-tight text-cream transition-all ${
                canProceed && !isSubmitting
                  ? 'bg-[#2D5A3D] hover:bg-[#2D5A3D]/90 active:scale-[0.99]'
                  : 'bg-[#2D5A3D]/40 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? 'Creating...'
                : step === TOTAL_STEPS
                  ? 'Create trip'
                  : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Add player modal */}
      <AddPlayerModal
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        onAdd={handleAddPlayer}
      />
    </>
  );
}
