import { Canvas } from "@react-three/fiber";
import { Boundary } from "./Boundary";
import { AtomsScene } from "./Atoms";

function Lights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 4, 6]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-4, -3, 3]} intensity={0.6} color="#003399" />
      <pointLight position={[4, 3, 3]} intensity={0.5} color="#990011" />
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
        <Boundary />
        <AtomsScene />
      </Canvas>
    </div>
  );
}
