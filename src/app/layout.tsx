import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PWAInstallPrompt } from "@/components/pwa-install";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "KidCoach AI - ผู้ช่วย AI พัฒนาการเด็ก",
  description:
    "แพลตฟอร์ม AI ช่วยผู้ปกครองพัฒนาศักยภาพเด็ก เด็กพูดช้า เด็กพัฒนาการช้า เด็กออทิสติก ด้วย AI Coach ส่วนตัว",
  keywords: [
    "พัฒนาการเด็ก",
    "AI Coach",
    "เด็กพูดช้า",
    "เด็กออทิสติก",
    "กิจกรรมบำบัด",
    "KidCoach AI",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KidCoach AI",
    startupImage: "/icons/icon-512x512.png",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    title: "KidCoach AI - ผู้ช่วย AI พัฒนาการเด็ก",
    description:
      "AI Coach ส่วนตัวสำหรับพัฒนาการเด็ก ช่วยผู้ปกครองฝึกเด็กที่บ้านได้ทุกวัน",
    url: "https://kidcoachai.com",
    siteName: "KidCoach AI",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="th"
        className={`${geistSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">
          {children}
          <PWAInstallPrompt />
          <Script
            id="sw-register"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
