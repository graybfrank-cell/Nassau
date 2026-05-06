"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayPayload } from "@/app/api/trips/[id]/today/route";
import TodayHero from "./TodayHero";
import TodayScoreboard from "./TodayScoreboard";
import TodaySchedule from "./TodaySchedule";
import TodayCrew from "./TodayCrew";
import TodayPhotos from "./TodayPhotos";
import TodayMoney from "./TodayMoney";
import EmptyTodayState from "./EmptyTodayState";

type Props = {
  tripId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: TodayPayload };

export default function TodayView({ tripId }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/trips/${tripId}/today`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setState({
          status: "error",
          message: text || `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as TodayPayload;
      setState({ status: "ready", data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") {
    return <EmptyTodayState mode="loading" />;
  }

  if (state.status === "error") {
    return (
      <EmptyTodayState mode="error" message={state.message} onRetry={load} />
    );
  }

  const { data } = state;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-cream">
      <TodayHero trip={data.trip} />
      <TodayScoreboard scoreboard={data.live_scoreboard} />
      <TodaySchedule schedule={data.today_schedule} />
      <TodayCrew members={data.members} captain={data.captain} />
      <TodayPhotos photos={data.recent_photos} />
      <TodayMoney />
      <div className="h-12" />
    </main>
  );
}
