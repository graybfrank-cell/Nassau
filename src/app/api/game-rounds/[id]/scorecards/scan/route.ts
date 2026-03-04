import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!round.players.some((p) => p.user_id === user.id)) return forbidden();

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // Convert to base64
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  // Determine media type
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
  if (file.type === "image/png") mediaType = "image/png";
  else if (file.type === "image/webp") mediaType = "image/webp";
  else if (file.type === "image/gif") mediaType = "image/gif";

  // Build player list for context
  const playerNames = round.players
    .filter((p) => p.status === "confirmed" || p.role === "COMMISSIONER")
    .map((p) => p.name)
    .join(", ");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `You are reading a golf scorecard image. Extract the scores for each player for all 18 holes.

The players in this round are: ${playerNames}

Return a JSON object with this EXACT structure (no markdown, no explanation, just the JSON):
{
  "players": [
    {
      "name": "Player Name",
      "holes": [4, 5, 3, 4, 5, 4, 3, 4, 5, 4, 5, 3, 4, 5, 4, 3, 4, 5]
    }
  ]
}

Rules:
- "holes" must be an array of exactly 18 numbers (one per hole, holes 1-18)
- Use 0 for any hole where the score is unreadable or not present
- Match player names to the known players as closely as possible
- If the scorecard only shows 9 holes, fill the remaining 9 with 0
- Return ONLY the JSON, nothing else`,
            },
          ],
        },
      ],
    });

    // Extract the text content
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from vision model" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const raw = textBlock.text.trim();
    // Handle potential markdown code fences
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Scorecard scan error:", err);
    return NextResponse.json(
      { error: "Failed to process scorecard image" },
      { status: 500 }
    );
  }
}
