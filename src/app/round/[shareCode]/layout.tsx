import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ shareCode: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}): Promise<Metadata> {
  const { shareCode } = await params;

  try {
    const round = await prisma.gameRounds.findUnique({
      where: { share_code: shareCode },
      include: {
        players: { select: { id: true, name: true, status: true, role: true } },
        scorecards: { select: { player_id: true, total: true } },
        skins_game: { select: { results: true } },
        settlements: {
          select: { from_player: true, to_player: true, amount: true },
        },
      },
    });

    if (!round) {
      return { title: "Round Not Found — Nassau" };
    }

    const confirmedPlayers = round.players.filter(
      (p: { status: string; role: string }) =>
        p.status === "confirmed" || p.role === "COMMISSIONER"
    );

    const isRecap = round.status === "completed";
    const isLive = round.status === "in_progress";

    // Build title
    const statusLabel = isRecap ? "Recap" : isLive ? "Live" : "Join";
    const title = `${round.course_name} — ${statusLabel} | Nassau`;

    // Build description
    const playerNames = confirmedPlayers.map((p) => p.name).join(", ");
    const teeDate = round.tee_time
      ? new Date(round.tee_time).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "";
    const description = isRecap
      ? `Final scores from ${round.course_name}. ${playerNames}`
      : `${round.course_name} — ${teeDate}. ${playerNames}`;

    // Build OG image URL
    const ogParams = new URLSearchParams();
    ogParams.set("course", round.course_name ?? "");
    ogParams.set("date", teeDate);
    ogParams.set("status", round.status ?? "upcoming");

    if (round.course_photo_url) {
      ogParams.set("photo", round.course_photo_url);
    }

    // Players + scores sorted by total
    const playerScores = confirmedPlayers
      .map((p) => {
        const sc = round.scorecards.find((s) => s.player_id === p.id);
        return { name: p.name, id: p.id, total: sc?.total ?? 0 };
      })
      .sort((a, b) => {
        if (a.total === 0 && b.total === 0) return 0;
        if (a.total === 0) return 1;
        if (b.total === 0) return -1;
        return a.total - b.total;
      })
      .slice(0, 6);

    ogParams.set("players", playerScores.map((p) => p.name).join(","));
    ogParams.set(
      "scores",
      playerScores.map((p) => (p.total > 0 ? String(p.total) : "—")).join(",")
    );

    // Winner
    if (isRecap && playerScores.length > 0 && playerScores[0].total > 0) {
      ogParams.set("winner", playerScores[0].name);
      ogParams.set("winnerScore", String(playerScores[0].total));
    }

    // Skins winner
    const skinsResults = round.skins_game?.results as any;
    if (skinsResults?.payouts) {
      const payoutEntries = Object.entries(
        skinsResults.payouts as Record<string, number>
      ).filter(([, v]) => (v as number) > 0);
      if (payoutEntries.length > 0) {
        const [topId] = payoutEntries.reduce((best, curr) =>
          (curr[1] as number) > (best[1] as number) ? curr : best
        );
        const skinsWinner = confirmedPlayers.find((p) => p.id === topId)?.name;
        if (skinsWinner) ogParams.set("skinsWinner", skinsWinner);
      }
    }

    // Money won by winner
    if (isRecap && playerScores.length > 0) {
      const winnerId = playerScores[0].id;
      let moneyNet = 0;
      for (const s of round.settlements) {
        if (s.to_player === winnerId) moneyNet += Number(s.amount);
        if (s.from_player === winnerId) moneyNet -= Number(s.amount);
      }
      if (moneyNet > 0) {
        ogParams.set("moneyWon", `+$${moneyNet.toFixed(0)}`);
      }
    }

    const ogImageUrl = `/api/og?${ogParams.toString()}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${round.course_name} — Nassau`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: "Nassau — Golf Round",
      description: "Track scores, skins, and Nassau bets with your group.",
    };
  }
}

export default function RoundShareLayout({ children }: Props) {
  return <>{children}</>;
}
