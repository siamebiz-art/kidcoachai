import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import QRCode from "qrcode";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const generatePayload = require("promptpay-qr") as (
  id: string,
  opts?: { amount?: number },
) => string;

const PRICES = {
  premium: parseInt(process.env.PREMIUM_PRICE_THB ?? "299"),
  pro:     parseInt(process.env.PRO_PRICE_THB     ?? "599"),
};

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

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.unsafeMetadata as Record<string, unknown>;

  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      ...meta,
      pendingPayment: {
        tier,
        amount,
        slipUrl,
        ref,
        submittedAt: new Date().toISOString(),
        status: "pending",
      },
    },
  });

  return NextResponse.json({ ok: true, ref });
}
