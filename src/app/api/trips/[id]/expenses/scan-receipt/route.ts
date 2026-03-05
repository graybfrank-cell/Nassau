import { NextRequest, NextResponse } from "next/server";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

// Allow up to 60s for Claude Vision processing
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CATEGORY_MAP: Record<string, string> = {
  golf: "Green Fees",
  restaurant: "Food & Drinks",
  bar: "Bar Tab",
  hotel: "Lodging",
  gas: "Gas/Transport",
  uber: "Gas/Transport",
  lyft: "Gas/Transport",
  grocery: "Supplies",
  store: "Supplies",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI receipt reading is not configured." },
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

  // Convert to base64 for Claude Vision
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  // Call Claude Vision
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    console.log(
      "[Receipt OCR] Calling Claude Vision, image size:",
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
        max_tokens: 1500,
        system: `You are a receipt OCR system for a golf trip expense tracker app. Extract expense details from this receipt image. Return ONLY valid JSON with no other text or markdown.

Return this exact JSON format:
{
  "merchant": "Name of the business/venue",
  "total": 123.45,
  "subtotal": 100.00,
  "tax": 8.45,
  "tip": 15.00,
  "date": "2025-01-15",
  "category": "restaurant" | "bar" | "golf" | "hotel" | "gas" | "uber" | "lyft" | "grocery" | "store" | "other",
  "items": [
    { "name": "Item description", "amount": 12.50, "qty": 1 }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "any issues or observations about the receipt"
}

Rules:
- "total" is the final amount paid (including tax and tip). This is the most important field.
- If the total is unclear, sum up the items plus tax/tip as a best guess.
- "date" should be ISO format (YYYY-MM-DD) or "" if not visible.
- "items" is an array of line items. Include as many as you can read.
- If tip is written in by hand, try to read it. If not visible, use 0.
- "category" should be your best guess based on the merchant name and items.
- If you cannot read the receipt at all, return: { "error": "Could not read receipt", "notes": "description of the issue" }`,
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
                text: "Extract all expense details from this receipt. Return the JSON as specified.",
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
      console.error("[Receipt OCR] Claude API error:", response.status, errBody);
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Try again in a minute." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to process receipt image. Try again?" },
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

      if (data.error) {
        return NextResponse.json(
          {
            error: data.error,
            notes: data.notes || "Could not extract details from this receipt.",
          },
          { status: 422 }
        );
      }

      // Map category to our app categories
      const rawCat = (data.category || "other").toLowerCase();
      const appCategory = CATEGORY_MAP[rawCat] || "Other";

      // Build clean response
      const extracted = {
        merchant: data.merchant || "Receipt",
        total: typeof data.total === "number" ? Math.round(data.total * 100) / 100 : 0,
        subtotal: typeof data.subtotal === "number" ? Math.round(data.subtotal * 100) / 100 : null,
        tax: typeof data.tax === "number" ? Math.round(data.tax * 100) / 100 : null,
        tip: typeof data.tip === "number" ? Math.round(data.tip * 100) / 100 : null,
        date: data.date || "",
        category: appCategory,
        items: Array.isArray(data.items)
          ? data.items.map((item: { name?: string; amount?: number; qty?: number }) => ({
              name: item.name || "",
              amount: typeof item.amount === "number" ? Math.round(item.amount * 100) / 100 : 0,
              qty: item.qty || 1,
            }))
          : [],
        confidence: data.confidence || "medium",
        notes: data.notes || "",
      };

      console.log(
        "[Receipt OCR] Extracted:",
        extracted.merchant,
        "$" + extracted.total,
        "confidence:",
        extracted.confidence
      );

      return NextResponse.json({ extracted });
    } catch (parseErr) {
      console.error("[Receipt OCR] JSON parse failed:", parseErr);
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
    console.error("[Receipt OCR] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Something went wrong. Try again?" },
      { status: 500 }
    );
  }
}
