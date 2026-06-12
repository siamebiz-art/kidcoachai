import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/* ── POST /api/admin/approve ── */
export async function POST(req: NextRequest) {
  const { userId: adminId } = await auth();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const me = await client.users.getUser(adminId);
  const myEmail = me.emailAddresses[0]?.emailAddress;
  if (myEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId, action, reason } = (await req.json()) as {
    targetUserId: string;
    action: "approve" | "reject";
    reason?: string;
  };

  const target = await client.users.getUser(targetUserId);
  const meta = target.unsafeMetadata as Record<string, unknown>;
  const pp = meta.pendingPayment as Record<string, unknown> | undefined;
  if (!pp) return NextResponse.json({ error: "No pending payment" }, { status: 404 });

  if (action === "approve") {
    await client.users.updateUserMetadata(targetUserId, {
      unsafeMetadata: {
        ...meta,
        subscriptionTier:   pp.tier,
        subscriptionStatus: "active",
        pendingPayment: { ...pp, status: "approved" },
      },
    });
  } else {
    await client.users.updateUserMetadata(targetUserId, {
      unsafeMetadata: {
        ...meta,
        pendingPayment: { ...pp, status: "rejected", rejectedReason: reason ?? "" },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
