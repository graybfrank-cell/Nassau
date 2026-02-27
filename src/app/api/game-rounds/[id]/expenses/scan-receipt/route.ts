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
              text: `You are reading a receipt image. Extract expense information from it.

Return a JSON object with this EXACT structure (no markdown, no explanation, just the JSON):
{
  "expenses": [
    {
      "description": "Brief description of the item or charge",
      "amount": 42.50,
      "category": "food"
    }
  ]
}

Rules:
- Each line item or charge should be a separate expense entry
- "amount" must be a number (no currency symbols)
- "category" must be one of: "golf", "food", "drinks", "transport", "other"
- Use your best judgment to categorize items:
  - "golf" for green fees, cart fees, range balls, pro shop items
  - "food" for meals, snacks
  - "drinks" for beverages, alcohol
  - "transport" for gas, parking, rideshares
  - "other" for anything else
- If the receipt has a single total and no itemized lines, return one expense with the total
- If tax/tip are separate line items, include them as their own entries under "other"
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
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Receipt scan error:", err);
    return NextResponse.json(
      { error: "Failed to process receipt image" },
      { status: 500 }
    );
  }
}
