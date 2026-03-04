import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

interface OcrPlayer {
  name: string;
  scores: (number | null)[];
}

interface ConfirmBody {
  players: OcrPlayer[];
  pars?: (number | null)[];
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; scorecardId: string }>;
  }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId, scorecardId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const scorecard = await prisma.scorecards.findUnique({
    where: { id: scorecardId },
  });
  if (!scorecard || scorecard.trip_id !== tripId) {
    return NextResponse.json({ error: "Scorecard not found" }, { status: 404 });
  }

  let body: ConfirmBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.players || !Array.isArray(body.players)) {
    return NextResponse.json({ error: "Missing players data" }, { status: 400 });
  }

  // ─── Merge OCR data into existing scorecard players ───────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPlayers = scorecard.players as any[];

  // Build a map from OCR extracted player name → their scores
  const ocrMap = new Map<string, (number | null)[]>();
  for (const op of body.players) {
    ocrMap.set(op.name.toLowerCase().trim(), op.scores);
  }

  // Match OCR players to existing scorecard players by name
  const updatedPlayers = existingPlayers.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep: any) => {
      const ocrScores = ocrMap.get(ep.name.toLowerCase().trim());
      if (!ocrScores) return ep;

      // Merge: OCR scores fill in, but keep any existing scores that OCR returned null for
      const mergedScores = ep.scores.map(
        (existing: number | null, i: number) => {
          const ocrVal = ocrScores[i];
          if (ocrVal !== null && ocrVal !== undefined) return ocrVal;
          return existing;
        }
      );

      return { ...ep, scores: mergedScores };
    }
  );

  // If OCR found players not in the existing scorecard, add them
  for (const op of body.players) {
    const alreadyExists = existingPlayers.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ep: any) => ep.name.toLowerCase().trim() === op.name.toLowerCase().trim()
    );
    if (!alreadyExists) {
      updatedPlayers.push({
        id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: op.name,
        handicap: 0,
        scores: op.scores,
      });
    }
  }

  // ─── Update pars if OCR extracted them ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { players: updatedPlayers };

  if (body.pars && Array.isArray(body.pars)) {
    const existingPars = scorecard.pars as number[];
    const mergedPars = existingPars.map((existing: number, i: number) => {
      const ocrPar = body.pars?.[i];
      if (ocrPar !== null && ocrPar !== undefined) return ocrPar;
      return existing;
    });
    updateData.pars = mergedPars;
  }

  const updated = await prisma.scorecards.update({
    where: { id: scorecardId },
    data: updateData,
  });

  console.log(
    "[Scorecard OCR Confirm] Updated scorecard",
    scorecardId,
    "with",
    updatedPlayers.length,
    "players"
  );

  return NextResponse.json({
    ok: true,
    players: updated.players,
    pars: updated.pars,
  });
}
