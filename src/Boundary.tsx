import React, { useRef } from "react";
import { useCylinder } from "@react-three/cannon";
import type { CylinderProps } from "@react-three/cannon";
import * as THREE from "three";

// Radius of the circular beaker boundary
export const BOUNDARY_RADIUS = 4.5;
const BOUNDARY_THICKNESS = 0.15;
const BOUNDARY_HEIGHT = 2;
const SEGMENT_COUNT = 64;

interface BoundaryProps {
  onCollide?: (velocity: number) => void;
}

/**
 * Static invisible physics ring + neon-glowing torus visual.
 * The physics shape is approximated by many thin cylinder segments
 * arranged in a circle, since @react-three/cannon doesn't have a
 * native hollow-cylinder shape.
 */
export const Boundary: React.FC<BoundaryProps> = ({ onCollide }) => {
  // We use a single large hollow ring approximated by a thin-walled cylinder.
  // cannon.js supports trimesh but it is expensive; we use a cylinder with
  // very large radius and small thickness instead via a custom approach:
  // place many box segments around the ring.
  const segmentAngle = (2 * Math.PI) / SEGMENT_COUNT;
  const segmentWidth = 2 * BOUNDARY_RADIUS * Math.sin(segmentAngle / 2);

  return (
    <>
      {/* Physics segments */}
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const angle = i * segmentAngle;
        const x = BOUNDARY_RADIUS * Math.cos(angle);
        const z = BOUNDARY_RADIUS * Math.sin(angle);
        return (
          <BoundarySegment
            key={i}
            position={[x, 0, z]}
            rotation={[0, -angle, 0]}
            width={segmentWidth + 0.05}
            height={BOUNDARY_HEIGHT}
            depth={BOUNDARY_THICKNESS}
            onCollide={onCollide}
          />
        );
      })}

      {/* Visual: neon-glowing torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[BOUNDARY_RADIUS, BOUNDARY_THICKNESS * 1.2, 16, 128]}
        />
        <meshStandardMaterial
          color="#00aaff"
          emissive="#00aaff"
          emissiveIntensity={3}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Second outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[BOUNDARY_RADIUS, BOUNDARY_THICKNESS * 2.8, 8, 128]}
        />
        <meshStandardMaterial
          color="#004488"
          emissive="#0066cc"
          emissiveIntensity={1.5}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
};

// ─── Individual wall segment ───────────────────────────────────────────────────

interface SegmentProps {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  depth: number;
  onCollide?: (velocity: number) => void;
}

const BoundarySegment: React.FC<SegmentProps> = ({
  position,
  rotation,
  width,
  height,
  depth,
  onCollide,
}) => {
  const args: CylinderProps["args"] = undefined;
  const [ref] = useCylinder(
    () => ({
      type: "Static",
      position,
      rotation,
      args: [depth / 2, depth / 2, height, 4] as [
        number,
        number,
        number,
        number
      ],
      onCollide: (e) => {
        const vel = e.contact.impactVelocity;
        if (vel > 0.5 && onCollide) {
          onCollide(vel);
        }
      },
    }),
    useRef<THREE.Mesh>(null)
  );

  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>} position={position} rotation={rotation}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial visible={false} />
    </mesh>
  );
};
