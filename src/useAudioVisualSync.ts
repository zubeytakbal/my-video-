import { useCallback, useRef } from "react";

/**
 * Hook for audio-visual sync events.
 * Currently logs to console and calls placeholder functions.
 * Wire up real audio playback here when audio assets are available.
 */
export type CollisionType = "atom-wall" | "atom-atom" | "bond-formed" | "bond-broken";

export interface CollisionEvent {
  type: CollisionType;
  velocity: number;
  timestamp: number;
}

export function useAudioVisualSync() {
  const lastClink = useRef<number>(0);
  const DEBOUNCE_MS = 80; // prevent rapid-fire sounds

  const playClink = useCallback((velocity: number, type: CollisionType = "atom-wall") => {
    const now = Date.now();
    if (now - lastClink.current < DEBOUNCE_MS) return;
    lastClink.current = now;

    const event: CollisionEvent = { type, velocity, timestamp: now };

    // Placeholder: log event — replace with Remotion audio / Tone.js call
    console.log("[ASMR Sync] Collision event:", event);

    // TODO: integrate with Remotion's <Audio> or an external synth:
    // playAudioCue(type, velocity);
  }, []);

  const playBondFormed = useCallback(() => {
    console.log("[ASMR Sync] Bond formed — H2O molecule created ✨");
    // TODO: play a soft chime
  }, []);

  const playBondBroken = useCallback(() => {
    console.log("[ASMR Sync] Bond broken — atoms released 💥");
    // TODO: play a crack/pop sound
  }, []);

  return { playClink, playBondFormed, playBondBroken };
}
