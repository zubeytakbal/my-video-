import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Boundary } from "./Boundary";
import { AtomsScene } from "./Atoms";

function Lights() {
  return (
    <>
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 4, 6]} intensity={0.9} color="#ffffff" />
      <pointLight position={[-4, -3, 3]} intensity={0.5} color="#003399" />
      <pointLight position={[4, 3, 3]} intensity={0.4} color="#990011" />
    </>
  );
}

export function Scene() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#000000" }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Lights />
        <Suspense fallback={null}>
          <Physics
            gravity={[0, 0, 0]}
            defaultContactMaterial={{ restitution: 0.95, friction: 0 }}
          >
            <Boundary />
            <AtomsScene />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
