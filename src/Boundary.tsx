/** Static neon beaker ring — visual only.
 *  Physics boundary is enforced manually in Atoms.tsx via useFrame.
 */
export const BOUNDARY_RADIUS = 4.5;

export function Boundary() {
  return (
    <>
      {/* Primary neon ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BOUNDARY_RADIUS, 0.55, 8, 128]} />
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
