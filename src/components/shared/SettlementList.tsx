"use client";

import { Check, Undo2 } from "lucide-react";

interface SettlementListProps {
  settlements: {
    id: string;
    fromPlayer: { id: string; name: string };
    toPlayer: { id: string; name: string };
    amount: number;
    reason: string;
    settled: boolean;
    settledAt?: string;
  }[];
  currentUserId: string;
  onMarkSettled: (settlementId: string, settled: boolean) => void;
  canManageAll?: boolean;
}

export default function SettlementList({
  settlements,
  currentUserId,
  onMarkSettled,
  canManageAll = false,
}: SettlementListProps) {
  const settled = settlements.filter((s) => s.settled);
  const unsettled = settlements.filter((s) => !s.settled);

  if (settlements.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-4 text-center">
        No settlements to show.
      </p>
    );
  }

  function canToggle(s: {
    fromPlayer: { id: string };
    toPlayer: { id: string };
  }): boolean {
    if (canManageAll) return true;
    return (
      s.fromPlayer.id === currentUserId || s.toPlayer.id === currentUserId
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">
          {settled.length} of {settlements.length} settled
        </p>
        {settled.length === settlements.length && settlements.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-[#D94F2B]">
            All settled
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Unsettled first */}
        {unsettled.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm text-zinc-700">
                <span className="font-medium">{s.fromPlayer.name}</span>
                {" pays "}
                <span className="font-medium">{s.toPlayer.name}</span>
              </p>
              <p className="text-xs text-zinc-400">{s.reason}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-900">
                ${s.amount.toFixed(2)}
              </span>
              {canToggle(s) && (
                <button
                  onClick={() => onMarkSettled(s.id, true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#D94F2B] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#B83D25] min-h-[36px]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Paid
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Settled */}
        {settled.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3"
          >
            <div>
              <p className="text-sm text-zinc-500 line-through">
                <span className="font-medium">{s.fromPlayer.name}</span>
                {" pays "}
                <span className="font-medium">{s.toPlayer.name}</span>
              </p>
              <p className="text-xs text-[#D94F2B]">
                Settled{" "}
                {s.settledAt &&
                  new Date(s.settledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-400">
                ${s.amount.toFixed(2)}
              </span>
              {canToggle(s) && (
                <button
                  onClick={() => onMarkSettled(s.id, false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 min-h-[36px]"
                >
                  <Undo2 className="h-3 w-3" />
                  Undo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
