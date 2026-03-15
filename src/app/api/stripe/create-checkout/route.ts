import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRO_PRICE_ID,
  annual: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: Request) {
  try {
    const { plan, userId, email } = await request.json();

    if (!plan || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: plan, userId, email" },
        { status: 400 },
      );
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Unknown plan: ${plan}` },
        { status: 400 },
      );
    }

    const isMonthly = plan === "monthly";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { userId },
      success_url: "https://nassau.golf/dashboard?subscribed=true",
      cancel_url: "https://nassau.golf/pricing",
      ...(isMonthly && {
        subscription_data: { trial_period_days: 30 },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
