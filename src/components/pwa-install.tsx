"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

declare global {
  interface Window {
    __pwaPrompt: InstallEvent | null;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already dismissed recently (7 days)
    const lastDismissed = localStorage.getItem("pwa-dismiss");
    if (lastDismissed && Date.now() - Number(lastDismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    if (ios) {
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    // Check if event was already captured before React mounted
    function tryShow(e: InstallEvent) {
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    }

    if (window.__pwaPrompt) {
      tryShow(window.__pwaPrompt);
      return;
    }

    // Also listen for future fires (first visit / after SW update)
    const handler = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as InstallEvent;
      tryShow(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-dismiss", String(Date.now()));
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  }

  if (!show || dismissed) return null;

  return (
    <>
      <div onClick={dismiss} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[min(380px,calc(100vw-32px))] z-[9999] animate-in slide-in-from-bottom-6 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              🧠
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">KidCoach AI</p>
              <p className="text-white/80 text-xs mt-0.5 leading-relaxed">
                เปิดได้เร็วกว่าจาก Home Screen ใช้งานได้ทุกวัน
              </p>
            </div>
            <button onClick={dismiss} className="text-white/60 hover:text-white shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>

          {/* Badges */}
          <div className="flex gap-2 px-5 pt-4 flex-wrap">
            {["เปิดเร็ว", "เหมือนแอป", "ฟรี 100%"].map((f) => (
              <span key={f} className="bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>

          <div className="px-5 pb-5 pt-3">
            {isIOS ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">
                  วิธีติดตั้งบน iPhone / iPad
                </p>
                {[
                  { icon: <Share size={13} className="text-purple-600" />, text: 'กดปุ่ม Share (กล่องมีลูกศรขึ้น) ใน Safari' },
                  { icon: <Plus size={13} className="text-purple-600" />, text: 'เลือก "Add to Home Screen"' },
                  { icon: <span className="text-purple-600 text-sm">✓</span>, text: 'กด "Add" เพื่อยืนยัน' },
                ].map((s, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${i < 2 ? "mb-2.5" : ""}`}>
                    <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      {s.icon}
                    </div>
                    <span className="text-xs text-gray-700 leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={install}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mb-2.5 shadow-lg shadow-purple-200"
              >
                <Download size={15} />
                ติดตั้งแอป — ฟรี
              </button>
            )}

            <button
              onClick={dismiss}
              className="w-full py-2.5 text-gray-400 text-xs border border-gray-100 rounded-xl hover:bg-gray-50"
            >
              ไม่ใช่ตอนนี้
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
