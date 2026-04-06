import "./index.css";
import { Composition } from "remotion";
import { H2OSynthesis } from "./Composition";

/**
 * RemotionRoot — registers all compositions.
 *
 * H2OSynthesis: 1080 x 1920 (9:16) @ 30 fps, 30 s
 */
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="H2OSynthesis"
        component={H2OSynthesis}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
