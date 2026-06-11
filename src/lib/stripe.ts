import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PRICE_IDS = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
} as const;

export type SubscriptionTier = "free" | "premium" | "pro";

export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return "free";
}
