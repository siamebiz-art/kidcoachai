import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

async function notifyUser(
  userEmail: string,
  userName: string,
  action: "approve" | "reject",
  tier: string,
  amount: number,
  ref: string,
  reason?: string,
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "KidCoach AI <onboarding@resend.dev>";

  if (action === "approve") {
    await resend.emails.send({
      from,
      to: userEmail,
      subject: `🎉 สมัครสมาชิก ${tier.toUpperCase()} สำเร็จแล้ว! — KidCoach AI`,
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px 28px">
    <h2 style="color:#fff;margin:0;font-size:20px">🎉 ยินดีต้อนรับสู่ ${tier.toUpperCase()}!</h2>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">KidCoach AI</p>
  </div>
  <div style="padding:24px 28px">
    <p style="color:#374151;font-size:15px">สวัสดี <strong>${userName}</strong>,</p>
    <p style="color:#374151;font-size:14px;line-height:1.6">การชำระเงินของคุณได้รับการตรวจสอบและอนุมัติแล้ว ✅ ตอนนี้คุณสามารถใช้งาน <strong>${tier.toUpperCase()}</strong> ได้เต็มรูปแบบ</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:12px;overflow:hidden">
      <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">แพ็กเกจ</td><td style="padding:10px 16px;font-weight:600;font-size:13px">${tier.toUpperCase()} · ฿${amount}/เดือน</td></tr>
      <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">อ้างอิง</td><td style="padding:10px 16px;font-size:13px">${ref}</td></tr>
      <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">สถานะ</td><td style="padding:10px 16px;font-size:13px">✅ ใช้งานได้แล้ว</td></tr>
    </table>
    <a href="https://kidcoachai.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600">
      เริ่มใช้งาน KidCoach AI →
    </a>
  </div>
</div>`,
    });
  } else {
    await resend.emails.send({
      from,
      to: userEmail,
      subject: `แจ้งผลการตรวจสอบสลิป — KidCoach AI`,
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#f3f4f6;padding:24px 28px">
    <h2 style="color:#374151;margin:0;font-size:20px">แจ้งผลการตรวจสอบสลิป</h2>
    <p style="color:#6b7280;margin:4px 0 0;font-size:14px">KidCoach AI · อ้างอิง ${ref}</p>
  </div>
  <div style="padding:24px 28px">
    <p style="color:#374151;font-size:15px">สวัสดี <strong>${userName}</strong>,</p>
    <p style="color:#374151;font-size:14px;line-height:1.6">ขออภัย เราไม่สามารถยืนยันการชำระเงินของคุณได้ในครั้งนี้</p>
    ${reason ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:13px;color:#92400e">⚠️ ${reason}</div>` : ""}
    <p style="color:#6b7280;font-size:13px;line-height:1.6">กรุณาส่งสลิปใหม่หรือติดต่อทีมงานที่ <a href="mailto:${process.env.ADMIN_EMAIL}" style="color:#7c3aed">${process.env.ADMIN_EMAIL}</a></p>
    <a href="https://kidcoachai.com/dashboard/settings?tab=billing" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;margin-top:8px">
      ส่งสลิปใหม่ →
    </a>
  </div>
</div>`,
    });
  }
}

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

  const userEmail = target.emailAddresses[0]?.emailAddress ?? "";
  const userName  = target.firstName ? `${target.firstName} ${target.lastName ?? ""}`.trim() : "คุณ";

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

  notifyUser(userEmail, userName, action, pp.tier as string, pp.amount as number, pp.ref as string, reason).catch(() => {});

  return NextResponse.json({ ok: true });
}
