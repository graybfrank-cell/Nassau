import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail, FROM_PERSONAL, REPLY_TO_PERSONAL } from "@/lib/email";
import { renderPaymentConfirmation } from "@/emails/PaymentConfirmation";

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
        const tripId = session.metadata.tripId;
        await prisma.trips.update({
          where: { id: tripId },
          data: {
            payment_status: "paid",
            paid_at: new Date(),
          },
        });

        // Fire-and-forget payment confirmation email to captain
        sendTripPassConfirmationEmail(tripId, session).catch((err) => {
          console.error(
            "[stripe-webhook] Trip pass confirmation email failed:",
            err
          );
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

      // Kit Purchase (from kit preview page checkout)
      if (session.metadata?.mode === "kit" && session.metadata.destination_slug) {
        const stripeSessionId = session.id;
        const destinationSlug = session.metadata.destination_slug;
        const destinationName = session.metadata.destination_name || "";
        const kitTitle = session.metadata.kit_title || destinationName;
        const customerEmail = session.customer_email || session.customer_details?.email || "";
        const amountPaid = session.amount_total ?? 2900; // cents, default $29
        const currency = (session.currency || "usd").toLowerCase();
        const stripePaymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        if (!customerEmail) {
          console.error(
            "[stripe-webhook] Kit purchase missing customer email:",
            stripeSessionId
          );
          // Still record the purchase; we'll reconcile email later
        }

        try {
          await prisma.kitPurchases.upsert({
            where: { stripe_session_id: stripeSessionId },
            create: {
              stripe_session_id: stripeSessionId,
              stripe_payment_intent_id: stripePaymentIntentId,
              stripe_customer_id: stripeCustomerId,
              customer_email: customerEmail,
              destination_slug: destinationSlug,
              destination_name: destinationName,
              kit_title: kitTitle,
              amount_paid: amountPaid,
              currency,
              metadata: session.metadata as object,
            },
            update: {
              // Idempotent — if Stripe retries the webhook, we don't double-record
              // but we update payment_intent in case it wasn't set on first call
              stripe_payment_intent_id: stripePaymentIntentId,
              stripe_customer_id: stripeCustomerId,
            },
          });

          console.log(
            `[stripe-webhook] Kit purchase recorded: ${destinationSlug} for ${customerEmail} ($${(amountPaid / 100).toFixed(2)})`
          );
        } catch (err) {
          console.error(
            `[stripe-webhook] Failed to record kit purchase ${stripeSessionId}:`,
            err
          );
          // Don't throw — webhook should still return 200 to Stripe
          // We'll need to manually reconcile if this fails
        }
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

/**
 * Send the captain a payment confirmation after a successful trip-pass
 * purchase. Resolves the receipt URL via the Stripe-hosted invoice when
 * available; falls back to a generic "charge will appear" line.
 */
async function sendTripPassConfirmationEmail(
  tripId: string,
  session: Stripe.Checkout.Session
) {
  const trip = await prisma.trips.findUnique({
    where: { id: tripId },
    include: { creator: { select: { email: true, full_name: true } } },
  });
  if (!trip || !trip.creator?.email) return;

  let stripeReceiptUrl: string | undefined;
  try {
    const invoiceId =
      typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      stripeReceiptUrl = invoice.hosted_invoice_url || undefined;
    }
  } catch (err) {
    console.warn("[stripe-webhook] Could not retrieve invoice for receipt:", err);
  }

  const amountTotal = session.amount_total ?? 999;
  const currency = (session.currency || "usd").toLowerCase();
  const amount =
    currency === "usd"
      ? `$${(amountTotal / 100).toFixed(2)}`
      : `${(amountTotal / 100).toFixed(2)} ${currency.toUpperCase()}`;

  await sendEmail({
    from: FROM_PERSONAL,
    replyTo: REPLY_TO_PERSONAL,
    to: trip.creator.email,
    subject: `Trip unlocked: ${trip.name}`,
    html: renderPaymentConfirmation({
      captainName: trip.creator.full_name || "Captain",
      tripName: trip.name,
      amount,
      tripUrl: `https://nassau.golf/trips/${trip.id}`,
      stripeReceiptUrl,
    }),
  });
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
