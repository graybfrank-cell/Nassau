import React from "react";
import { Composition } from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SlideComposition } from "./SlideComposition";
import { dimensions } from "./brand";

const { fontFamily: playfairFamily } = loadPlayfair();
const { fontFamily: interFamily } = loadInter();

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="slide"
        component={SlideComposition}
        width={dimensions.width}
        height={dimensions.height}
        fps={30}
        durationInFrames={1}
        defaultProps={{
          templateName: "TextSlide",
          templateProps: {
            theme: "light",
            headline: "Preview slide",
            body: "This is a preview.",
          },
          playfairFamily,
          interFamily,
        }}
      />
    </>
  );
};
