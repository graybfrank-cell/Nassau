"use client";

import {
  Trophy,
  Banknote,
  Sparkles,
  Target,
  TrendingUp,
  Flag,
  Award,
} from "lucide-react";

interface AwardItem {
  title: string;
  playerId: string;
  playerName: string;
  description: string;
}

const awardConfig: Record<
  string,
  { icon: typeof Trophy; gradient: string; iconColor: string }
> = {
  "Skins Assassin": {
    icon: Trophy,
    gradient: "from-amber-50 to-yellow-50 border-amber-200",
    iconColor: "text-amber-500",
  },
  "The Wallet": {
    icon: Banknote,
    gradient: "from-red-50 to-orange-50 border-red-200",
    iconColor: "text-red-500",
  },
  "Cashing In": {
    icon: Sparkles,
    gradient: "from-emerald-50 to-green-50 border-emerald-200",
    iconColor: "text-emerald-500",
  },
  "Mr. Consistent": {
    icon: Target,
    gradient: "from-blue-50 to-indigo-50 border-blue-200",
    iconColor: "text-blue-500",
  },
  "Comeback Kid": {
    icon: TrendingUp,
    gradient: "from-purple-50 to-violet-50 border-purple-200",
    iconColor: "text-purple-500",
  },
  "The Closer": {
    icon: Flag,
    gradient: "from-teal-50 to-cyan-50 border-teal-200",
    iconColor: "text-teal-500",
  },
  "Low Round": {
    icon: Award,
    gradient: "from-zinc-50 to-stone-50 border-zinc-300",
    iconColor: "text-zinc-600",
  },
};

const defaultConfig = {
  icon: Trophy,
  gradient: "from-zinc-50 to-stone-50 border-zinc-200",
  iconColor: "text-zinc-500",
};

export default function AwardsList({ awards }: { awards: AwardItem[] }) {
  if (!awards || awards.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {awards.map((award, idx) => {
        const config = awardConfig[award.title] || defaultConfig;
        const Icon = config.icon;

        return (
          <div
            key={`${award.title}-${idx}`}
            className={`rounded-xl border bg-gradient-to-br ${config.gradient} p-4 transition-shadow hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 ${config.iconColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900">
                  {award.title}
                </h3>
                <p className="mt-0.5 text-sm font-medium text-zinc-700">
                  {award.playerName}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {award.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
