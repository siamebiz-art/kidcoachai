import { useState, useCallback } from "react";

export function useCorrectEffect() {
  const [effectKey, setEffectKey] = useState(0);
  const trigger = useCallback(() => setEffectKey((k) => k + 1), []);
  return { effectKey, trigger };
}
