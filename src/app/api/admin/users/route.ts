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

  const response = await client.users.getUserList({ limit: 500, orderBy: "-created_at" });

  const users = response.data.map((u) => {
    const meta = u.unsafeMetadata as Record<string, unknown>;
    return {
      userId:      u.id,
      name:        u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "ไม่ระบุ",
      email:       u.emailAddresses[0]?.emailAddress ?? "",
      tier:        (meta.subscriptionTier   as string) ?? "free",
      status:      (meta.subscriptionStatus as string) ?? "inactive",
      joinedAt:    new Date(u.createdAt).toISOString(),
      lastActive:  u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
      hasPending:  !!(meta.pendingPayment),
    };
  });

  return NextResponse.json({ users });
}
