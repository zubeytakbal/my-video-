import { useCallback, useRef } from "react";

export type CollisionType =
  | "atom-wall"
  | "atom-atom"
  | "bond-formed"
  | "bond-broken";

export function useAudioVisualSync() {
  const lastClink = useRef(0);

  /**
   * playClink — called on every collision.
   * Replace console.log with real audio (Remotion <Audio />, Tone.js, etc.)
   */
  const playClink = useCallback(
    (velocity: number, type: CollisionType = "atom-wall") => {
      const now = Date.now();
      if (now - lastClink.current < 80) return; // debounce
      lastClink.current = now;
      console.log(`[ASMR] ${type} — impact ${velocity.toFixed(2)}`);
    },
    []
  );

  const playBondFormed = useCallback(() => {
    console.log("[ASMR] \u2728 H\u2082O bond formed");
  }, []);

  const playBondBroken = useCallback(() => {
    console.log("[ASMR] \uD83D\uDCA5 Bond broken — atoms released");
  }, []);

  return { playClink, playBondFormed, playBondBroken };
}
