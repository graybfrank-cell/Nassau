import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://nassau.golf";
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const queryMode = url.searchParams.get("mode");
    const queryTripId = url.searchParams.get("tripId");

    let bodyMode: string | undefined;
    let bodyTripId: string | undefined;
    try {
      const body = await request.json();
      bodyMode = body?.mode;
      bodyTripId = body?.tripId;
    } catch {
      // No JSON body — that's fine when params come from query string
    }

    const mode = queryMode || bodyMode;
    const tripId = queryTripId || bodyTripId;

    if (mode === "trip") {
      if (!tripId) {
        return NextResponse.json(
          { error: "Missing tripId for trip pass checkout" },
          { status: 400 }
        );
      }

      const tripPassPriceId = process.env.STRIPE_TRIP_PASS_PRICE_ID;
      if (!tripPassPriceId) {
        return NextResponse.json(
          { error: "Trip Pass price not configured" },
          { status: 500 }
        );
      }

      const trip = await prisma.trips.findUnique({
        where: { id: tripId },
        select: { id: true, created_by: true, payment_status: true },
      });

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      if (trip.created_by !== user.id) {
        return forbidden();
      }

      if (trip.payment_status !== "unpaid") {
        return NextResponse.json(
          { error: "Trip already paid" },
          { status: 400 }
        );
      }

      const siteUrl = getSiteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price: tripPassPriceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/trips/${tripId}?paid=1`,
        cancel_url: `${siteUrl}/trips/${tripId}`,
        metadata: {
          tripId,
          captainId: user.id,
          mode: "trip_pass",
        },
        client_reference_id: tripId,
      });

      return NextResponse.json({ url: session.url });
    }

    if (mode === "founding") {
      const foundingPriceId = process.env.STRIPE_FOUNDING_PRICE_ID;
      if (!foundingPriceId) {
        return NextResponse.json(
          { error: "Founding Member price not configured" },
          { status: 500 }
        );
      }

      const siteUrl = getSiteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: foundingPriceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/founding?welcome=1`,
        cancel_url: `${siteUrl}/founding`,
        metadata: {
          userId: user.id,
          mode: "founding",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: `Unknown or missing mode: ${mode ?? "(none)"}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[create-checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
