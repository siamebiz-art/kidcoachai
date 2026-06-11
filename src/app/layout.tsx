import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { PWAInstallPrompt } from "@/components/pwa-install";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "KidCoach AI - ผู้ช่วย AI พัฒนาการเด็ก",
  description:
    "แพลตฟอร์ม AI ช่วยผู้ปกครองพัฒนาศักยภาพเด็ก เด็กพูดช้า เด็กพัฒนาการช้า เด็กออทิสติก ด้วย AI Coach ส่วนตัว",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KidCoach AI",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
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
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="KidCoach AI" />
          <link rel="icon" href="/favicon.ico?v=4" />
          <link rel="shortcut icon" href="/favicon.ico?v=4" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body className="min-h-full flex flex-col font-sans">
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <PWAInstallPrompt />
          <script dangerouslySetInnerHTML={{
            __html: `
              window.__pwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaPrompt = e;
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `
          }} />
        </body>
      </html>
    </ClerkProvider>
  );
}
