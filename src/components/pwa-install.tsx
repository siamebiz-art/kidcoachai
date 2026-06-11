"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Check if banner was dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after 3s
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
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
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 flex items-start gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <span className="text-2xl">💜</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">ติดตั้ง KidCoach AI</p>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              กด{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
                Share
              </span>{" "}
              แล้วเลือก <strong>&quot;Add to Home Screen&quot;</strong>
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              ติดตั้งบนอุปกรณ์ เข้าใช้ได้เหมือนแอปทั่วไป ไม่ต้องผ่านเบราว์เซอร์
            </p>
          )}

          {!isIOS && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="mt-2 h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              ติดตั้งเลย
            </Button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* iOS Arrow hint */}
      {isIOS && (
        <div className="flex justify-center mt-2">
          <div className="bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            กดปุ่ม Share ที่ toolbar ด้านล่าง
          </div>
        </div>
      )}
    </div>
  );
}
