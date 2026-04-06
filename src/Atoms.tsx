import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PublicApi } from "@react-three/cannon";
import { BOUNDARY_RADIUS } from "./Boundary";
import { useAudioVisualSync } from "./useAudioVisualSync";

// ─── Constants ─────────────────────────────────────────────────────────────────
const O_RADIUS = 0.6;
const H_RADIUS = 0.3;
const O_MASS = 4;
const H_MASS = 1;

// Bonding threshold: when both H atoms are within this distance from O
const BOND_THRESHOLD = 1.8;
// Bond arm length (O–H bond ≈ 0.96 Å, scaled)
const BOND_LENGTH = O_RADIUS + H_RADIUS + 0.15;
// H–O–H angle = 104.5°
const BOND_HALF_ANGLE = (104.5 * Math.PI) / 180 / 2;
// Velocity magnitude to break bond on hard wall hit
const BREAK_VELOCITY = 6;

function randomVelocity(scale: number): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  return [
    Math.cos(angle) * scale * (0.6 + Math.random() * 0.8),
    Math.sin(angle) * scale * (0.6 + Math.random() * 0.8),
    0,
  ];
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AtomState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

// ─── Oxygen Atom ───────────────────────────────────────────────────────────────
interface OxygenProps {
  apiRef: React.MutableRefObject<PublicApi | null>;
  meshRef: React.RefObject<THREE.Mesh>;
  onCollide: (v: number) => void;
}

export const OxygenAtom: React.FC<OxygenProps> = ({ apiRef, meshRef, onCollide }) => {
  const [ref, api] = useSphere(
    () => ({
      mass: O_MASS,
      position: [0, 0, 0],
      args: [O_RADIUS],
      linearDamping: 0.05,
      angularDamping: 1,
      onCollide: (e) => {
        const v = e.contact.impactVelocity;
        if (v > 1) onCollide(v);
      },
    }),
    meshRef
  );

  useEffect(() => {
    apiRef.current = api;
    const [vx, vy, vz] = randomVelocity(2.5);
    api.velocity.set(vx, vy, vz);
  }, [api, apiRef]);

  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>}>
      <sphereGeometry args={[O_RADIUS, 32, 32]} />
      <meshStandardMaterial
        color="#ff3333"
        emissive="#ff0000"
        emissiveIntensity={1.2}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

// ─── Hydrogen Atom ─────────────────────────────────────────────────────────────
interface HydrogenProps {
  index: 0 | 1;
  apiRef: React.MutableRefObject<PublicApi | null>;
  meshRef: React.RefObject<THREE.Mesh>;
  onCollide: (v: number) => void;
}

export const HydrogenAtom: React.FC<HydrogenProps> = ({ index, apiRef, meshRef, onCollide }) => {
  const startPos: [number, number, number] =
    index === 0 ? [-2.5, 1.5, 0] : [2.5, -1.5, 0];

  const [ref, api] = useSphere(
    () => ({
      mass: H_MASS,
      position: startPos,
      args: [H_RADIUS],
      linearDamping: 0.02,
      angularDamping: 1,
      onCollide: (e) => {
        const v = e.contact.impactVelocity;
        if (v > 1) onCollide(v);
      },
    }),
    meshRef
  );

  useEffect(() => {
    apiRef.current = api;
    const [vx, vy, vz] = randomVelocity(4);
    api.velocity.set(vx, vy, vz);
  }, [api, apiRef]);

  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>}>
      <sphereGeometry args={[H_RADIUS, 24, 24]} />
      <meshStandardMaterial
        color="#aaddff"
        emissive="#88bbff"
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.05}
      />
    </mesh>
  );
};

// ─── Bond Visual (stick between atoms) ────────────────────────────────────────
interface BondProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
}

const BondStick: React.FC<BondProps> = ({ from, to }) => {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ccddff"
        emissiveIntensity={1.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// ─── Main Atoms Scene ──────────────────────────────────────────────────────────
export const AtomsScene: React.FC = () => {
  const { playClink, playBondFormed, playBondBroken } = useAudioVisualSync();

  // Physics API refs
  const oApi = useRef<PublicApi | null>(null);
  const h1Api = useRef<PublicApi | null>(null);
  const h2Api = useRef<PublicApi | null>(null);

  // THREE.js mesh refs (for reading positions each frame)
  const oMesh = useRef<THREE.Mesh>(null);
  const h1Mesh = useRef<THREE.Mesh>(null);
  const h2Mesh = useRef<THREE.Mesh>(null);

  // State
  const [bonded, setBonded] = useState(false);
  const bondedRef = useRef(false); // sync ref for use inside useFrame

  // Track live positions (updated each frame via physics subscription)
  const oPos = useRef(new THREE.Vector3());
  const h1Pos = useRef(new THREE.Vector3());
  const h2Pos = useRef(new THREE.Vector3());
  const oVel = useRef(new THREE.Vector3());

  // Bond visual state (re-render only when bonded)
  const [bondPositions, setBondPositions] = useState<{
    o: THREE.Vector3;
    h1: THREE.Vector3;
    h2: THREE.Vector3;
  } | null>(null);

  // Collision callbacks
  const handleOCollide = useCallback(
    (v: number) => playClink(v, "atom-wall"),
    [playClink]
  );
  const handleHCollide = useCallback(
    (v: number) => playClink(v, "atom-wall"),
    [playClink]
  );

  // ── useFrame: bonding logic ──────────────────────────────────────────────────
  useFrame(() => {
    if (!oMesh.current || !h1Mesh.current || !h2Mesh.current) return;

    // Read live world positions from meshes
    oMesh.current.getWorldPosition(oPos.current);
    h1Mesh.current.getWorldPosition(h1Pos.current);
    h2Mesh.current.getWorldPosition(h2Pos.current);

    const d1 = oPos.current.distanceTo(h1Pos.current);
    const d2 = oPos.current.distanceTo(h2Pos.current);

    if (!bondedRef.current) {
      // Check if both H are close enough to bond
      if (d1 < BOND_THRESHOLD && d2 < BOND_THRESHOLD) {
        bondedRef.current = true;
        setBonded(true);
        playBondFormed();

        // Freeze H atoms — we'll drive them manually
        h1Api.current?.mass.set(0);
        h2Api.current?.mass.set(0);
        h1Api.current?.velocity.set(0, 0, 0);
        h2Api.current?.velocity.set(0, 0, 0);
      }
    } else {
      // Drive H positions to maintain 104.5° geometry around O
      const angle1 = Math.atan2(oPos.current.y, oPos.current.x) + Math.PI / 2;

      const h1Target = new THREE.Vector3(
        oPos.current.x + BOND_LENGTH * Math.cos(angle1 - BOND_HALF_ANGLE),
        oPos.current.y + BOND_LENGTH * Math.sin(angle1 - BOND_HALF_ANGLE),
        0
      );
      const h2Target = new THREE.Vector3(
        oPos.current.x + BOND_LENGTH * Math.cos(angle1 + BOND_HALF_ANGLE),
        oPos.current.y + BOND_LENGTH * Math.sin(angle1 + BOND_HALF_ANGLE),
        0
      );

      h1Api.current?.position.set(h1Target.x, h1Target.y, 0);
      h2Api.current?.position.set(h2Target.x, h2Target.y, 0);

      // Update bond visual
      setBondPositions({
        o: oPos.current.clone(),
        h1: h1Target,
        h2: h2Target,
      });

      // Check for high-velocity wall impact → break bond
      oApi.current?.velocity.subscribe((v) => {
        oVel.current.set(v[0], v[1], v[2]);
      });

      if (oVel.current.length() > BREAK_VELOCITY) {
        breakBond();
      }

      // Also break if O drifts too close to the boundary
      if (oPos.current.length() > BOUNDARY_RADIUS - O_RADIUS - 0.3) {
        breakBond();
      }
    }
  });

  const breakBond = useCallback(() => {
    if (!bondedRef.current) return;
    bondedRef.current = false;
    setBonded(false);
    setBondPositions(null);
    playBondBroken();

    // Restore H mass and give random kick
    h1Api.current?.mass.set(H_MASS);
    h2Api.current?.mass.set(H_MASS);
    const [vx1, vy1] = randomVelocity(5);
    const [vx2, vy2] = randomVelocity(5);
    h1Api.current?.velocity.set(vx1, vy1, 0);
    h2Api.current?.velocity.set(vx2, vy2, 0);
    oApi.current?.velocity.set(-vx1 * 0.5, -vy1 * 0.5, 0);
  }, [playBondBroken]);

  return (
    <>
      <OxygenAtom apiRef={oApi} meshRef={oMesh} onCollide={handleOCollide} />
      <HydrogenAtom
        index={0}
        apiRef={h1Api}
        meshRef={h1Mesh}
        onCollide={handleHCollide}
      />
      <HydrogenAtom
        index={1}
        apiRef={h2Api}
        meshRef={h2Mesh}
        onCollide={handleHCollide}
      />

      {/* Bond sticks — only visible when bonded */}
      {bonded && bondPositions && (
        <>
          <BondStick from={bondPositions.o} to={bondPositions.h1} />
          <BondStick from={bondPositions.o} to={bondPositions.h2} />
        </>
      )}

      {/* Atom labels */}
      <AtomLabel position={oMesh} text="O" color="#ff4444" />
      <AtomLabel position={h1Mesh} text="H" color="#aaddff" />
      <AtomLabel position={h2Mesh} text="H" color="#aaddff" />
    </>
  );
};

// ─── Simple floating label ─────────────────────────────────────────────────────
interface LabelProps {
  position: React.RefObject<THREE.Mesh>;
  text: string;
  color: string;
}

const AtomLabel: React.FC<LabelProps> = ({ position, text, color }) => {
  const labelRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!position.current || !labelRef.current) return;
    const p = new THREE.Vector3();
    position.current.getWorldPosition(p);
    labelRef.current.position.set(p.x, p.y + (text === "O" ? 0.9 : 0.6), p.z);
  });

  return (
    <mesh ref={labelRef}>
      <sphereGeometry args={[0.001, 4, 4]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};
