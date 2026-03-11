import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.marketing_contact_name !== undefined)
    updateData.marketing_contact_name = body.marketing_contact_name;
  if (body.marketing_contact_email !== undefined)
    updateData.marketing_contact_email = body.marketing_contact_email;
  if (body.booking_email !== undefined) updateData.booking_email = body.booking_email;
  if (body.website_url !== undefined) updateData.website_url = body.website_url;
  if (body.confidence !== undefined) updateData.confidence = body.confidence;
  if (body.source_notes !== undefined) updateData.source_notes = body.source_notes;
  if (body.needs_review !== undefined) updateData.needs_review = body.needs_review;

  const { data, error } = await supabaseAdmin
    .from("marketing_partnerships")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
