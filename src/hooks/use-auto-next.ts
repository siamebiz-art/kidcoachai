import { useEffect, useRef, useState } from "react";

export function useAutoNext(
  enabled: boolean,
  onTrigger: () => void,
  seconds = 4,
) {
  const [countdown, setCountdown] = useState(seconds);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) { setCountdown(seconds); return; }
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(timerRef.current!);
          triggerRef.current();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  }

  return { countdown, cancel, seconds };
}
