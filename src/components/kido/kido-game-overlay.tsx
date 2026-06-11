"use client";

import type { KidoEmotion } from "./kido-avatar";

const CSS = `
@keyframes kidoFloat    { 0%,100%{transform:translateY(0)}          50%{transform:translateY(-6px)} }
@keyframes kidoBob      { 0%,100%{transform:translateY(0) rotate(0deg)}  25%{transform:translateY(-3px) rotate(-3deg)} 75%{transform:translateY(-3px) rotate(3deg)} }
@keyframes kidoBounce   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.12)} }
@keyframes kidoWiggle   { 0%,100%{transform:rotate(0deg)}           25%{transform:rotate(-6deg)} 75%{transform:rotate(6deg)} }
@keyframes kidoPulse    { 0%,100%{transform:scale(1)}               50%{transform:scale(1.06)} }
`;

const ANIM: Record<KidoEmotion, string> = {
  idle:        "kidoFloat 3s ease-in-out infinite",
  talking:     "kidoBob 0.5s ease-in-out infinite",
  celebrating: "kidoBounce 0.4s ease-in-out infinite",
  thinking:    "kidoWiggle 1.5s ease-in-out infinite",
  listening:   "kidoPulse 1s ease-in-out infinite",
};

interface Props {
  emotion: KidoEmotion;
  message: string;
}

export function KidoGameOverlay({ emotion, message }: Props) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2 pointer-events-none">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kido.png"
        alt="Kido"
        width={80}
        height={80}
        style={{ animation: ANIM[emotion], objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(139,92,246,0.4))" }}
      />
      <div
        className={`relative bg-white border border-gray-100 shadow-xl rounded-2xl rounded-bl-sm px-3 py-2 max-w-[180px] mb-1 transition-all duration-300 ${
          message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <p className="text-[11px] text-gray-800 font-semibold leading-snug">{message || " "}</p>
        <div
          className="absolute -bottom-2 left-4 w-0 h-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid white",
          }}
        />
      </div>
    </div>
  );
}
