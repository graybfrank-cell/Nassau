/**
 * Client-side helper to initiate a kit purchase checkout flow.
 *
 * Usage:
 *   await redirectToKitCheckout("bandon-dunes-or");
 *
 * On success: redirects the browser to Stripe Checkout.
 * On failure: throws an Error with a user-facing message.
 */
export async function redirectToKitCheckout(
  destinationSlug: string
): Promise<void> {
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "kit",
      destination_slug: destinationSlug,
    }),
  });

  if (!res.ok) {
    let message = "Couldn't start checkout. Please try again.";
    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // No JSON body — use default message
    }
    throw new Error(message);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error("Checkout URL missing from response.");
  }

  window.location.href = data.url;
}
