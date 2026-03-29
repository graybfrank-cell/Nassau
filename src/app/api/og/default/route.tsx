import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const title = searchParams.get("title") || "Nassau";
  const subtitle =
    searchParams.get("subtitle") || "The Golf Trip Companion";
  const type = searchParams.get("type") || "default"; // default, round, trip

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          backgroundColor: "#18181B",
          fontFamily: "Helvetica Neue, Arial, sans-serif",
        }}
      >
        {/* Coral accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            backgroundColor: "#D94F2B",
          }}
        />

        {/* Nassau logo text */}
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "60px",
            fontSize: "24px",
            fontWeight: 700,
            color: "#F3EDE4",
            letterSpacing: "4px",
          }}
        >
          NASSAU
        </div>

        {/* Type badge */}
        {type !== "default" && (
          <div
            style={{
              display: "flex",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                backgroundColor:
                  type === "round"
                    ? "rgba(217,79,43,0.15)"
                    : "rgba(13,115,119,0.15)",
                color: type === "round" ? "#D94F2B" : "#0D7377",
                padding: "8px 20px",
                borderRadius: "20px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {type === "round" ? "ROUND" : "TRIP"}
            </div>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 30 ? "48px" : "56px",
            fontWeight: 700,
            color: "#F3EDE4",
            lineHeight: 1.1,
            marginBottom: "12px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(243,237,228,0.5)",
          }}
        >
          {subtitle}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            fontSize: "16px",
            color: "rgba(243,237,228,0.3)",
          }}
        >
          nassau.golf
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
