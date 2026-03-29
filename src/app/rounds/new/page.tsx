'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Calendar, Clock, Check, Plus, Link2, X, MapPin } from 'lucide-react';

interface GolfCourse {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  par: number;
  holes: number;
}

type GameType = 'stroke' | 'skins' | 'nassau' | 'match' | 'bestball';

interface GameConfig {
  type: GameType;
  label: string;
  description: string;
}

interface InvitedPlayer {
  id: string;
  name: string;
  status: 'invited' | 'confirmed';
}

const GAME_OPTIONS: GameConfig[] = [
  { type: 'stroke', label: 'Stroke play', description: 'Total strokes win' },
  { type: 'skins', label: 'Skins', description: 'Win the hole, win the skin' },
  { type: 'nassau', label: 'Nassau', description: 'Front 9, back 9, total' },
  { type: 'match', label: 'Match play', description: 'Hole by hole' },
  { type: 'bestball', label: 'Best ball', description: 'Best score per team' },
];

const SKINS_AMOUNTS = [1, 2, 5, 10, 20];

function CourseSearchInput({
  selectedCourse,
  onSelect,
  onClear,
}: {
  selectedCourse: GolfCourse | null;
  onSelect: (course: GolfCourse) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GolfCourse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCourses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/courses/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data: GolfCourse[] = await res.json();
        setResults(data);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Course search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchCourses(value), 300);
  }

  function handleSelect(course: GolfCourse) {
    onSelect(course);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  }

  if (selectedCourse) {
    return (
      <button
        onClick={onClear}
        className="w-full text-left rounded-[10px] border border-teal/30 bg-teal/10 p-4 transition-colors hover:bg-teal/15"
        type="button"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[17px] font-medium text-cream">{selectedCourse.name}</p>
            <p className="mt-1 text-[13px] text-cream/50">
              {selectedCourse.city}, {selectedCourse.state} · Par {selectedCourse.par} · {selectedCourse.holes} holes
            </p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/20">
            <Check className="h-3.5 w-3.5 text-teal" strokeWidth={2.5} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 transition-colors focus-within:border-coral/40">
        <Search className="h-5 w-5 text-cream/35 shrink-0" strokeWidth={1.8} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search courses..."
          className="w-full bg-transparent text-[15px] text-cream placeholder:text-cream/35 outline-none"
        />
        {isSearching && (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cream/20 border-t-coral" />
        )}
      </div>
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-y-auto rounded-[10px] border border-cream/10 bg-[#1e1e21] shadow-2xl"
        >
          {results.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="flex w-full items-center gap-3 border-b border-cream/[0.06] px-4 py-3 text-left transition-colors last:border-0 hover:bg-cream/[0.06]"
              type="button"
            >
              <MapPin className="h-4 w-4 shrink-0 text-cream/30" strokeWidth={1.8} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-cream">{course.name}</p>
                <p className="text-[12px] text-cream/40">
                  {course.city}, {course.state}
                  {course.par ? ` · Par ${course.par}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GameChipSelector({
  selected,
  onToggle,
}: {
  selected: Set<GameType>;
  onToggle: (game: GameType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {GAME_OPTIONS.map((game) => {
        const isActive = selected.has(game.type);
        return (
          <button
            key={game.type}
            onClick={() => onToggle(game.type)}
            type="button"
            className={`rounded-full px-[18px] py-2.5 text-[13px] font-medium transition-all ${
              isActive
                ? 'border border-coral/50 bg-coral/12 text-coral'
                : 'border border-cream/10 bg-cream/[0.06] text-cream/60 hover:border-cream/20 hover:text-cream/80'
            }`}
          >
            {game.label}
          </button>
        );
      })}
    </div>
  );
}

function SkinsConfigPanel({
  value,
  onValueChange,
  carryOver,
  onCarryOverChange,
}: {
  value: number;
  onValueChange: (v: number) => void;
  carryOver: boolean;
  onCarryOverChange: (v: boolean) => void;
}) {
  return (
    <div className="animate-slideDown rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-medium text-cream">Skins value</span>
        <span className="text-[14px] font-medium text-coral">${value}</span>
      </div>
      <div className="flex gap-2">
        {SKINS_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onValueChange(amt)}
            type="button"
            className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
              value === amt
                ? 'border border-coral/50 bg-coral/12 text-coral'
                : 'border border-cream/10 bg-cream/[0.06] text-cream/50 hover:text-cream/70'
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-cream/[0.06] pt-3">
        <span className="text-[13px] text-cream/40">Carry-over skins</span>
        <button
          onClick={() => onCarryOverChange(!carryOver)}
          type="button"
          className={`relative h-6 w-11 rounded-full transition-colors ${carryOver ? 'bg-coral' : 'bg-cream/15'}`}
        >
          <div
            className={`absolute top-[2px] h-5 w-5 rounded-full bg-cream transition-[left] ${
              carryOver ? 'left-[22px]' : 'left-[2px]'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function PlayerList({
  currentUserName,
  players,
  onAddPlayer,
  onRemovePlayer,
  onCopyInviteLink,
  inviteLinkCopied,
}: {
  currentUserName: string;
  players: InvitedPlayer[];
  onAddPlayer: () => void;
  onRemovePlayer: (id: string) => void;
  onCopyInviteLink: () => void;
  inviteLinkCopied: boolean;
}) {
  const initials = currentUserName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-cream/[0.06] py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold text-[13px] font-medium text-dark">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-medium text-cream">{currentUserName}</p>
          <p className="text-[12px] text-cream/40">Commissioner</p>
        </div>
        <Check className="h-4 w-4 text-teal" strokeWidth={2.5} />
      </div>
      {players.map((player) => (
        <div key={player.id} className="flex animate-slideDown items-center gap-3 border-b border-cream/[0.06] py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-medium text-cream">
            {player.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-cream">{player.name}</p>
            <p className="text-[12px] text-cream/40">
              {player.status === 'confirmed' ? 'Confirmed' : 'Invited'}
            </p>
          </div>
          <button
            onClick={() => onRemovePlayer(player.id)}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full text-cream/25 transition-colors hover:bg-cream/10 hover:text-cream/50"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      ))}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAddPlayer}
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-cream/15 bg-transparent py-3 text-[13px] font-medium text-cream/50 transition-colors hover:border-cream/25 hover:text-cream/70"
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> Add player
        </button>
        <button
          onClick={onCopyInviteLink}
          type="button"
          className={`flex items-center gap-1.5 rounded-[10px] border px-4 py-3 text-[13px] font-medium transition-all ${
            inviteLinkCopied
              ? 'border-coral/50 text-coral'
              : 'border-teal/30 bg-teal/10 text-teal hover:bg-teal/15'
          }`}
        >
          {inviteLinkCopied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Copied!
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" strokeWidth={2} /> Invite link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
      <div className="w-full max-w-[420px] animate-slideUp rounded-t-2xl bg-[#1e1e21] p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[17px] font-medium text-cream">Add player</h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-cream/40 hover:bg-cream/10"
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
          className="mb-4 w-full rounded-[10px] border border-cream/10 bg-cream/[0.06] px-4 py-3.5 text-[15px] text-cream placeholder:text-cream/35 outline-none focus:border-coral/40"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 rounded-[10px] border border-cream/10 py-3.5 text-[14px] font-medium text-cream/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={!name.trim()}
            className="flex-1 rounded-[10px] bg-coral py-3.5 text-[14px] font-medium text-cream transition-opacity disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block text-[11px] font-medium uppercase tracking-[1.2px] text-cream/40">
      {children}
    </label>
  );
}

export default function NewRoundPage() {
  const router = useRouter();

  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [date, setDate] = useState('');
  const [teeTime, setTeeTime] = useState('08:00');
  const [startingHole, setStartingHole] = useState<1 | 10>(1);
  const [selectedGames, setSelectedGames] = useState<Set<GameType>>(new Set(['skins']));
  const [skinsValue, setSkinsValue] = useState(5);
  const [skinsCarryOver, setSkinsCarryOver] = useState(true);
  const [players, setPlayers] = useState<InvitedPlayer[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const now = new Date();
    const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
    const nextSat = new Date(now);
    nextSat.setDate(now.getDate() + daysUntilSat);
    setDate(nextSat.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUserName(data.fullName || data.displayName || 'You');
        }
      } catch {
        setUserName('You');
      }
    }
    fetchUser();
  }, []);

  function toggleGame(game: GameType) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game);
      else next.add(game);
      return next;
    });
  }

  function handleAddPlayer(name: string) {
    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name, status: 'invited' }]);
    setShowAddPlayer(false);
  }

  function handleRemovePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleCopyInviteLink() {
    try {
      await navigator.clipboard.writeText('https://nassau.golf/join/new-round');
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    } catch {
      // clipboard API may not be available
    }
  }

  async function handleCreateRound() {
    if (!selectedCourse || !date) return;
    setIsSubmitting(true);
    try {
      const teeTimeISO = new Date(`${date}T${teeTime}:00`).toISOString();

      const res = await fetch('/api/game-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: selectedCourse.name,
          courseId: selectedCourse.id,
          courseLocation: [selectedCourse.city, selectedCourse.state].filter(Boolean).join(', '),
          teeTime: teeTimeISO,
          startingHole,
          skinsGame: selectedGames.has('skins') ? { buyIn: skinsValue } : undefined,
          nassauBet: selectedGames.has('nassau') ? { betAmount: 10 } : undefined,
          players: players.map((p) => ({ name: p.name })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/rounds/${data.id}`);
      } else {
        console.error('Failed to create round');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Create round error:', err);
      setIsSubmitting(false);
    }
  }

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const formattedTime = teeTime
    ? new Date(`2000-01-01T${teeTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const canSubmit = selectedCourse !== null && date !== '';

  return (
    <>
      <div className="min-h-screen bg-dark">
        <div className="flex items-center gap-3 px-5 pb-5 pt-4">
          <button
            onClick={() => router.back()}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/[0.12] transition-colors hover:bg-cream/[0.06]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-cream" strokeWidth={2} />
          </button>
          <h1 className="text-[22px] font-medium tracking-tight text-cream">New round</h1>
        </div>

        <div className="space-y-6 px-5 pb-32">
          {/* Course */}
          <div>
            <SectionLabel>Course</SectionLabel>
            <CourseSearchInput
              selectedCourse={selectedCourse}
              onSelect={setSelectedCourse}
              onClear={() => setSelectedCourse(null)}
            />
          </div>

          {/* Date & Tee Time */}
          <div>
            <SectionLabel>Date &amp; tee time</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="cursor-pointer rounded-[10px] border border-cream/10 bg-cream/[0.06] p-3.5 transition-colors focus-within:border-coral/40">
                <p className="mb-1 text-[11px] uppercase tracking-[0.5px] text-cream/40">Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cream/60" strokeWidth={1.8} />
                  <span className="text-[15px] font-medium text-cream">{formattedDate || 'Pick date'}</span>
                </div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sr-only" />
              </label>
              <label className="cursor-pointer rounded-[10px] border border-cream/10 bg-cream/[0.06] p-3.5 transition-colors focus-within:border-coral/40">
                <p className="mb-1 text-[11px] uppercase tracking-[0.5px] text-cream/40">Tee time</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cream/60" strokeWidth={1.8} />
                  <span className="text-[15px] font-medium text-cream">{formattedTime || '8:00 AM'}</span>
                </div>
                <input type="time" value={teeTime} onChange={(e) => setTeeTime(e.target.value)} className="sr-only" />
              </label>
            </div>
          </div>

          {/* Starting Hole */}
          <div>
            <SectionLabel>Starting hole</SectionLabel>
            <div className="flex gap-2">
              {([1, 10] as const).map((hole) => (
                <button
                  key={hole}
                  onClick={() => setStartingHole(hole)}
                  type="button"
                  className={`flex-1 rounded-[10px] py-3 text-[14px] font-medium transition-all ${
                    startingHole === hole
                      ? 'border border-coral/50 bg-coral/12 text-coral'
                      : 'border border-cream/10 bg-cream/[0.06] text-cream/50 hover:text-cream/70'
                  }`}
                >
                  Hole {hole}
                </button>
              ))}
            </div>
          </div>

          {/* Games */}
          <div>
            <SectionLabel>Games</SectionLabel>
            <GameChipSelector selected={selectedGames} onToggle={toggleGame} />
          </div>

          {/* Skins Config */}
          {selectedGames.has('skins') && (
            <SkinsConfigPanel
              value={skinsValue}
              onValueChange={setSkinsValue}
              carryOver={skinsCarryOver}
              onCarryOverChange={setSkinsCarryOver}
            />
          )}

          {/* Players */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <SectionLabel>Players</SectionLabel>
              <span className="text-[12px] text-cream/30">
                {players.length + 1} player{players.length > 0 ? 's' : ''}
              </span>
            </div>
            <PlayerList
              currentUserName={userName || 'You'}
              players={players}
              onAddPlayer={() => setShowAddPlayer(true)}
              onRemovePlayer={handleRemovePlayer}
              onCopyInviteLink={handleCopyInviteLink}
              inviteLinkCopied={inviteLinkCopied}
            />
          </div>

          <div className="h-px bg-cream/[0.06]" />

          {/* Submit */}
          <div>
            <button
              onClick={handleCreateRound}
              disabled={!canSubmit || isSubmitting}
              type="button"
              className={`w-full rounded-[10px] py-4 text-[16px] font-medium tracking-tight text-cream transition-all ${
                canSubmit && !isSubmitting
                  ? 'bg-coral hover:bg-coral/90 active:scale-[0.99]'
                  : 'bg-coral/40 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create round'}
            </button>
            <p className="mt-2.5 text-center text-[12px] text-cream/30">You can edit details after creation</p>
          </div>
        </div>
      </div>

      <AddPlayerModal isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} onAdd={handleAddPlayer} />
    </>
  );
}
