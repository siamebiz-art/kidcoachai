export function KidCoachLogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="heartBg"
          cx="38%"
          cy="28%"
          r="65%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </radialGradient>
      </defs>

      {/* Heart shape with white stroke */}
      <path
        d="M50 90 C50 90 7 63 7 34 C7 18 18 7 33 7 C41 7 47 11 50 17 C53 11 59 7 67 7 C82 7 93 18 93 34 C93 63 50 90 50 90Z"
        fill="url(#heartBg)"
        stroke="white"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Gloss bubbles top-left */}
      <circle cx="26" cy="22" r="8" fill="white" opacity="0.45" />
      <circle cx="38" cy="14" r="4.5" fill="white" opacity="0.3" />
      <circle cx="70" cy="20" r="3" fill="white" opacity="0.25" />

      {/* Pink arm/band at bottom */}
      <path
        d="M28 73 Q50 90 72 73 Q68 83 50 90 Q32 83 28 73Z"
        fill="#EC4899"
      />

      {/* Face circle */}
      <circle cx="50" cy="56" r="21" fill="white" />

      {/* Hair top */}
      <path
        d="M29 50 C29 37 37 30 50 30 C63 30 71 37 71 50 L68 50 C68 39 61 33 50 33 C39 33 32 39 32 50Z"
        fill="#1E293B"
      />
      <path d="M29 50 C29 42 32 37 35 35 L35 50Z" fill="#1E293B" />
      <path d="M71 50 C71 42 68 37 65 35 L65 50Z" fill="#1E293B" />

      {/* Yellow paper-airplane / crown tip */}
      <polygon points="58,30 71,43 62,41" fill="#FBBF24" />

      {/* Eyes */}
      <circle cx="43" cy="52" r="3.5" fill="#1E293B" />
      <circle cx="57" cy="52" r="3.5" fill="#1E293B" />
      {/* Eye shine */}
      <circle cx="44.8" cy="50.2" r="1.2" fill="white" />
      <circle cx="58.8" cy="50.2" r="1.2" fill="white" />

      {/* Pink cheeks */}
      <circle cx="37" cy="60" r="5.5" fill="#FDA4AF" opacity="0.55" />
      <circle cx="63" cy="60" r="5.5" fill="#FDA4AF" opacity="0.55" />

      {/* Smile */}
      <path
        d="M43 65 Q50 71 57 65"
        stroke="#1E293B"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KidCoachWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-0 font-black ${className}`}>
      <span className="text-[#1D4ED8]">KidCoach</span>
      <span className="text-[#EC4899]"> AI</span>
    </span>
  );
}
