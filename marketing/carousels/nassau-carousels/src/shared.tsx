import React from "react";

export const Wordmark: React.FC<{
  playfairFamily: string;
  color: string;
}> = ({ playfairFamily, color }) => (
  <div
    style={{
      position: "absolute",
      top: 60,
      left: 80,
      fontFamily: playfairFamily,
      fontSize: 28,
      color,
      zIndex: 10,
    }}
  >
    Nassau
  </div>
);

export const SwipeIndicator: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 50,
      right: 60,
      display: "flex",
      alignItems: "center",
      gap: 8,
      opacity: 0.5,
    }}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
);
