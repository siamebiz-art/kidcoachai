import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt") ?? "cute children book illustration";

  // Keep prompt clean and within DALL-E's content policy
  const safePrompt = `${prompt.slice(0, 800)}, children's book style, colorful, safe for kids, no text, no letters`;

  try {
    const response = await client.images.generate({
      model:   "dall-e-2",
      prompt:  safePrompt,
      size:    "512x512",
      n:       1,
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return new Response("No image", { status: 502 });

    // Fetch the actual image bytes and proxy them
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return new Response("Image fetch failed", { status: 502 });

    const buffer = await imgRes.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("DALL-E error:", err);
    return new Response("Image generation failed", { status: 500 });
  }
}
