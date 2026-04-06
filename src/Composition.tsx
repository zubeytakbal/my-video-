import { AbsoluteFill } from "remotion";
import { Scene } from "./Scene";

/**
 * H2OSynthesis — 9:16 ASMR physics composition.
 * 1080 x 1920 @ 30 fps, 30 s (900 frames).
 */
export function H2OSynthesis() {
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {/* 3-D physics scene fills the full frame */}
      <Scene />

      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 72,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        <span
          style={{
            color: "#00ccff",
            fontSize: 24,
            letterSpacing: 5,
            textTransform: "uppercase",
            textShadow: "0 0 18px #00aaff, 0 0 40px #0055cc",
          }}
        >
          The Chemistry of Chaos
        </span>
        <span
          style={{
            color: "#ffffff",
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: 10,
            lineHeight: 1,
            textShadow: "0 0 40px #ffffff, 0 0 80px #aaddff, 0 0 120px #6699ff",
          }}
        >
          H&#8322;O
        </span>
        <span
          style={{
            color: "#555555",
            fontSize: 13,
            letterSpacing: 7,
            textTransform: "uppercase",
          }}
        >
          Synthesis
        </span>
      </div>

      {/* Atom legend */}
      <div
        style={{
          position: "absolute",
          bottom: 88,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 48,
          pointerEvents: "none",
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        <span
          style={{
            color: "#ff4444",
            fontSize: 13,
            letterSpacing: 3,
            textShadow: "0 0 14px #ff0000",
          }}
        >
          &#9679; O &nbsp; Oxygen
        </span>
        <span
          style={{
            color: "#aaddff",
            fontSize: 13,
            letterSpacing: 3,
            textShadow: "0 0 14px #88bbff",
          }}
        >
          &#9679; H &nbsp; Hydrogen
        </span>
      </div>
    </AbsoluteFill>
  );
}
