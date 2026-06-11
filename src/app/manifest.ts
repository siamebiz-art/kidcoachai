import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KidCoach AI - ผู้ช่วยพัฒนาการเด็ก",
    short_name: "KidCoach AI",
    description: "AI Coach ส่วนตัวสำหรับพัฒนาการเด็ก ช่วยผู้ปกครองฝึกเด็กที่บ้านได้ทุกวัน",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8B5CF6",
    orientation: "portrait-primary",
    lang: "th",
    categories: ["education", "health"],
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "AI Coach", url: "/dashboard/ai-coach", description: "ถาม AI Coach ได้ทันที" },
      { name: "แผนการฝึกวันนี้", url: "/dashboard/plan", description: "ดูแผนการฝึกประจำวัน" },
    ],
  };
}
