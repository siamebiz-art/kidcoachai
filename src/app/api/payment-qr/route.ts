import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import QRCode from "qrcode";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { AiSlipCheck } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const generatePayload = require("promptpay-qr") as (
  id: string,
  opts?: { amount?: number },
) => string;

const PRICES = {
  premium: parseInt(process.env.PREMIUM_PRICE_THB ?? "299"),
  pro:     parseInt(process.env.PRO_PRICE_THB     ?? "599"),
};

async function verifySlipWithAI(slipUrl: string, expectedAmount: number): Promise<AiSlipCheck | null> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `คุณคือผู้ตรวจสอบสลิปโอนเงินธนาคารไทย
ตรวจสอบภาพสลิปนี้อย่างละเอียด ยอดเงินที่ควรโอนคือ ${expectedAmount} บาท
ตอบกลับเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น:
{
  "valid": true,
  "amount": 299,
  "amountMatch": true,
  "bank": "ชื่อธนาคาร",
  "confidence": "high",
  "reason": "เหตุผลสั้นๆ"
}

กฎการตรวจสอบ:
- valid: true ถ้าเป็นสลิปธนาคารไทยจริง ไม่ถูกแต่ง/ปลอม
- amount: ยอดเงินที่อ่านได้จากสลิป (ตัวเลข)
- amountMatch: true ถ้า amount ตรงกับ ${expectedAmount} บาท (±1 บาทได้)
- bank: ชื่อธนาคารเช่น ไทยพาณิชย์, กสิกร, กรุงเทพ, กรุงไทย ฯลฯ
- confidence: "high" ถ้าอ่านชัดเจน, "medium" ถ้าไม่แน่ใจ, "low" ถ้าอ่านไม่ได้หรือน่าสงสัย
- reason: สรุปสั้นๆ ว่าเห็นอะไรในสลิป`,
          },
          { type: "image", image: new URL(slipUrl) },
        ],
      }],
      maxOutputTokens: 300,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return { ...parsed, checkedAt: new Date().toISOString() } as AiSlipCheck;
  } catch {
    return null;
  }
}

/* ── GET /api/payment-qr?tier=premium → returns SVG QR image ── */
export async function GET(req: NextRequest) {
  const tier = (req.nextUrl.searchParams.get("tier") ?? "premium") as "premium" | "pro";
  const amount = PRICES[tier] ?? PRICES.premium;
  const promptpayId = process.env.PROMPTPAY_ID;
  if (!promptpayId) return new Response("PROMPTPAY_ID not configured", { status: 500 });

  const payload = generatePayload(promptpayId, { amount });
  const svg = await QRCode.toString(payload, { type: "svg", width: 280, margin: 2 });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
}

/* ── POST /api/payment-qr → submit slip after transfer ── */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier, slipUrl } = (await req.json()) as { tier: "premium" | "pro"; slipUrl: string };
  if (!tier || !slipUrl) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ref = `KID-${tier.slice(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  const amount = PRICES[tier] ?? PRICES.premium;

  // AI slip verification
  const aiCheck = await verifySlipWithAI(slipUrl, amount);

  // Reject immediately if AI is confident this is invalid/fake
  if (aiCheck && !aiCheck.valid && aiCheck.confidence === "high") {
    return NextResponse.json(
      { error: `สลิปไม่ผ่านการตรวจสอบ: ${aiCheck.reason}` },
      { status: 400 },
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.unsafeMetadata as Record<string, unknown>;

  // Auto-approve if AI is highly confident and amount matches
  const autoApproved = aiCheck?.valid && aiCheck?.amountMatch && aiCheck?.confidence === "high";

  const pendingPayment = {
    tier,
    amount,
    slipUrl,
    ref,
    submittedAt: new Date().toISOString(),
    status: autoApproved ? "ai_approved" : "pending",
    ...(aiCheck ? { aiCheck } : {}),
  };

  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      ...meta,
      ...(autoApproved ? { subscriptionTier: tier, subscriptionStatus: "active" } : {}),
      pendingPayment,
    },
  });

  return NextResponse.json({ ok: true, ref, autoApproved: autoApproved ?? false });
}
