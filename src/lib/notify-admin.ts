import { Resend } from "resend";
import type { AiSlipCheck } from "@/lib/types";

interface NotifyPayload {
  ref: string;
  tier: "premium" | "pro";
  amount: number;
  userEmail: string;
  userName: string;
  slipUrl: string;
  autoApproved: boolean;
  aiCheck?: AiSlipCheck | null;
}

/* ── Email via Resend ── */
async function sendEmail(p: NotifyPayload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "KidCoach AI <onboarding@resend.dev>";
  const to   = process.env.ADMIN_EMAIL  ?? "siamebiz@gmail.com";

  const aiRow = p.aiCheck
    ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">AI ตรวจสอบ</td>
       <td style="padding:6px 0;font-size:13px">
         ${p.aiCheck.valid ? "✅ ผ่าน" : "❌ ไม่ผ่าน"} ·
         ${p.aiCheck.bank} · ฿${p.aiCheck.amount} ·
         Confidence: <strong>${p.aiCheck.confidence}</strong><br/>
         <span style="color:#6b7280">${p.aiCheck.reason}</span>
       </td></tr>`
    : "";

  const statusBadge = p.autoApproved
    ? `<span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:99px;font-size:12px">🤖 AI อนุมัติอัตโนมัติ</span>`
    : `<span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:99px;font-size:12px">⏳ รอตรวจสอบ</span>`;

  await resend.emails.send({
    from,
    to,
    subject: `[KidCoach] 🧾 สลิปใหม่ ${p.ref} — ${p.tier.toUpperCase()} ฿${p.amount}`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px 28px">
    <h2 style="color:#fff;margin:0;font-size:20px">🧾 สลิปชำระเงินใหม่</h2>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">KidCoach AI · PromptPay</p>
  </div>
  <div style="padding:24px 28px">
    ${statusBadge}
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">อ้างอิง</td><td style="padding:6px 0;font-weight:600;font-size:13px">${p.ref}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">แพ็กเกจ</td><td style="padding:6px 0;font-size:13px">${p.tier.toUpperCase()} · ฿${p.amount}/เดือน</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">ผู้ใช้</td><td style="padding:6px 0;font-size:13px">${p.userName}<br/><span style="color:#6b7280">${p.userEmail}</span></td></tr>
      ${aiRow}
    </table>

    <div style="margin-top:16px;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <img src="${p.slipUrl}" alt="สลิป" style="width:100%;display:block;max-height:320px;object-fit:cover"/>
    </div>

    <div style="margin-top:20px;display:flex;gap:8px">
      <a href="https://kidcoachai.com/admin" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600">
        เปิด Admin Dashboard
      </a>
      <a href="${p.slipUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;text-decoration:none;padding:10px 20px;border-radius:10px;font-size:14px">
        ดูสลิปเต็ม
      </a>
    </div>
  </div>
</div>`,
  });
}

/* ── Line Notify ── */
async function sendLineNotify(p: NotifyPayload) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) return;

  const aiSummary = p.aiCheck
    ? `\n🤖 AI: ${p.aiCheck.valid ? "✅ ผ่าน" : "❌ ไม่ผ่าน"} · ${p.aiCheck.bank} · ฿${p.aiCheck.amount} (${p.aiCheck.confidence})\n${p.aiCheck.reason}`
    : "";

  const status = p.autoApproved ? "🤖 AI อนุมัติอัตโนมัติแล้ว" : "⏳ รอตรวจสอบ";

  const message = [
    "",
    "🧾 สลิปชำระเงินใหม่ — KidCoach AI",
    `📋 ${p.ref}`,
    `💎 ${p.tier.toUpperCase()} · ฿${p.amount}`,
    `👤 ${p.userName} (${p.userEmail})`,
    `📊 ${status}`,
    aiSummary,
    `🔗 https://kidcoachai.com/admin`,
  ].join("\n");

  const form = new FormData();
  form.append("message", message);
  form.append("imageFullsize",    p.slipUrl);
  form.append("imageThumbnail",   p.slipUrl);

  await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

/* ── Public: send all configured channels ── */
export async function notifyAdmin(payload: NotifyPayload) {
  await Promise.allSettled([
    sendEmail(payload),
    sendLineNotify(payload),
  ]);
}
