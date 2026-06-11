import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import type { SubscriptionTier } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const { tier } = (await req.json()) as { tier: SubscriptionTier };

  const priceId = tier === "pro" ? PRICE_IDS.pro : PRICE_IDS.premium;
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user?.emailAddresses[0]?.emailAddress,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    success_url: `${appUrl}/dashboard/settings?tab=billing&success=1`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
    locale: "th",
  });

  return NextResponse.json({ url: session.url });
}
