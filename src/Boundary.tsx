/**
 * Neon beaker ring — visual only.
 * No rotation: THREE.js Torus lies in the XY plane by default,
 * which is exactly what we want for a camera at [0,0,14].
 */
export const BOUNDARY_RADIUS = 4.5;

export function Boundary() {
  return (
    <>
      {/* Primary neon ring */}
      <mesh>
        <torusGeometry args={[BOUNDARY_RADIUS, 0.15, 16, 128]} />
        <meshStandardMaterial
          color="#00aaff"
          emissive="#00aaff"
          emissiveIntensity={3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer glow halo */}
      <mesh>
        <torusGeometry args={[BOUNDARY_RADIUS, 0.5, 8, 128]} />
        <meshStandardMaterial
          color="#003366"
          emissive="#0055bb"
          emissiveIntensity={1.5}
          transparent
          opacity={0.18}
        />
      </mesh>
    </>
  );
}
