import { currentUser, clerkClient } from "@clerk/nextjs/server";
import type { UserMetadata } from "./types";

type RouteId = "ai-coach" | "kido-chat" | "generate-plan" | "kido-recommendation" | "kido-story" | "kido-eq" | "kido-homework" | "kido-creative" | "kido-reading" | "kido-spelling" | "kido-exam" | "kido-wordsearch";
type Tier = "free" | "premium" | "pro";

interface RouteConfig {
  countField:  keyof UserMetadata;
  resetField:  keyof UserMetadata;
  period:      "day" | "month";
  limits:      Record<Tier, number>;   // -1 = unlimited
}

// ─── limits per route per tier ───────────────────────────────
const CONFIGS: Record<RouteId, RouteConfig> = {
  "ai-coach": {
    countField: "aiChatCount",
    resetField:  "aiChatResetDate",
    period:      "day",
    limits:      { free: 5, premium: 30, pro: -1 },
  },
  "kido-chat": {
    countField: "kidoChatCount",
    resetField:  "kidoChatResetDate",
    period:      "day",
    limits:      { free: 10, premium: 50, pro: -1 },
  },
  "generate-plan": {
    countField: "planGenCount",
    resetField:  "planGenResetDate",
    period:      "month",
    limits:      { free: 1, premium: 5, pro: -1 },
  },
  "kido-recommendation": {
    countField: "kidoRecCount",
    resetField:  "kidoRecResetDate",
    period:      "day",
    limits:      { free: 3, premium: 10, pro: -1 },
  },
  "kido-story": {
    countField: "kidoStoryCount",
    resetField:  "kidoStoryResetDate",
    period:      "day",
    limits:      { free: 3, premium: 20, pro: -1 },
  },
  "kido-eq": {
    countField: "kidoEqCount",
    resetField:  "kidoEqResetDate",
    period:      "day",
    limits:      { free: 5, premium: 30, pro: -1 },
  },
  "kido-homework": {
    countField: "kidoHomeworkCount",
    resetField:  "kidoHomeworkResetDate",
    period:      "day",
    limits:      { free: 10, premium: 50, pro: -1 },
  },
  "kido-creative": {
    countField: "kidoCreativeCount",
    resetField:  "kidoCreativeResetDate",
    period:      "day",
    limits:      { free: 5, premium: 20, pro: -1 },
  },
  "kido-reading": {
    countField: "kidoReadingCount",
    resetField:  "kidoReadingResetDate",
    period:      "day",
    limits:      { free: 5, premium: 30, pro: -1 },
  },
  "kido-spelling": {
    countField: "kidoSpellingCount",
    resetField:  "kidoSpellingResetDate",
    period:      "day",
    limits:      { free: 5, premium: 30, pro: -1 },
  },
  "kido-exam": {
    countField: "kidoExamCount",
    resetField:  "kidoExamResetDate",
    period:      "day",
    limits:      { free: 3, premium: 20, pro: -1 },
  },
  "kido-wordsearch": {
    countField: "kidoWordSearchCount",
    resetField:  "kidoWordSearchResetDate",
    period:      "day",
    limits:      { free: 5, premium: 30, pro: -1 },
  },
};

function periodKey(period: "day" | "month"): string {
  const now = new Date();
  return period === "day"
    ? now.toISOString().slice(0, 10)   // "2026-06-12"
    : now.toISOString().slice(0, 7);   // "2026-06"
}

export type GuardOk  = { ok: true;  userId: string; tier: Tier };
export type GuardErr = { ok: false; status: 401 | 429; message: string; messageEn: string };
export type GuardResult = GuardOk | GuardErr;

// ─── main guard ───────────────────────────────────────────────
export async function aiGuard(routeId: RouteId): Promise<GuardResult> {
  // 1. Auth
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, message: "Unauthorized", messageEn: "Unauthorized" };

  const meta   = (user.unsafeMetadata ?? {}) as UserMetadata;
  const rawTier: Tier = (meta.subscriptionTier as Tier) ?? "free";
  const subStatus     = meta.subscriptionStatus;

  // If paid tier but subscription is no longer active → treat as free
  const isPaidActive = subStatus === "active" || subStatus === "trialing";
  const tier: Tier   = (rawTier !== "free" && isPaidActive) ? rawTier : "free";

  const cfg   = CONFIGS[routeId];
  const limit = cfg.limits[tier];

  // 2. Unlimited → skip counting
  if (limit === -1) return { ok: true, userId: user.id, tier };

  // 3. Rate limit check
  const key          = periodKey(cfg.period);
  const storedReset  = (meta[cfg.resetField] as string | undefined) ?? "";
  const storedCount  = (meta[cfg.countField] as number | undefined) ?? 0;
  const count        = storedReset === key ? storedCount : 0;   // reset if new period

  if (count >= limit) {
    const unit   = cfg.period === "day" ? "วันนี้" : "เดือนนี้";
    const upgrade = tier === "free" ? " อัปเกรดเพื่อใช้งานเพิ่มเติม" : "";
    return {
      ok:        false,
      status:    429,
      message:   `ใช้ครบ ${limit} ครั้งสำหรับ${unit}แล้ว${upgrade}`,
      messageEn: `Rate limit reached: ${limit}/${cfg.period}`,
    };
  }

  // 4. Increment (fire-and-forget — don't block the AI call)
  clerkClient().then((client) =>
    client.users.updateUser(user.id, {
      unsafeMetadata: {
        ...meta,
        [cfg.countField]: count + 1,
        [cfg.resetField]: key,
      },
    })
  ).catch(() => { /* non-fatal */ });

  return { ok: true, userId: user.id, tier };
}

// Helper — converts GuardErr to a Response
export function guardErrorResponse(err: GuardErr): Response {
  return Response.json({ error: err.message }, { status: err.status });
}
