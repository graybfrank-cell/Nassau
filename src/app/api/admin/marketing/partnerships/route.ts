import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { PARTNERSHIPS_PROMPT } from "@/lib/marketing-prompts";
import { loadKnowledgeBase } from "@/lib/marketing-kb";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    let query = supabase
      .from("marketing_partnerships")
      .select("*")
      .order("created_at", { ascending: false });

    if (tier) query = query.eq("tier", tier);
    if (status) query = query.eq("outreach_status", status);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[partnerships] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partnerships" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { action, courseIds, replyText } = body;

    const supabase = createServiceClient();

    if (action === "research_contact") {
      const { courseId } = body;
      if (!courseId) {
        return NextResponse.json(
          { error: "courseId required for research_contact" },
          { status: 400 }
        );
      }

      const { data: course } = await supabase
        .from("marketing_partnerships")
        .select("*")
        .eq("id", courseId)
        .single();

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const prompt = `Research the marketing or partnerships contact for this golf course.

COURSE: ${course.course_name}
DESTINATION: ${course.destination}
REGION: ${course.region || "N/A"}
WEBSITE: ${course.website_url || "N/A"}

Find the best contact person for a golf trip partnership/affiliate inquiry. Look for:
- Director of Golf, Head Pro, General Manager, or Marketing Manager
- Their email address (prefer direct email, but booking/general email is fine as fallback)
- The course website URL

Return JSON with these exact fields:
{
  "marketing_contact_name": "Full Name",
  "marketing_contact_title": "Their Title",
  "marketing_contact_email": "email@example.com",
  "booking_email": "booking or general email if different",
  "website_url": "https://coursewebsite.com",
  "confidence": "high" | "medium" | "low",
  "notes": "where you found this info"
}

If you cannot find a specific contact, still return the best available info with appropriate confidence level.`;

      const response = await callClaude({
        system: PARTNERSHIPS_PROMPT,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      });

      const result = extractJSON(response);
      return NextResponse.json({ result });
    }

    if (action === "save_contact") {
      const { courseId, contactData } = body;
      if (!courseId || !contactData) {
        return NextResponse.json(
          { error: "courseId and contactData required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("marketing_partnerships")
        .update({
          marketing_contact_name: contactData.marketing_contact_name || null,
          marketing_contact_email: contactData.marketing_contact_email || null,
          booking_email: contactData.booking_email || null,
          website_url: contactData.website_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (action === "send_outreach") {
      const { courseId } = body;
      if (!courseId) {
        return NextResponse.json(
          { error: "courseId required for send_outreach" },
          { status: 400 }
        );
      }

      const { data: course } = await supabase
        .from("marketing_partnerships")
        .select("*")
        .eq("id", courseId)
        .single();

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const to = course.marketing_contact_email || course.booking_email;
      if (!to) {
        return NextResponse.json(
          { error: "No contact email found for this course" },
          { status: 400 }
        );
      }

      // Check for email template
      const { data: template } = await supabase
        .from("marketing_email_templates")
        .select("*")
        .eq("tier", course.tier)
        .eq("sequence_position", 1)
        .eq("approved", true)
        .single();

      let subject: string;
      let emailBody: string;

      if (template) {
        subject = template.subject_template
          .replace("{{course_name}}", course.course_name)
          .replace("{{destination}}", course.destination);
        emailBody = template.body_template
          .replace("{{course_name}}", course.course_name)
          .replace("{{destination}}", course.destination);
      } else {
        // Generate with Claude if no template
        const draftResponse = await callClaude({
          system: PARTNERSHIPS_PROMPT,
          messages: [{
            role: "user",
            content: `Draft a short, friendly partnership intro email for ${course.course_name} in ${course.destination}. We're Nassau, a golf trip planning app. Return JSON with "subject" and "body" fields.`,
          }],
        });
        const draft = extractJSON(draftResponse) as { subject?: string; body?: string };
        subject = draft?.subject || `Partnership opportunity — Nassau x ${course.course_name}`;
        emailBody = draft?.body || "";
      }

      // For top_20 tier, queue for review instead of sending
      if (course.tier === "top_20") {
        await supabase
          .from("marketing_partnerships")
          .update({
            outreach_status: "email_1_queued",
            email_history: [{
              position: 1,
              subject,
              body: emailBody,
              status: "queued_for_review",
              created_at: new Date().toISOString(),
            }],
            updated_at: new Date().toISOString(),
          })
          .eq("id", courseId);

        return NextResponse.json({ status: "queued_for_review", subject, body: emailBody });
      }

      // Send email for non-top_20
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Grayson at Nassau <grayson@nassau.golf>",
        replyTo: "grayson@nassau.golf",
        to,
        subject,
        text: emailBody,
      });

      await supabase
        .from("marketing_partnerships")
        .update({
          outreach_status: "email_1_sent",
          last_email_sent_at: new Date().toISOString(),
          email_history: [{
            position: 1,
            subject,
            sent_at: new Date().toISOString(),
            type: "initial_outreach",
          }],
          next_followup_at: new Date(Date.now() + 5 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      return NextResponse.json({ status: "sent", to, subject });
    }

    if (action === "draft_outreach") {
      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return NextResponse.json(
          { error: "courseIds required for draft_outreach" },
          { status: 400 }
        );
      }

      const { data: courses } = await supabase
        .from("marketing_partnerships")
        .select("*")
        .in("id", courseIds);

      // Load KB data for context
      const kbData = loadKnowledgeBase();

      const drafts = [];
      for (const course of courses || []) {
        const kbContext = kbData
          ? `\nKNOWLEDGE BASE DATA: ${JSON.stringify(kbData).slice(0, 2000)}`
          : "";

        const prompt = `Draft a personalized outreach email for this course:

COURSE: ${course.course_name}
DESTINATION: ${course.destination}
REGION: ${course.region || "N/A"}
COURSE TYPE: ${course.course_type || "N/A"}
WEBSITE: ${course.website_url || "N/A"}
TIER: ${course.tier}
${kbContext}

Generate a personalized intro email as JSON with: subject, body, personalization_notes`;

        const response = await callClaude({
          system: PARTNERSHIPS_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });

        const draft = extractJSON(response);
        drafts.push({ courseId: course.id, courseName: course.course_name, draft });
      }

      return NextResponse.json({ drafts });
    }

    if (action === "draft_reply") {
      const { courseId } = body;
      if (!courseId || !replyText) {
        return NextResponse.json(
          { error: "courseId and replyText required for draft_reply" },
          { status: 400 }
        );
      }

      const { data: course } = await supabase
        .from("marketing_partnerships")
        .select("*")
        .eq("id", courseId)
        .single();

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      const prompt = `A course has replied to our outreach. Draft a response.

COURSE: ${course.course_name}
DESTINATION: ${course.destination}
EMAIL HISTORY: ${JSON.stringify(course.email_history || [])}
THEIR REPLY: ${replyText}

Draft a response as JSON with: subject, body, tone_match_notes, recommended_next_step`;

      const response = await callClaude({
        system: PARTNERSHIPS_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const draft = extractJSON(response);
      return NextResponse.json({ draft });
    }

    if (action === "followup") {
      // Query partnerships where next_followup_at <= now()
      const { data: dueFollowups } = await supabase
        .from("marketing_partnerships")
        .select("*")
        .lte("next_followup_at", new Date().toISOString())
        .not("outreach_status", "in", '("active","declined")');

      const results = [];
      const resend = new Resend(process.env.RESEND_API_KEY);

      for (const course of dueFollowups || []) {
        // Fetch the next email template
        const emailCount = (course.email_history || []).length;
        const { data: template } = await supabase
          .from("marketing_email_templates")
          .select("*")
          .eq("tier", course.tier)
          .eq("sequence_position", emailCount + 1)
          .eq("approved", true)
          .single();

        if (!template) {
          results.push({
            courseId: course.id,
            status: "no_template",
          });
          continue;
        }

        // Personalize template
        const subject = template.subject_template
          .replace("{{course_name}}", course.course_name)
          .replace("{{destination}}", course.destination);
        const emailBody = template.body_template
          .replace("{{course_name}}", course.course_name)
          .replace("{{destination}}", course.destination);

        // Send for non-top_20, draft for top_20
        if (course.tier !== "top_20") {
          try {
            const to = course.marketing_contact_email || course.booking_email;
            if (to) {
              await resend.emails.send({
                from: "Grayson at Nassau <grayson@nassau.golf>",
                replyTo: "grayson@nassau.golf",
                to,
                subject,
                text: emailBody,
              });

              // Update partnership record
              const history = [...(course.email_history || []), {
                position: emailCount + 1,
                subject,
                sent_at: new Date().toISOString(),
                type: "followup",
              }];

              await supabase
                .from("marketing_partnerships")
                .update({
                  email_history: history,
                  last_email_sent_at: new Date().toISOString(),
                  outreach_status: `email_${emailCount + 1}_sent`,
                  next_followup_at: new Date(
                    Date.now() + (template.days_after_previous || 5) * 86400000
                  ).toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", course.id);

              results.push({ courseId: course.id, status: "sent" });
            }
          } catch (sendError) {
            console.error(`[partnerships] Failed to send email to ${course.course_name}:`, sendError);
            results.push({ courseId: course.id, status: "send_failed" });
          }
        } else {
          results.push({
            courseId: course.id,
            status: "draft_for_review",
            draft: { subject, body: emailBody },
          });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[partnerships] Error:", error);
    return NextResponse.json(
      { error: "Partnerships agent failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("marketing_partnerships")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[partnerships] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update partnership" },
      { status: 500 }
    );
  }
}
