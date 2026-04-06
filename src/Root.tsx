import React from "react";
import { Composition } from "remotion";
import { H2OSynthesis } from "./Composition";

/**
 * Root — registers all Remotion compositions.
 *
 * Video specs:
 *   Format : 9:16  (1080 × 1920)  — YouTube Shorts / Instagram Reels
 *   FPS    : 30
 *   Length : 30 s  (900 frames)
 */
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="H2OSynthesis"
        component={H2OSynthesis}
        durationInFrames={900}   // 30 s @ 30 fps
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
