import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { colors } from "../brand";
import { Wordmark, SwipeIndicator } from "../shared";

type ProductSlideProps = {
  screenshot: string;
  caption: string;
  badge?: string;
  playfairFamily: string;
  interFamily: string;
};

export const ProductSlide: React.FC<ProductSlideProps> = ({
  screenshot,
  caption,
  badge,
  playfairFamily,
  interFamily,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.parchment }}>
      <Wordmark playfairFamily={playfairFamily} color={colors.ink} />
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            fontFamily: interFamily,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "white",
            backgroundColor: colors.nassauGreen,
            padding: "10px 20px",
            borderRadius: 6,
          }}
        >
          {badge}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 80,
          right: 80,
          bottom: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(screenshot.replace(/^\/assets\//, ""))}
          style={{
            maxWidth: "100%",
            maxHeight: 800,
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}
        />
        <div
          style={{
            fontFamily: interFamily,
            fontSize: 24,
            color: colors.stone,
            marginTop: 40,
            textAlign: "center",
          }}
        >
          {caption}
        </div>
      </div>
      <SwipeIndicator />
    </AbsoluteFill>
  );
};
