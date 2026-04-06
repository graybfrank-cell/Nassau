import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../brand";
import { Wordmark } from "../shared";

type CTASlideProps = {
  headline?: string;
  subtitle?: string;
  cta?: string;
  playfairFamily: string;
  interFamily: string;
};

export const CTASlide: React.FC<CTASlideProps> = ({
  headline = "All golf trips.\nOne link.",
  subtitle,
  cta = "Get on the waitlist \u2192 nassau.golf",
  playfairFamily,
  interFamily,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Wordmark playfairFamily={playfairFamily} color={colors.parchment} />
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
            fontSize: 120,
            lineHeight: 1.05,
            color: colors.parchment,
            whiteSpace: "pre-line",
          }}
        >
          {headline}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: interFamily,
              fontSize: 24,
              color: colors.stone,
              marginTop: 40,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: interFamily,
            fontSize: 22,
            color: colors.brass,
            letterSpacing: "0.05em",
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
