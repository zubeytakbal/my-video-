import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOUNDARY_RADIUS } from "./Boundary";
import { useAudioVisualSync } from "./useAudioVisualSync";

// ─── Constants ───────────────────────────────────────────────────────────
const O_RADIUS = 0.6;
const H_RADIUS = 0.3;
const BOND_THRESHOLD = 1.8;
const BOND_ARM = O_RADIUS + H_RADIUS + 0.2;
const HALF_ANGLE = (104.5 * Math.PI) / 360;
const BREAK_SPEED = 4.5;
const DAMPING = 0.9998;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface Atom { pos: Vec2; vel: Vec2 }

// ─── Helpers ───────────────────────────────────────────────────────────────────
function randVel(s: number): Vec2 {
  const a = Math.random() * Math.PI * 2;
  const sp = s * (0.5 + Math.random() * 0.8);
  return { x: Math.cos(a) * sp, y: Math.sin(a) * sp };
}

function dist2(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Reflect atom off circular wall. Returns true if a hit occurred. */
function reflectWall(atom: Atom, radius: number, onHit: () => void): boolean {
  const d = Math.sqrt(atom.pos.x ** 2 + atom.pos.y ** 2);
  const limit = BOUNDARY_RADIUS - radius;
  if (d > limit) {
    const nx = atom.pos.x / d;
    const ny = atom.pos.y / d;
    const dot = atom.vel.x * nx + atom.vel.y * ny;
    if (dot > 0) {
      atom.vel.x -= 2 * dot * nx;
      atom.vel.y -= 2 * dot * ny;
      atom.pos.x = nx * (limit - 0.05);
      atom.pos.y = ny * (limit - 0.05);
      if (Math.abs(dot) > 0.3) onHit();
      return true;
    }
  }
  return false;
}

/** Simple elastic sphere-sphere collision. */
function resolveCollision(a: Atom, b: Atom, ra: number, rb: number, onHit: () => void): void {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const minD = ra + rb;
  if (d < minD && d > 0.001) {
    const nx = dx / d;
    const ny = dy / d;
    const overlap = (minD - d) * 0.5;
    a.pos.x -= nx * overlap;
    a.pos.y -= ny * overlap;
    b.pos.x += nx * overlap;
    b.pos.y += ny * overlap;
    const dvx = b.vel.x - a.vel.x;
    const dvy = b.vel.y - a.vel.y;
    const dot = dvx * nx + dvy * ny;
    if (dot < 0) {
      a.vel.x += dot * nx;
      a.vel.y += dot * ny;
      b.vel.x -= dot * nx;
      b.vel.y -= dot * ny;
      onHit();
    }
  }
}

/** Update bond-stick mesh to span between two points. */
function syncBondMesh(mesh: THREE.Mesh, from: Vec2, to: Vec2): void {
  const fx = (from.x + to.x) * 0.5;
  const fy = (from.y + to.y) * 0.5;
  mesh.position.set(fx, fy, 0);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0.001) {
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx / len, dy / len, 0)
    );
  }
  mesh.scale.set(1, len, 1);
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AtomsScene() {
  const { playClink, playBondFormed, playBondBroken } = useAudioVisualSync();

  // Physics state — all in refs, no React state (runs every frame)
  const o  = useRef<Atom>({ pos: { x:  0,    y:  0   }, vel: randVel(2.5) });
  const h1 = useRef<Atom>({ pos: { x: -2.2,  y:  1.5 }, vel: randVel(4)   });
  const h2 = useRef<Atom>({ pos: { x:  2.2,  y: -1.5 }, vel: randVel(4)   });
  const bonded = useRef(false);

  // Mesh refs
  const oMesh    = useRef<THREE.Mesh>(null);
  const h1Mesh   = useRef<THREE.Mesh>(null);
  const h2Mesh   = useRef<THREE.Mesh>(null);
  const bond1    = useRef<THREE.Mesh>(null);
  const bond2    = useRef<THREE.Mesh>(null);

  const hitWall   = useCallback(() => playClink(2,   "atom-wall"),  [playClink]);
  const hitWallH  = useCallback(() => playClink(1.5, "atom-wall"),  [playClink]);
  const hitAtom   = useCallback(() => playClink(1,   "atom-atom"),  [playClink]);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.05);
    const oa = o.current;
    const h1a = h1.current;
    const h2a = h2.current;

    if (!bonded.current) {
      // ─ Euler integration ──────────────────────────────────────────
      oa.pos.x  += oa.vel.x  * clampDt;  oa.pos.y  += oa.vel.y  * clampDt;
      h1a.pos.x += h1a.vel.x * clampDt;  h1a.pos.y += h1a.vel.y * clampDt;
      h2a.pos.x += h2a.vel.x * clampDt;  h2a.pos.y += h2a.vel.y * clampDt;

      oa.vel.x  *= DAMPING; oa.vel.y  *= DAMPING;
      h1a.vel.x *= DAMPING; h1a.vel.y *= DAMPING;
      h2a.vel.x *= DAMPING; h2a.vel.y *= DAMPING;

      // ─ Boundary & collision ────────────────────────────────────
      reflectWall(oa,  O_RADIUS, hitWall);
      reflectWall(h1a, H_RADIUS, hitWallH);
      reflectWall(h2a, H_RADIUS, hitWallH);
      resolveCollision(oa, h1a, O_RADIUS, H_RADIUS, hitAtom);
      resolveCollision(oa, h2a, O_RADIUS, H_RADIUS, hitAtom);

      // ─ Bonding check ─────────────────────────────────────────
      if (dist2(oa.pos, h1a.pos) < BOND_THRESHOLD &&
          dist2(oa.pos, h2a.pos) < BOND_THRESHOLD) {
        bonded.current = true;
        h1a.vel = { x: 0, y: 0 };
        h2a.vel = { x: 0, y: 0 };
        playBondFormed();
      }
    } else {
      // ─ Bonded: move O, lock H to 104.5° geometry ───────────────
      const speed = Math.sqrt(oa.vel.x ** 2 + oa.vel.y ** 2);

      oa.pos.x += oa.vel.x * clampDt;
      oa.pos.y += oa.vel.y * clampDt;
      oa.vel.x *= DAMPING;
      oa.vel.y *= DAMPING;

      const hitBoundary = reflectWall(oa, O_RADIUS, hitWall);

      if (hitBoundary && speed > BREAK_SPEED) {
        bonded.current = false;
        h1a.vel = randVel(5);
        h2a.vel = randVel(5);
        playBondBroken();
      } else {
        const base = Math.atan2(oa.vel.y || 1, oa.vel.x || 0) + Math.PI / 2;
        h1a.pos.x = oa.pos.x + BOND_ARM * Math.cos(base - HALF_ANGLE);
        h1a.pos.y = oa.pos.y + BOND_ARM * Math.sin(base - HALF_ANGLE);
        h2a.pos.x = oa.pos.x + BOND_ARM * Math.cos(base + HALF_ANGLE);
        h2a.pos.y = oa.pos.y + BOND_ARM * Math.sin(base + HALF_ANGLE);
      }
    }

    // ─ Sync meshes ───────────────────────────────────────────────────
    oMesh.current?.position.set(oa.pos.x,   oa.pos.y,   0);
    h1Mesh.current?.position.set(h1a.pos.x, h1a.pos.y, 0);
    h2Mesh.current?.position.set(h2a.pos.x, h2a.pos.y, 0);

    if (bond1.current && bond2.current) {
      bond1.current.visible = bonded.current;
      bond2.current.visible = bonded.current;
      if (bonded.current) {
        syncBondMesh(bond1.current, oa.pos, h1a.pos);
        syncBondMesh(bond2.current, oa.pos, h2a.pos);
      }
    }
  });

  return (
    <>
      {/* Oxygen — large red sphere */}
      <mesh ref={oMesh}>
        <sphereGeometry args={[O_RADIUS, 32, 32]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={1.5} roughness={0.3} />
      </mesh>

      {/* Hydrogen 1 */}
      <mesh ref={h1Mesh}>
        <sphereGeometry args={[H_RADIUS, 24, 24]} />
        <meshStandardMaterial color="#aaddff" emissive="#88bbff" emissiveIntensity={0.9} roughness={0.2} />
      </mesh>

      {/* Hydrogen 2 */}
      <mesh ref={h2Mesh}>
        <sphereGeometry args={[H_RADIUS, 24, 24]} />
        <meshStandardMaterial color="#aaddff" emissive="#88bbff" emissiveIntensity={0.9} roughness={0.2} />
      </mesh>

      {/* Bond sticks — shown only when bonded */}
      <mesh ref={bond1} visible={false}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ccddff" emissiveIntensity={2.5} transparent opacity={0.9} />
      </mesh>
      <mesh ref={bond2} visible={false}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ccddff" emissiveIntensity={2.5} transparent opacity={0.9} />
      </mesh>
    </>
  );
}
