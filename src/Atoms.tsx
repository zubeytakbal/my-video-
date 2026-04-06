import { useRef, useEffect, useCallback } from "react";
import { useSphere } from "@react-three/cannon";
import type { PublicApi } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOUNDARY_RADIUS } from "./Boundary";
import { useAudioVisualSync } from "./useAudioVisualSync";

// ─── Constants ──────────────────────────────────────────────────────────────────
const O_RADIUS = 0.6;
const H_RADIUS = 0.3;
const O_MASS = 4;
const H_MASS = 1;
const BOND_THRESHOLD = 1.8;         // distance to trigger bonding
const BOND_ARM = O_RADIUS + H_RADIUS + 0.25; // O–H bond length ~1.15
const HALF_ANGLE = (104.5 * Math.PI) / 360;  // half of 104.5°
const BREAK_SPEED = 5.5;            // O speed threshold to break bond

// ─── Helpers ────────────────────────────────────────────────────────────────────
function randVel(s: number): [number, number, number] {
  const a = Math.random() * Math.PI * 2;
  return [
    Math.cos(a) * s * (0.5 + Math.random() * 0.8),
    Math.sin(a) * s * (0.5 + Math.random() * 0.8),
    0,
  ];
}

/**
 * Reflect atom off the circular boundary wall.
 * Called every frame; only acts when the atom is outside the boundary.
 */
function reflectAtom(
  pos: THREE.Vector3,
  vel: [number, number, number],
  radius: number,
  api: PublicApi,
  onHit: () => void
): void {
  const d = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
  const limit = BOUNDARY_RADIUS - radius;
  if (d > limit) {
    const nx = pos.x / d;
    const ny = pos.y / d;
    const dot = vel[0] * nx + vel[1] * ny;
    if (dot > 0) {
      api.velocity.set(vel[0] - 2 * dot * nx, vel[1] - 2 * dot * ny, 0);
      api.position.set(nx * (limit - 0.05), ny * (limit - 0.05), 0);
      if (Math.abs(dot) > 0.5) onHit();
    }
  }
}

/**
 * Update a bond-stick mesh to stretch between `from` and `to`.
 * The cylinder geometry has height=1, scaled on Y to match the bond length.
 */
function updateBondMesh(
  mesh: THREE.Mesh,
  from: THREE.Vector3,
  to: THREE.Vector3
): void {
  mesh.position.addVectors(from, to).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len > 0.001) {
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.divideScalar(len)
    );
  }
  mesh.scale.set(1, len, 1);
}

// ─── Main scene component ────────────────────────────────────────────────────────
export function AtomsScene() {
  const { playClink, playBondFormed, playBondBroken } = useAudioVisualSync();

  // Physics bodies — cannon drives position/rotation via a web worker
  const [oRef, oApi] = useSphere<THREE.Mesh>(() => ({
    mass: O_MASS,
    position: [0, 0, 0],
    args: [O_RADIUS],
    linearDamping: 0.02,
    angularDamping: 1,
  }));

  const [h1Ref, h1Api] = useSphere<THREE.Mesh>(() => ({
    mass: H_MASS,
    position: [-2.2, 1.5, 0],
    args: [H_RADIUS],
    linearDamping: 0.02,
    angularDamping: 1,
  }));

  const [h2Ref, h2Api] = useSphere<THREE.Mesh>(() => ({
    mass: H_MASS,
    position: [2.2, -1.5, 0],
    args: [H_RADIUS],
    linearDamping: 0.02,
    angularDamping: 1,
  }));

  // Velocity refs — kept in sync via cannon subscriptions
  const oVel = useRef<[number, number, number]>([0, 0, 0]);
  const h1Vel = useRef<[number, number, number]>([0, 0, 0]);
  const h2Vel = useRef<[number, number, number]>([0, 0, 0]);

  // Bonding state (ref, not state — updated & read inside useFrame)
  const bondedRef = useRef(false);

  // Bond-stick mesh refs (mutated directly in useFrame, no React re-renders)
  const bond1Ref = useRef<THREE.Mesh>(null);
  const bond2Ref = useRef<THREE.Mesh>(null);

  // ─── Subscribe to velocity + set initial kicks ─────────────────────────────
  useEffect(() => {
    const u1 = oApi.velocity.subscribe(
      (v) => { oVel.current = v as [number, number, number]; }
    );
    const u2 = h1Api.velocity.subscribe(
      (v) => { h1Vel.current = v as [number, number, number]; }
    );
    const u3 = h2Api.velocity.subscribe(
      (v) => { h2Vel.current = v as [number, number, number]; }
    );

    const [ox, oy, oz] = randVel(2.5);
    oApi.velocity.set(ox, oy, oz);
    const [h1x, h1y, h1z] = randVel(4);
    h1Api.velocity.set(h1x, h1y, h1z);
    const [h2x, h2y, h2z] = randVel(4);
    h2Api.velocity.set(h2x, h2y, h2z);

    return () => { u1(); u2(); u3(); };
  }, [oApi, h1Api, h2Api]);

  // ─── Bond / Break ───────────────────────────────────────────────────────────
  const tryBond = useCallback(() => {
    bondedRef.current = true;
    playBondFormed();
    h1Api.velocity.set(0, 0, 0);
    h2Api.velocity.set(0, 0, 0);
  }, [h1Api, h2Api, playBondFormed]);

  const doBreak = useCallback(() => {
    bondedRef.current = false;
    playBondBroken();
    if (bond1Ref.current) bond1Ref.current.visible = false;
    if (bond2Ref.current) bond2Ref.current.visible = false;
    const [h1x, h1y, h1z] = randVel(5);
    h1Api.velocity.set(h1x, h1y, h1z);
    const [h2x, h2y, h2z] = randVel(5);
    h2Api.velocity.set(h2x, h2y, h2z);
  }, [h1Api, h2Api, playBondBroken]);

  // ─── Simulation loop (60 fps) ───────────────────────────────────────────────
  useFrame(() => {
    if (!oRef.current || !h1Ref.current || !h2Ref.current) return;

    const op = oRef.current.position;
    const h1p = h1Ref.current.position;
    const h2p = h2Ref.current.position;

    // Always reflect O off boundary
    reflectAtom(op, oVel.current, O_RADIUS, oApi, () =>
      playClink(2, "atom-wall")
    );

    if (!bondedRef.current) {
      // Free-roaming: reflect H off boundary
      reflectAtom(h1p, h1Vel.current, H_RADIUS, h1Api, () =>
        playClink(1.5, "atom-wall")
      );
      reflectAtom(h2p, h2Vel.current, H_RADIUS, h2Api, () =>
        playClink(1.5, "atom-wall")
      );

      // Check bonding condition
      if (
        op.distanceTo(h1p) < BOND_THRESHOLD &&
        op.distanceTo(h2p) < BOND_THRESHOLD
      ) {
        tryBond();
      }
    } else {
      // Bonded: drive H positions at 104.5° around O each frame
      const baseAngle = Math.atan2(op.y, op.x) + Math.PI / 2;

      const h1t = new THREE.Vector3(
        op.x + BOND_ARM * Math.cos(baseAngle - HALF_ANGLE),
        op.y + BOND_ARM * Math.sin(baseAngle - HALF_ANGLE),
        0
      );
      const h2t = new THREE.Vector3(
        op.x + BOND_ARM * Math.cos(baseAngle + HALF_ANGLE),
        op.y + BOND_ARM * Math.sin(baseAngle + HALF_ANGLE),
        0
      );

      h1Api.position.set(h1t.x, h1t.y, 0);
      h2Api.position.set(h2t.x, h2t.y, 0);
      h1Api.velocity.set(0, 0, 0);
      h2Api.velocity.set(0, 0, 0);

      // Sync bond-stick visuals
      if (bond1Ref.current && bond2Ref.current) {
        bond1Ref.current.visible = true;
        bond2Ref.current.visible = true;
        updateBondMesh(bond1Ref.current, op, h1t);
        updateBondMesh(bond2Ref.current, op, h2t);
      }

      // Break bond if O hits wall hard
      const oSpeed = Math.sqrt(
        oVel.current[0] * oVel.current[0] +
        oVel.current[1] * oVel.current[1]
      );
      if (oSpeed > BREAK_SPEED) doBreak();
    }
  });

  return (
    <>
      {/* Oxygen — large red glowing sphere */}
      <mesh ref={oRef}>
        <sphereGeometry args={[O_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ff3333"
          emissive="#ff0000"
          emissiveIntensity={1.5}
          roughness={0.3}
        />
      </mesh>

      {/* Hydrogen 1 — small light-blue sphere */}
      <mesh ref={h1Ref}>
        <sphereGeometry args={[H_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color="#aaddff"
          emissive="#88bbff"
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Hydrogen 2 */}
      <mesh ref={h2Ref}>
        <sphereGeometry args={[H_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color="#aaddff"
          emissive="#88bbff"
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Bond sticks — hidden until bonded, mutated directly in useFrame */}
      <mesh ref={bond1Ref} visible={false}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ccddff"
          emissiveIntensity={2.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={bond2Ref} visible={false}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ccddff"
          emissiveIntensity={2.5}
          transparent
          opacity={0.9}
        />
      </mesh>
    </>
  );
}
