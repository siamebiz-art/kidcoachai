"use client";

import { useState, useCallback, useEffect } from "react";
import type { KidoEmotion } from "@/components/kido/kido-avatar";

const PRAISE = [
  "เก่งมากเลยนะ! 🎉",
  "ยอดเยี่ยมสุดๆ! ⭐",
  "ถูกต้องเลย! ✨",
  "เพอร์เฟกต์! 🏆",
  "เจ๋งมาก! 🎯",
];

const ENCOURAGE = [
  "ไม่เป็นไรนะ ลองใหม่ได้เลย! 💪",
  "เกือบแล้วนะ! 😊",
  "โอ๊ะ! ลองอีกครั้งนะ 🌟",
];

export function useKidoVoice() {
  const [emotion, setEmotion] = useState<KidoEmotion>("idle");
  const [message, setMessage] = useState("");

  // onEnd fires after TTS finishes (or after fallback timeout if TTS unavailable)
  const speak = useCallback((text: string, em: KidoEmotion = "talking", onEnd?: () => void) => {
    setEmotion(em);
    setMessage(text);
    if (typeof window === "undefined") { onEnd?.(); return; }
    const syn = window.speechSynthesis;
    if (!syn) {
      // fallback: estimate duration then call onEnd
      setTimeout(() => { setEmotion("idle"); onEnd?.(); }, Math.max(800, text.length * 55));
      return;
    }
    syn.cancel();
    const clean = text.replace(/[^฀-๿ -~]/g, "").trim() || text;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "th-TH";
    utt.rate = 0.88;
    utt.pitch = 1.15;
    utt.onend = () => { setEmotion("idle"); onEnd?.(); };
    utt.onerror = () => { setEmotion("idle"); onEnd?.(); };
    syn.speak(utt);
  }, []);

  // onEnd optional — lets caller wait for praise before advancing
  const praise = useCallback((onEnd?: () => void) => {
    speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], "celebrating", onEnd);
  }, [speak]);

  const encourage = useCallback((onEnd?: () => void) => {
    speak(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], "thinking", onEnd);
  }, [speak]);

  useEffect(() => () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);

  return { emotion, message, speak, praise, encourage };
}
