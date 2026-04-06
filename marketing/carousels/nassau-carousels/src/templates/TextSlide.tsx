import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../brand";
import { Wordmark, SwipeIndicator } from "../shared";

type TextSlideProps = {
  label?: string;
  headline: string;
  body?: string;
  theme: "light" | "dark";
  playfairFamily: string;
  interFamily: string;
};

export const TextSlide: React.FC<TextSlideProps> = ({
  label,
  headline,
  body,
  theme,
  playfairFamily,
  interFamily,
}) => {
  const isLight = theme === "light";
  const bg = isLight ? colors.parchment : colors.ink;
  const fg = isLight ? colors.ink : colors.parchment;

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Wordmark playfairFamily={playfairFamily} color={fg} />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 80,
          right: 80,
          bottom: 120,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {label && (
          <div
            style={{
              fontFamily: interFamily,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: colors.stone,
              marginBottom: 32,
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontFamily: playfairFamily,
            fontSize: 64,
            lineHeight: 1.1,
            color: fg,
            marginBottom: body ? 40 : 0,
            textWrap: "balance",
          }}
        >
          {headline}
        </div>
        {body && (
          <div
            style={{
              fontFamily: interFamily,
              fontSize: 22,
              lineHeight: 1.5,
              color: colors.stone,
              maxWidth: 780,
            }}
          >
            {body}
          </div>
        )}
      </div>
      <SwipeIndicator />
    </AbsoluteFill>
  );
};
