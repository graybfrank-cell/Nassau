import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

// Allow up to 60s for Claude Vision processing
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  // ─── Parse multipart form data ────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI scorecard reading is not configured." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("photo") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No photo uploaded" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be JPEG, PNG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be under 5 MB" },
      { status: 400 }
    );
  }

  // ─── Convert to base64 for Claude Vision ──────────────────
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type as
    | "image/jpeg"
    | "image/png"
    | "image/webp";

  // ─── Build existing player names for context ──────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPlayers = (scorecard.players as any[]).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.name
  );

  // ─── Call Claude Vision ───────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    console.log(
      "[Scorecard OCR] Calling Claude Vision, image size:",
      file.size,
      "type:",
      file.type
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are a golf scorecard OCR system. Extract hole-by-hole scores from this scorecard image. Return ONLY valid JSON with no other text or markdown.

The scorecard has 18 holes. For each player, extract their name and their score for each hole (1-18). If a score is unreadable or missing, use null.

Known players on this scorecard: ${existingPlayers.join(", ")}
If you can match handwritten names to these known players, use the known player names.

Return this exact JSON format:
{
  "players": [
    {
      "name": "Player Name",
      "scores": [hole1, hole2, hole3, ..., hole18],
      "total": number_or_null
    }
  ],
  "pars": [par1, par2, ..., par18],
  "confidence": "high" | "medium" | "low",
  "notes": "any issues or observations about the scorecard"
}

Rules:
- Each score should be an integer 1-15, or null if unreadable
- pars should be integers 3-6, or null if not visible
- If only 9 holes are visible, fill remaining holes with null
- If you cannot read the scorecard at all, return: { "error": "Could not read scorecard", "notes": "description of the issue" }`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extract all player scores from this golf scorecard. Return the JSON as specified.",
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[Scorecard OCR] Claude API error:", response.status, errBody);
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Try again in a minute." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to process scorecard image. Try again?" },
        { status: 502 }
      );
    }

    const result = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textContent = result.content?.find((c: any) => c.type === "text");
    if (!textContent?.text) {
      return NextResponse.json(
        { error: "AI returned an empty response. Try again?" },
        { status: 502 }
      );
    }

    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const data = JSON.parse(jsonStr);

      // Validate structure
      if (data.error) {
        return NextResponse.json(
          {
            error: data.error,
            notes: data.notes || "Could not extract scores from this image.",
          },
          { status: 422 }
        );
      }

      if (!data.players || !Array.isArray(data.players)) {
        return NextResponse.json(
          { error: "AI could not identify players in the scorecard." },
          { status: 422 }
        );
      }

      // Normalize scores: ensure each player has exactly 18 entries
      for (const player of data.players) {
        if (!Array.isArray(player.scores)) player.scores = Array(18).fill(null);
        while (player.scores.length < 18) player.scores.push(null);
        player.scores = player.scores.slice(0, 18).map((s: unknown) => {
          if (s === null || s === undefined) return null;
          const n = Number(s);
          return !isNaN(n) && n >= 1 && n <= 15 ? n : null;
        });
      }

      // Normalize pars
      if (Array.isArray(data.pars)) {
        while (data.pars.length < 18) data.pars.push(null);
        data.pars = data.pars.slice(0, 18).map((p: unknown) => {
          if (p === null || p === undefined) return null;
          const n = Number(p);
          return !isNaN(n) && n >= 3 && n <= 6 ? n : null;
        });
      }

      console.log(
        "[Scorecard OCR] Extracted",
        data.players.length,
        "players, confidence:",
        data.confidence
      );

      return NextResponse.json({
        extracted: data,
        scorecardId,
        existingPlayers,
      });
    } catch (parseErr) {
      console.error("[Scorecard OCR] JSON parse failed:", parseErr);
      return NextResponse.json(
        { error: "AI returned invalid data. Try again?" },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      return NextResponse.json(
        { error: "Processing took too long. Try a clearer photo?" },
        { status: 504 }
      );
    }
    console.error("[Scorecard OCR] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Something went wrong. Try again?" },
      { status: 500 }
    );
  }
}
