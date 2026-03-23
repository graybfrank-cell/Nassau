import { NextRequest, NextResponse } from "next/server";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
];
const BUCKET = "trip-photos";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;

  // Verify trip membership
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  // List all photos in the trip folder
  const { data: files, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(`${tripId}`, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase .list returns top-level items. We need to list recursively
  // by listing each user subfolder. Instead, list with a search prefix.
  const allPhotos: Array<{
    name: string;
    path: string;
    url: string;
    uploadedBy: string;
    createdAt: string;
  }> = [];

  // Get all trip members to list their subfolders
  const members = await prisma.tripMembers.findMany({
    where: { trip_id: tripId },
    select: { user_id: true },
  });

  for (const member of members) {
    const { data: memberFiles } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(`${tripId}/${member.user_id}`, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (memberFiles) {
      for (const file of memberFiles) {
        if (file.name === ".emptyFolderPlaceholder") continue;
        const path = `${tripId}/${member.user_id}/${file.name}`;
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(path);

        allPhotos.push({
          name: file.name,
          path,
          url: urlData.publicUrl,
          uploadedBy: member.user_id,
          createdAt: file.created_at || new Date().toISOString(),
        });
      }
    }
  }

  // Sort by most recent first
  allPhotos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ photos: allPhotos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;

  // Verify trip membership
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Accepted: jpeg, png, heic, webp` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${tripId}/${user.id}/${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({
    url: urlData.publicUrl,
    path: storagePath,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;

  // Verify trip membership
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const body: unknown = await req.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("path" in body) ||
    typeof (body as { path: string }).path !== "string"
  ) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const { path } = body as { path: string };

  // Verify the path belongs to this trip
  if (!path.startsWith(`${tripId}/`)) {
    return forbidden();
  }

  // Only the uploader or the trip creator can delete
  const isUploader = path.startsWith(`${tripId}/${user.id}/`);
  const trip = await prisma.trips.findUnique({
    where: { id: tripId },
    select: { created_by: true },
  });
  const isTripCreator = trip?.created_by === user.id;

  if (!isUploader && !isTripCreator) {
    return NextResponse.json(
      { error: "Only the uploader or trip creator can delete photos" },
      { status: 403 }
    );
  }

  const { error: deleteError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path]);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
