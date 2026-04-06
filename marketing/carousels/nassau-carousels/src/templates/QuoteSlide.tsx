import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../brand";
import { Wordmark, SwipeIndicator } from "../shared";

type QuoteSlideProps = {
  quote: string;
  attribution?: string;
  theme: "light" | "dark";
  playfairFamily: string;
  interFamily: string;
};

export const QuoteSlide: React.FC<QuoteSlideProps> = ({
  quote,
  attribution,
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
      {/* Decorative quote mark */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 80,
          fontFamily: playfairFamily,
          fontSize: 240,
          lineHeight: 1,
          color: colors.nassauGreen,
          opacity: 0.15,
          userSelect: "none",
        }}
      >
        {"\u201C"}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 80,
          right: 80,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: playfairFamily,
            fontSize: 80,
            lineHeight: 1.1,
            color: fg,
            textWrap: "balance",
          }}
        >
          {quote}
        </div>
        {attribution && (
          <div
            style={{
              fontFamily: interFamily,
              fontSize: 18,
              color: colors.stone,
              marginTop: 48,
            }}
          >
            {attribution}
          </div>
        )}
      </div>
      <SwipeIndicator />
    </AbsoluteFill>
  );
};
