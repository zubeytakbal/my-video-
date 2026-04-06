import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Scene } from "./Scene";

/**
 * H2O Synthesis Composition
 *
 * 9:16 aspect ratio (1080×1920) — optimised for YouTube Shorts, Instagram Reels
 * Duration: 30 seconds @ 30 fps
 */
export const H2OSynthesis: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
          pointerEvents: "none",
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#00ccff",
            textShadow: "0 0 20px #00aaff, 0 0 40px #0066ff",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          The Chemistry of Chaos
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "0 0 30px #ffffff, 0 0 60px #aaddff",
            letterSpacing: 6,
            marginTop: 4,
          }}
        >
          H₂O
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#888888",
            letterSpacing: 4,
            marginTop: 8,
            textTransform: "uppercase",
          }}
        >
          Synthesis
        </div>
      </div>

      {/* 3-D Physics Scene */}
      <Scene />

      {/* Bottom legend */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          pointerEvents: "none",
          fontFamily: "'Courier New', monospace",
        }}
      >
        <LegendItem color="#ff4444" glow="#ff0000" label="O  Oxygen" />
        <LegendItem color="#aaddff" glow="#88bbff" label="H  Hydrogen" />
        <LegendItem color="#00aaff" glow="#0066ff" label="⬤  Beaker" />
      </div>
    </AbsoluteFill>
  );
};

interface LegendItemProps {
  color: string;
  glow: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, glow, label }) => (
  <div
    style={{
      color,
      textShadow: `0 0 12px ${glow}`,
      fontSize: 14,
      letterSpacing: 2,
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);
