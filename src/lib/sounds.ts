/**
 * Kido Sound FX — สร้างเสียงด้วย Web Audio API ไม่ต้องมีไฟล์เสียง
 * ทำงานออฟไลน์ได้, ไม่มี CSP issue, ไม่มี loading delay
 *
 * iOS note: AudioContext ต้องการ user gesture ก่อน
 * แต่เนื่องจากเรียกจาก click handler เสมอ จึงไม่มีปัญหา
 */

export type SoundName =
  | "tap"       // แตะปุ่ม — pop เบาๆ
  | "correct"   // ตอบถูก — arpeggio ขึ้น
  | "wrong"     // ตอบผิด — เสียงลงนุ่มๆ
  | "celebrate" // จบเกมดี — fanfare
  | "levelUp";  // เลื่อนระดับ — glissando พิเศษ

// ── Singleton AudioContext ────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx || _ctx.state === "closed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      _ctx = new AC();
    }
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

// ── Tone helper ───────────────────────────────────────────────────────────────
function tone(
  ac: AudioContext,
  freq: number,       // Hz ตั้งต้น
  startTime: number,  // ac.currentTime offset
  duration: number,   // วินาที
  type: OscillatorType = "sine",
  gainValue = 0.18,
  freqEnd?: number    // ถ้าระบุจะค่อยๆ slide ไป
) {
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined && freqEnd > 0) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  }

  gain.gain.setValueAtTime(gainValue, startTime);
  // Fade out เพื่อไม่ให้มีเสียง click ตอนหยุด
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function playSound(name: SoundName) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;

  switch (name) {
    // ── กดปุ่ม: pop สั้นมาก ──────────────────────────────────────────────────
    case "tap":
      tone(ac, 700, t, 0.045, "sine", 0.10, 450);
      break;

    // ── ตอบถูก: C5→E5→G5 สดใส ────────────────────────────────────────────────
    case "correct":
      tone(ac, 523.25, t,        0.13, "sine", 0.20);
      tone(ac, 659.25, t + 0.11, 0.13, "sine", 0.20);
      tone(ac, 783.99, t + 0.22, 0.20, "sine", 0.24);
      break;

    // ── ตอบผิด: เสียงลงนุ่มๆ ไม่น่ากลัว ────────────────────────────────────────
    case "wrong":
      tone(ac, 320, t, 0.28, "triangle", 0.14, 160);
      break;

    // ── จบเกมดี: G4→C5→E5→G5 + sparkle ─────────────────────────────────────
    case "celebrate":
      tone(ac, 392.00, t,        0.10, "sine", 0.18);
      tone(ac, 523.25, t + 0.09, 0.10, "sine", 0.19);
      tone(ac, 659.25, t + 0.18, 0.10, "sine", 0.20);
      tone(ac, 783.99, t + 0.27, 0.30, "sine", 0.22);
      // Harmony + sparkle
      tone(ac, 523.25, t + 0.27, 0.30, "sine", 0.11);
      tone(ac,1046.50, t + 0.30, 0.20, "sine", 0.08);
      break;

    // ── เลื่อนระดับ: C5→E5→G5→C6 glissando ─────────────────────────────────
    case "levelUp":
      tone(ac, 523.25, t,        0.13, "sine", 0.18);
      tone(ac, 659.25, t + 0.12, 0.13, "sine", 0.19);
      tone(ac, 783.99, t + 0.24, 0.13, "sine", 0.20);
      tone(ac,1046.50, t + 0.36, 0.35, "sine", 0.24);
      // Harmony ที่ note สุดท้าย
      tone(ac, 783.99, t + 0.36, 0.35, "sine", 0.12);
      break;
  }
}
