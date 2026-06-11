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

  const speak = useCallback((text: string, em: KidoEmotion = "talking") => {
    setEmotion(em);
    setMessage(text);
    if (typeof window === "undefined") return;
    const syn = window.speechSynthesis;
    if (!syn) return;
    syn.cancel();
    const clean = text.replace(/[^฀-๿ -~]/g, "").trim() || text;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "th-TH";
    utt.rate = 0.88;
    utt.pitch = 1.15;
    utt.onend = () => setEmotion("idle");
    syn.speak(utt);
  }, []);

  const praise = useCallback(() => {
    speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], "celebrating");
  }, [speak]);

  const encourage = useCallback(() => {
    speak(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], "thinking");
  }, [speak]);

  useEffect(() => () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);

  return { emotion, message, speak, praise, encourage };
}
