import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";

const NASSAU_SOCIAL_VOICE = `You are the Nassau Social Content Agent. You write platform-specific content for Nassau (nassau.golf), a golf trip planning and round tracking app.

VOICE: You're the trip captain's inner monologue — loves golf, loves his friends, can't believe nobody Venmo'd him back yet.

TRAITS:
- Clubhouse Cool: Polished but relaxed. Augusta's veranda, not a startup Slack.
- Sharp Not Loud: Confident without trying hard. Dry humor. Never desperate.
- Insider Language: skins, nassau, press, the tips, range rats, the loop, captain
- Stakes Make It Fun: Competitive, money-on-the-line energy
- Captain's Right Hand: You make the organizer's life easier

WORDS WE USE: trip, round, the boys, captain, skins, your crew, your guys, the group, locked in, dialed, pressed, carry, tee it up, let's ride
WORDS WE NEVER USE: event, user, organizer, participant, wager, itinerary management platform, synergy, leverage, nestled, journey, unlock

CONTENT MIX: 60% humor / 20% pain points / 20% product-adjacent
POST RATIO: 70% culture (golf humor, trip captain life) / 30% product (features, demos)

CONTENT PILLARS:
1. Trip planning pain points (group chat chaos, Venmo hell, the guy who won't commit)
2. Golf betting culture (skins, nassau bets, presses, side action, settling up)
3. Course reviews & hidden gems (real courses, real prices, real opinions)
4. Trip budget breakdowns (actual dollar amounts for everything)

RULES:
- Never sound like a marketing team wrote this
- Use specific dollar amounts and course names when relevant
- Every post should pass the "would the trip captain text this?" test
- Humor > polish. A few rough edges feel authentic.
- Not every post needs a CTA. Build trust first.
- Use emojis sparingly — max 2-3 per post, never in a row`;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { content_id, hook, topic, platform, content_type, notes, pillar, scout_alert_id } = body;

    if (!hook && !topic) {
      return NextResponse.json({ error: "hook or topic is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Pull scout alert context if referenced
    let scoutContext = "";
    if (scout_alert_id) {
      const { data: alert } = await supabase
        .from("marketing_scout_alerts")
        .select("*")
        .eq("id", scout_alert_id)
        .single();

      if (alert) {
        scoutContext = `\nSCOUT ALERT CONTEXT:\n- Source: ${alert.source}\n- Summary: ${alert.summary}\n- Opportunity: ${alert.opportunity_type}\n- Suggested response: ${alert.suggested_response || "N/A"}\n- URL: ${alert.url || "N/A"}\n`;
      }
    }

    // Build the generation prompt
    const prompt = `Generate platform-specific content for Nassau.

INPUT:
- Hook/Topic: "${hook || topic}"
- Primary Platform: ${platform || "instagram"}
- Content Type: ${content_type || "post"}
- Pillar: ${pillar || "general"}
- Strategy Notes: ${notes || "None"}
${scoutContext}

Generate content for ALL of these platforms based on the hook/topic above. Adapt the tone, length, and format for each platform while keeping the core message consistent.

Return ONLY a JSON object:

{
  "instagram": {
    "caption": "Full Instagram caption (150-300 words). Hook in first line. Line breaks for readability. 3-5 relevant hashtags at the end. CTA only if natural.",
    "format_suggestion": "carousel | reel | single_image | story",
    "carousel_slides": ["Slide 1 text (hook)", "Slide 2", "Slide 3", "Slide 4", "Slide 5 (CTA)"],
    "reel_script": "15-30 second script with visual cues in [brackets]",
    "alt_hooks": ["Alternative hook option 1", "Alternative hook option 2"]
  },
  "twitter": {
    "tweet": "Single tweet version (under 280 chars). Punchy, no hashtags unless trending.",
    "thread": ["Tweet 1 (hook — must stand alone)", "Tweet 2 (context/story)", "Tweet 3 (the insight)", "Tweet 4 (soft CTA or punchline)"],
    "alt_tweets": ["Alternative single tweet 1", "Alternative single tweet 2"]
  },
  "tiktok": {
    "script": "15-30 second TikTok script. Opening hook (first 2 seconds critical). Text overlay suggestions in [brackets]. Trending format suggestion.",
    "caption": "Short TikTok caption with 3-5 hashtags",
    "sound_suggestion": "Trending sound or original audio suggestion"
  },
  "linkedin": {
    "post": "LinkedIn post (100-200 words). More professional but still authentic. Founder-building-in-public angle. No hashtags.",
    "angle": "The professional angle this takes"
  },
  "email": {
    "subject": "Email subject line (compelling, under 50 chars)",
    "preview": "Preview text (under 60 chars)",
    "body_outline": "3-4 bullet outline of email structure"
  },
  "content_notes": "Strategic notes about this content — best posting time, what to test, cross-promotion ideas"
}`;

    const raw = await callClaude({
      system: NASSAU_SOCIAL_VOICE + "\n\nRespond with ONLY valid JSON, no markdown fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4096,
    });

    const generated = extractJSON(raw);

    // Save generated content back to marketing_content if we have a content_id
    if (content_id) {
      const generatedData = generated as Record<string, unknown>;
      const instagram = generatedData.instagram as Record<string, unknown> | undefined;
      const twitter = generatedData.twitter as Record<string, unknown> | undefined;
      const linkedin = generatedData.linkedin as Record<string, unknown> | undefined;

      await supabase
        .from("marketing_content")
        .update({
          instagram_caption: instagram?.caption || null,
          instagram_carousel: instagram?.carousel_slides || null,
          instagram_reel_script: instagram?.reel_script || null,
          twitter_standalone: twitter?.tweet || null,
          twitter_thread: twitter?.thread || null,
          linkedin_post: linkedin?.post || null,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", content_id);
    }

    return NextResponse.json({
      success: true,
      content: generated,
      content_id: content_id || null,
    });
  } catch (error) {
    console.error("[social-agent] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social agent failed" },
      { status: 500 }
    );
  }
}
