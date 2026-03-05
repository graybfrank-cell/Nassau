import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { courseId, courseName, destination, websiteUrl } = await request.json();

  if (!courseId || !courseName) {
    return NextResponse.json(
      { success: false, error: "courseId and courseName are required" },
      { status: 400 }
    );
  }

  const prompt = `You are researching contact information for a golf course to reach out about a partnership with Nassau (nassau.golf), a golf trip planning app.

Course: ${courseName}
Location: ${destination || "unknown"}
Website: ${websiteUrl || "unknown"}

Using web search, find:
1. The marketing director or director of golf's email address
2. A general booking or contact email as fallback
3. The course's official website URL if not provided
4. The name of the marketing contact if available

Focus on finding a real human contact (marketing director, director of golf, GM) rather than a generic info@ address. Check the course website's "Contact" page, LinkedIn, and any press releases.

Return ONLY a JSON object with no other text:
{
  "marketing_contact_name": "First Last or null",
  "marketing_contact_email": "email@course.com or null",
  "booking_email": "booking@course.com or null",
  "website_url": "https://course.com or null",
  "confidence": "high|medium|low",
  "source_notes": "brief note on where you found this info"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Anthropic API error: ${response.status}`, details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();

    const textContent = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    try {
      const clean = textContent.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      return NextResponse.json({ success: true, ...result, courseId });
    } catch {
      return NextResponse.json({
        success: false,
        error: "Could not parse research result",
        raw: textContent,
        courseId,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Research request failed" },
      { status: 500 }
    );
  }
}
