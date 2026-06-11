"use client";

export type KidoEmotion = "idle" | "talking" | "listening" | "celebrating" | "thinking";

const CSS = `
@keyframes kidoFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes kidoTalk     { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-4px) rotate(1.5deg)} }
@keyframes kidoBounce   { 0%,100%{transform:translateY(0) rotate(0)} 25%{transform:translateY(-18px) rotate(-6deg)} 75%{transform:translateY(-14px) rotate(6deg)} }
@keyframes kidoListen   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
@keyframes kidoThink    { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-6px) rotate(2deg)} }
@keyframes antennaPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
@keyframes soundBar     { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
`;

const MOUTH: Record<KidoEmotion, string> = {
  idle:        "M34 65 Q50 78 66 65",
  talking:     "M32 63 Q50 82 68 63",
  listening:   "M37 67 Q50 74 63 67",
  celebrating: "M28 62 Q50 88 72 62",
  thinking:    "M36 69 Q43 65 50 69 Q57 73 64 69",
};

const ARM_L: Record<KidoEmotion, string> = {
  idle:        "rotate(12 16 84)",
  talking:     "rotate(-5 16 84)",
  listening:   "rotate(20 16 84)",
  celebrating: "rotate(-45 16 84)",
  thinking:    "rotate(30 16 84)",
};

const ARM_R: Record<KidoEmotion, string> = {
  idle:        "rotate(-12 84 84)",
  talking:     "rotate(5 84 84)",
  listening:   "rotate(-20 84 84)",
  celebrating: "rotate(45 84 84)",
  thinking:    "rotate(-30 84 84)",
};

const ANIM_CLASS: Record<KidoEmotion, string> = {
  idle:        "kidoFloat 3.5s ease-in-out infinite",
  talking:     "kidoTalk 0.4s ease-in-out infinite",
  listening:   "kidoListen 1.2s ease-in-out infinite",
  celebrating: "kidoBounce 0.55s ease-in-out infinite",
  thinking:    "kidoThink 2.5s ease-in-out infinite",
};

const ANTENNA_COLOR: Record<KidoEmotion, string> = {
  idle:        "#A78BFA",
  talking:     "#60A5FA",
  listening:   "#34D399",
  celebrating: "#FBBF24",
  thinking:    "#F472B6",
};

interface Props {
  emotion?: KidoEmotion;
  size?: number;
  className?: string;
}

export function KidoAvatar({ emotion = "idle", size = 180, className = "" }: Props) {
  const eyeY = emotion === "thinking" ? 38 : 42;
  const pupilDY = emotion === "thinking" ? -3 : 0;
  const pupilDX = emotion === "listening" ? 1.5 : 0;
  const mouthStroke = emotion === "celebrating" ? "#EC4899" : "#1E293B";
  const mouthWidth = emotion === "celebrating" ? "3" : "2.5";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className={`relative inline-block select-none ${className}`}
        style={{ animation: ANIM_CLASS[emotion] }}
      >
        <svg
          width={size}
          height={Math.round(size * 1.3)}
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="kido-hg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id="kido-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
            <linearGradient id="kido-screen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DBEAFE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
            <filter id="kido-drop">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Ground shadow */}
          <ellipse cx="50" cy="128" rx="20" ry="3.5" fill="#4338CA" opacity="0.12" />

          {/* Antenna pole */}
          <line x1="50" y1="6" x2="50" y2="16" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />

          {/* Antenna orb */}
          <circle
            cx="50" cy="5" r="4.5"
            fill={ANTENNA_COLOR[emotion]}
            style={{ animation: emotion !== "idle" ? "antennaPulse 1s ease-in-out infinite" : undefined }}
          />

          {/* Head */}
          <rect x="14" y="15" width="72" height="56" rx="22" fill="url(#kido-hg)" filter="url(#kido-drop)" />

          {/* Ear nubs */}
          <circle cx="14" cy={eyeY + 5} r="5.5" fill="#4338CA" />
          <circle cx="86" cy={eyeY + 5} r="5.5" fill="#4338CA" />

          {/* Left eye */}
          <circle cx="33" cy={eyeY} r="12" fill="white" />
          <circle cx={33 + pupilDX} cy={eyeY + pupilDY} r="7" fill="#1E293B" />
          <circle cx={35 + pupilDX} cy={eyeY - 2.5 + pupilDY} r="2.5" fill="white" />

          {/* Right eye */}
          <circle cx="67" cy={eyeY} r="12" fill="white" />
          <circle cx={67 + pupilDX} cy={eyeY + pupilDY} r="7" fill="#1E293B" />
          <circle cx={69 + pupilDX} cy={eyeY - 2.5 + pupilDY} r="2.5" fill="white" />

          {/* Cheeks */}
          <ellipse cx="20" cy={eyeY + 14} rx="9" ry="7" fill="#FDA4AF" opacity="0.4" />
          <ellipse cx="80" cy={eyeY + 14} rx="9" ry="7" fill="#FDA4AF" opacity="0.4" />

          {/* Mouth */}
          <path d={MOUTH[emotion]} stroke={mouthStroke} strokeWidth={mouthWidth} strokeLinecap="round" fill="none" />
          {emotion === "talking" && (
            <ellipse cx="50" cy="71" rx="9" ry="6" fill="#FCA5A5" opacity="0.55" />
          )}

          {/* Body */}
          <rect x="24" y="74" width="52" height="40" rx="15" fill="url(#kido-bg)" filter="url(#kido-drop)" />

          {/* Tummy screen */}
          <rect x="33" y="83" width="34" height="23" rx="7" fill="url(#kido-screen)" />

          {/* Screen content by state */}
          {emotion === "idle" && (
            <path d="M47 95 L50 91 L53 95 Q56 91.5 56 88.5 Q56 85 53 85 Q51 85 50 87 Q49 85 47 85 Q44 85 44 88.5 Q44 91.5 47 95Z"
              fill="#F43F5E" opacity="0.7" />
          )}
          {emotion === "talking" && (
            <>
              {[0, 1, 2].map(i => (
                <rect
                  key={i}
                  x={38 + i * 8} y={87} width="4" height={6 + (i === 1 ? 4 : 0)} rx="2"
                  fill="#3B82F6" opacity="0.75"
                  style={{ animation: `soundBar 0.6s ease-in-out ${i * 0.12}s infinite` }}
                />
              ))}
            </>
          )}
          {emotion === "listening" && (
            <>
              {[0, 1, 2, 3].map(i => (
                <rect
                  key={i}
                  x={36 + i * 7} y={89} width="4" height={4 + i * 2} rx="2"
                  fill="#10B981" opacity="0.8"
                  style={{ animation: `soundBar 0.5s ease-in-out ${i * 0.1}s infinite` }}
                />
              ))}
            </>
          )}
          {emotion === "celebrating" && (
            <text x="50" y="99" textAnchor="middle" fontSize="12" fill="#F59E0B">★</text>
          )}
          {emotion === "thinking" && (
            <>{[0, 1, 2].map(i => (
              <circle key={i} cx={39 + i * 8} cy="94" r={2.5 - i * 0.3}
                fill="#6366F1" opacity={0.35 + i * 0.25}
                style={{ animation: `antennaPulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
              />
            ))}</>
          )}

          {/* Left arm */}
          <rect x="7" y="77" width="17" height="11" rx="5.5"
            fill="url(#kido-bg)" transform={ARM_L[emotion]} />

          {/* Right arm */}
          <rect x="76" y="77" width="17" height="11" rx="5.5"
            fill="url(#kido-bg)" transform={ARM_R[emotion]} />

          {/* Legs */}
          <rect x="30" y="112" width="15" height="14" rx="6" fill="#5B21B6" />
          <rect x="55" y="112" width="15" height="14" rx="6" fill="#5B21B6" />

          {/* Feet */}
          <rect x="26" y="121" width="22" height="8" rx="4" fill="#4C1D95" />
          <rect x="52" y="121" width="22" height="8" rx="4" fill="#4C1D95" />
        </svg>

        {/* Sparkles when celebrating */}
        {emotion === "celebrating" && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute top-0 right-0 text-xl animate-bounce">⭐</span>
            <span className="absolute top-4 left-0 text-lg animate-bounce" style={{ animationDelay: "120ms" }}>✨</span>
            <span className="absolute top-1 left-1/2 text-base animate-bounce" style={{ animationDelay: "240ms" }}>🎊</span>
          </div>
        )}

        {/* Listening waveform beside character */}
        {emotion === "listening" && (
          <div className="absolute -right-4 top-1/3 flex flex-col-reverse gap-0.5">
            {[3, 5, 8, 6, 4].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-emerald-400"
                style={{ height: h * 2, animation: `soundBar 0.5s ease-in-out ${i * 80}ms infinite` }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
