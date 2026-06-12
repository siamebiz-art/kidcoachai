import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId: adminId } = await auth();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const me = await client.users.getUser(adminId);
  if (me.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId, tier } = (await req.json()) as {
    targetUserId: string;
    tier: "free" | "premium" | "pro";
  };

  const target = await client.users.getUser(targetUserId);
  const meta = target.unsafeMetadata as Record<string, unknown>;

  if (tier === "free") {
    await client.users.updateUserMetadata(targetUserId, {
      unsafeMetadata: {
        ...meta,
        subscriptionTier:   "free",
        subscriptionStatus: "inactive",
      },
    });
  } else {
    await client.users.updateUserMetadata(targetUserId, {
      unsafeMetadata: {
        ...meta,
        subscriptionTier:   tier,
        subscriptionStatus: "active",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
