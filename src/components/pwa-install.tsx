"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop" | null;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Dismissed recently (7 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isMac = /macintosh/i.test(ua) && navigator.maxTouchPoints === 0;
    const isDesktop = !isIOS && (isMac || !/android|mobile/i.test(ua));

    // Android / Desktop: wait for browser beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform(isDesktop ? "desktop" : "android");
      // Show after 8s of engagement
      setTimeout(() => setShowBanner(true), 8000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after 5s
    if (isIOS) {
      const timer = setTimeout(() => {
        setPlatform("ios");
        setShowBanner(true);
      }, 5000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShowBanner(false);
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner || !platform) return null;

  return (
    <div className="fixed bottom-safe-area-inset-bottom bottom-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-semibold">
            {platform === "ios" ? "ติดตั้งบน iPhone / iPad" : platform === "desktop" ? "ติดตั้งบนคอมพิวเตอร์" : "ติดตั้งบนมือถือ"}
          </span>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-purple-100">
            <Image src="/icons/icon-192x192.png" alt="KidCoach AI" width={48} height={48} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">KidCoach AI</p>

            {/* iOS instructions */}
            {platform === "ios" && (
              <div className="mt-1 space-y-1.5">
                <p className="text-xs text-gray-600 leading-relaxed">
                  ติดตั้งเป็นแอปบนหน้าจอหลัก ใช้งานได้เหมือนแอปทั่วไป
                </p>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <span className="bg-blue-50 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <Share className="w-3 h-3" /> กด Share
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-gray-50 rounded px-1.5 py-0.5 text-gray-700">Add to Home Screen</span>
                </div>
              </div>
            )}

            {/* Android / Desktop */}
            {(platform === "android" || platform === "desktop") && (
              <div className="mt-1">
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  {platform === "desktop"
                    ? "ติดตั้งเป็นแอปบน Desktop เข้าใช้ได้เร็วขึ้น"
                    : "ติดตั้งบนหน้าจอหลัก ใช้งานได้แม้ไม่มีสัญญาณ"}
                </p>
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  ติดตั้งเลย — ฟรี
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* iOS bottom hint arrow */}
        {platform === "ios" && (
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 text-center">
            <p className="text-[11px] text-gray-500">
              👇 กดปุ่ม <strong>Share</strong> ที่ toolbar ด้านล่างเบราว์เซอร์
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
