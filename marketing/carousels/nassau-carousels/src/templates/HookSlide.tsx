import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { colors, dimensions } from "../brand";
import { Wordmark, SwipeIndicator } from "../shared";

type HookSlideProps = {
  headline: string;
  backgroundImage?: string;
  overlay?: number;
  playfairFamily: string;
};

export const HookSlide: React.FC<HookSlideProps> = ({
  headline,
  backgroundImage,
  overlay = 0.55,
  playfairFamily,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {backgroundImage && (
        <AbsoluteFill>
          <Img
            src={staticFile(backgroundImage.replace(/^\/assets\//, ""))}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              objectFit: "cover",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,${overlay + 0.3}) 0%, rgba(0,0,0,${overlay * 0.3}) 40%, rgba(0,0,0,${overlay}) 100%)`,
            }}
          />
        </AbsoluteFill>
      )}
      {!backgroundImage && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${colors.ink} 0%, ${colors.nassauGreen} 100%)`,
          }}
        />
      )}
      <Wordmark playfairFamily={playfairFamily} color="white" />
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 80,
          right: 80,
          fontFamily: playfairFamily,
          fontSize: 96,
          lineHeight: 1.05,
          color: "white",
          textWrap: "balance",
        }}
      >
        {headline}
      </div>
      <SwipeIndicator />
    </AbsoluteFill>
  );
};
