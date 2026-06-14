import { NextRequest } from "next/server";

export const runtime = "nodejs";
// Cache each unique prompt+seed for 1 hour on Vercel Edge Cache
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt") ?? "cute children book illustration";
  const seed   = searchParams.get("seed")   ?? "1";

  // Build Pollinations URL — use default model (flux), keep prompt short
  const shortened = prompt.slice(0, 400);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortened)}?width=768&height=512&seed=${seed}&nologo=true`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "KidCoachAI/1.0" },
      // Pollinations can take up to 30s on cold start
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      return new Response("Image fetch failed", { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Image timeout", { status: 504 });
  }
}
