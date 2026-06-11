import Stripe from "stripe";

// Lazy singleton — only instantiated when first API call is made, not at build time
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export const PRICE_IDS = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
} as const;

export type SubscriptionTier = "free" | "premium" | "pro";

export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId && priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return "free";
}
