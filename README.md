# The Chemistry of Chaos: H2O Synthesis

A high-end, generative ASMR video built with [Remotion](https://www.remotion.dev/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/cannon](https://github.com/pmndrs/react-three/cannon).

## Architecture

| File | Purpose |
|------|---------|
| `src/Root.tsx` | Remotion root — registers compositions (1080×1920 @ 30fps) |
| `src/Composition.tsx` | Main composition with title overlay + legend |
| `src/Scene.tsx` | R3F Canvas + Physics world + PostFX (Bloom) |
| `src/Atoms.tsx` | Oxygen & Hydrogen atoms + bonding logic |
| `src/Boundary.tsx` | Static beaker ring (physics + neon visual) |
| `src/useAudioVisualSync.ts` | Collision → sound hook (placeholder) |

## Physics Details

- **Zero gravity** world via `gravity={[0,0,0]}`
- **Beaker**: 64 static box segments arranged in a circle
- **O atom**: mass 4, radius 0.6, red emissive material
- **H atoms**: mass 1, radius 0.3, light-blue emissive material
- **Bonding**: triggered when both H atoms enter `< 1.8` units of O
- **Bond geometry**: 104.5° H–O–H angle, driven each frame via position constraints
- **Bond breaking**: O velocity `> 6` or proximity to boundary wall

## Getting Started

```bash
npm install
npm start         # opens Remotion Studio
npm run build     # renders to out/
```

## Video Specs

- **Resolution**: 1080 × 1920 (9:16)
- **FPS**: 30
- **Duration**: 30 seconds (900 frames)
- **Format**: Optimised for YouTube Shorts / Instagram Reels
