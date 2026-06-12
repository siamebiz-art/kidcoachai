import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  if (me.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await client.users.getUserList({ limit: 500 });
  const users = response.data;

  const PRICES = {
    premium: parseInt(process.env.PREMIUM_PRICE_THB ?? "299"),
    pro:     parseInt(process.env.PRO_PRICE_THB     ?? "599"),
  };

  let premium = 0, pro = 0, revenue = 0;
  const growthByMonth: Record<string, number> = {};

  for (const u of users) {
    const meta = u.unsafeMetadata as Record<string, unknown>;
    const tier   = meta.subscriptionTier   as string | undefined;
    const status = meta.subscriptionStatus as string | undefined;
    const pp     = meta.pendingPayment     as Record<string, unknown> | undefined;

    if (status === "active") {
      if (tier === "premium") { premium++; revenue += PRICES.premium; }
      if (tier === "pro")     { pro++;     revenue += PRICES.pro; }
    }

    // approved via PromptPay — also count revenue from slip
    if (pp?.status === "approved") {
      const ppTier = pp.tier as string;
      if (ppTier === "premium") { premium++; revenue += PRICES.premium; }
      if (ppTier === "pro")     { pro++;     revenue += PRICES.pro; }
    }

    const joined = new Date(u.createdAt);
    const key = `${joined.getFullYear()}-${String(joined.getMonth() + 1).padStart(2, "0")}`;
    growthByMonth[key] = (growthByMonth[key] ?? 0) + 1;
  }

  const growth = Object.entries(growthByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    totalUsers: users.length,
    premium,
    pro,
    free: users.length - premium - pro,
    revenue,
    growth,
  });
}
