import { NextRequest, NextResponse } from "next/server";
import { stripe, getTierFromPriceId } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import type { UserMetadata } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const client = await clerkClient();

  async function updateUserMeta(userId: string, patch: Partial<UserMetadata>) {
    const user = await client.users.getUser(userId);
    await client.users.updateUser(userId, {
      unsafeMetadata: { ...user.unsafeMetadata, ...patch },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription) break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = getTierFromPriceId(priceId);

      await updateUserMeta(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        subscriptionTier: tier,
        subscriptionStatus: sub.status as UserMetadata["subscriptionStatus"],
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = getTierFromPriceId(priceId);
      await updateUserMeta(userId, {
        subscriptionTier: tier,
        subscriptionStatus: sub.status as UserMetadata["subscriptionStatus"],
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) break;

      await updateUserMeta(userId, {
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: undefined,
      });
      break;
    }

  }

  return NextResponse.json({ received: true });
}
