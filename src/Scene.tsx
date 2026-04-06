import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Boundary } from "./Boundary";
import { AtomsScene } from "./Atoms";
import { useAudioVisualSync } from "./useAudioVisualSync";

// ─── Scene lighting ────────────────────────────────────────────────────────────
const SceneLights: React.FC = () => (
  <>
    {/* Ambient — very dim so emissive materials pop */}
    <ambientLight intensity={0.08} />
    {/* Soft point light above center */}
    <pointLight position={[0, 3, 4]} intensity={0.6} color="#ffffff" />
    {/* Colored fill lights */}
    <pointLight position={[-4, -3, 2]} intensity={0.4} color="#0033ff" />
    <pointLight position={[4, 3, 2]} intensity={0.3} color="#ff2200" />
  </>
);

// ─── Post-processing stack ─────────────────────────────────────────────────────
const PostFX: React.FC = () => (
  <EffectComposer>
    {/* Primary bloom — bright core glow */}
    <Bloom
      intensity={1.8}
      luminanceThreshold={0.2}
      luminanceSmoothing={0.6}
      mipmapBlur
      blendFunction={BlendFunction.ADD}
    />
    {/* Second wider bloom for halo effect */}
    <Bloom
      intensity={0.6}
      luminanceThreshold={0.05}
      luminanceSmoothing={0.9}
      mipmapBlur
      blendFunction={BlendFunction.ADD}
    />
  </EffectComposer>
);

// ─── Physics-aware inner scene ─────────────────────────────────────────────────
const PhysicsScene: React.FC = () => {
  const { playClink } = useAudioVisualSync();

  return (
    <Physics
      gravity={[0, 0, 0]}   // Zero gravity — pure chaos
      defaultContactMaterial={{
        friction: 0.0,
        restitution: 0.95,   // Very bouncy
      }}
      broadphase="SAP"
      allowSleep={false}
    >
      <Boundary onCollide={(v) => playClink(v, "atom-wall")} />
      <AtomsScene />
    </Physics>
  );
};

// ─── Main exported Scene ───────────────────────────────────────────────────────
/**
 * The Scene component sets up a fixed 9:16 canvas (YouTube Shorts / Reels).
 * Camera is orthographic-style perspective placed far back so the beaker
 * fills the vertical frame.
 */
export const Scene: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%", background: "#000000" }}
        camera={{
          position: [0, 0, 14],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        linear
      >
        <color attach="background" args={["#000000"]} />
        <SceneLights />
        <Suspense fallback={null}>
          <PhysicsScene />
          <PostFX />
        </Suspense>
      </Canvas>
    </div>
  );
};
