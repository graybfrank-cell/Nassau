import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import { getDestinationBySlug } from "@/lib/destination-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://nassau.golf";
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryMode = url.searchParams.get("mode");
    const queryTripId = url.searchParams.get("tripId");
    const querySlug = url.searchParams.get("destination_slug");

    let bodyMode: string | undefined;
    let bodyTripId: string | undefined;
    let bodySlug: string | undefined;
    try {
      const body = await request.json();
      bodyMode = body?.mode;
      bodyTripId = body?.tripId;
      bodySlug = body?.destination_slug;
    } catch {
      // No JSON body — that's fine when params come from query string
    }

    const mode = queryMode || bodyMode;
    const tripId = queryTripId || bodyTripId;
    const destinationSlug = querySlug || bodySlug;

    // ─── KIT MODE (guest checkout, no auth required) ───────────────
    if (mode === "kit") {
      if (!destinationSlug) {
        return NextResponse.json(
          { error: "Missing destination_slug for kit checkout" },
          { status: 400 }
        );
      }

      const dest = getDestinationBySlug(destinationSlug);
      if (!dest) {
        return NextResponse.json(
          { error: `Unknown destination: ${destinationSlug}` },
          { status: 404 }
        );
      }

      const kitPriceId = process.env.STRIPE_KIT_PRICE_ID;
      if (!kitPriceId) {
        return NextResponse.json(
          { error: "Kit price not configured" },
          { status: 500 }
        );
      }

      const siteUrl = getSiteUrl();
      const kitTitle = dest.kit_title ?? dest.destination;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price: kitPriceId,
            quantity: 1,
          },
        ],
        custom_text: {
          submit: {
            message:
              "One-time purchase. 7-day refund if you're not satisfied. Email support@nassau.golf.",
          },
        },
        customer_creation: "always",
        payment_method_types: ["card"],
        success_url: `${siteUrl}/trip/preview/${destinationSlug}/purchased?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/trip/preview/${destinationSlug}`,
        metadata: {
          mode: "kit",
          destination_slug: destinationSlug,
          destination_name: dest.destination,
          kit_title: kitTitle,
        },
        client_reference_id: destinationSlug,
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    }

    // ─── EXISTING MODES (require auth) ──────────────────────────────
    const user = await getUser();
    if (!user) return unauthorized();

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
