"use client";

import { KidoAvatar, type KidoEmotion } from "./kido-avatar";

interface Props {
  emotion: KidoEmotion;
  message: string;
}

export function KidoGameOverlay({ emotion, message }: Props) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2 pointer-events-none">
      <KidoAvatar emotion={emotion} size={72} />
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
