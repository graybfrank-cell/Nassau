import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    // Query approved content that's scheduled and not yet published
    const { data: readyContent, error } = await supabase
      .from("marketing_content")
      .select("*")
      .eq("status", "approved")
      .lte("scheduled_at", new Date().toISOString())
      .is("published_at", null);

    if (error) {
      console.error("[distributor] Failed to fetch content:", error);
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }

    const published = [];
    for (const content of readyContent || []) {
      // For now (no Buffer yet): update status to published
      const { error: updateError } = await supabase
        .from("marketing_content")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", content.id);

      if (updateError) {
        console.error(
          `[distributor] Failed to publish ${content.id}:`,
          updateError
        );
      } else {
        published.push(content);
      }
    }

    console.log(`[distributor] Published ${published.length} content items`);
    return NextResponse.json({ published });
  } catch (error) {
    console.error("[distributor] Error:", error);
    return NextResponse.json(
      { error: "Distributor agent failed" },
      { status: 500 }
    );
  }
}
