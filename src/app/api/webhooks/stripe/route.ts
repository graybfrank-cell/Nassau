import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Per-Trip Pass purchase
      if (session.metadata?.mode === "trip_pass" && session.metadata.tripId) {
        await prisma.trips.update({
          where: { id: session.metadata.tripId },
          data: {
            payment_status: "paid",
            paid_at: new Date(),
          },
        });
      }

      // Founding Member subscription
      if (session.metadata?.mode === "founding" && session.metadata.userId) {
        await prisma.profiles.update({
          where: { id: session.metadata.userId },
          data: {
            subscription_tier: "founding",
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          },
        });
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
    } else {
      console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/** Extract current_period_end from a subscription's first item (Stripe SDK v20+) */
function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000);
  }
  return null;
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const profile = await prisma.profiles.findFirst({
    where: { stripe_customer_id: customerId },
  });
  if (!profile) return;

  const status = mapStripeStatus(subscription.status);
  const priceId = subscription.items.data[0]?.price.id;
  const tier =
    priceId && priceId === process.env.STRIPE_FOUNDING_PRICE_ID
      ? "founding"
      : profile.subscription_tier;

  await prisma.profiles.update({
    where: { id: profile.id },
    data: {
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      subscription_tier: tier,
      subscription_expires_at: getPeriodEnd(subscription),
    },
  });

  console.log(
    `[stripe-webhook] Subscription updated for ${profile.email}: ${status} (${tier})`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const profile = await prisma.profiles.findFirst({
    where: { stripe_customer_id: customerId },
  });
  if (!profile) return;

  await prisma.profiles.update({
    where: { id: profile.id },
    data: {
      stripe_subscription_id: null,
      subscription_status: "canceled",
      subscription_tier: null,
      subscription_expires_at: getPeriodEnd(subscription),
    },
  });

  console.log(`[stripe-webhook] Subscription canceled for ${profile.email}`);
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "free",
    incomplete_expired: "free",
    paused: "free",
  };
  return statusMap[status] || "free";
}
