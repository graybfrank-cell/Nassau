import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const course = searchParams.get("course") || "Nassau Round";
  const date = searchParams.get("date") || "";
  const status = searchParams.get("status") || "upcoming";
  const players = searchParams.get("players") || "";
  const scores = searchParams.get("scores") || "";
  const winner = searchParams.get("winner") || "";
  const winnerScore = searchParams.get("winnerScore") || "";
  const skinsWinner = searchParams.get("skinsWinner") || "";
  const nassauWinner = searchParams.get("nassauWinner") || "";
  const moneyWon = searchParams.get("moneyWon") || "";
  const photo = searchParams.get("photo") || "";

  const playerList = players ? players.split(",") : [];
  const scoreList = scores ? scores.split(",") : [];

  const isRecap = status === "completed";
  const isLive = status === "in_progress";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Background */}
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #1a3a2a 0%, #0d1f15 100%)",
            }}
          />
        )}

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: photo
              ? "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)"
              : "transparent",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "48px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top: Logo + Status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "#D94F2B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                N
              </div>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "-0.5px",
                }}
              >
                Nassau
              </span>
            </div>

            {isLive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#D94F2B",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "white",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                }}
              >
                LIVE
              </div>
            )}
            {isRecap && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#1A1A1A",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "white",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                }}
              >
                FINAL
              </div>
            )}
          </div>

          {/* Middle: Course + Scores */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                }}
              >
                {course}
              </span>
              {date && (
                <span
                  style={{
                    fontSize: "18px",
                    color: "rgba(255,255,255,0.6)",
                    marginTop: "4px",
                  }}
                >
                  {date}
                </span>
              )}
            </div>

            {/* Scores table */}
            {playerList.length > 0 && scoreList.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                {playerList.map((name, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom:
                        idx < playerList.length - 1
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {idx === 0 && isRecap && (
                        <span style={{ fontSize: "16px" }}>🏆</span>
                      )}
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: idx === 0 ? 700 : 500,
                          color: "white",
                        }}
                      >
                        {name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "white",
                      }}
                    >
                      {scoreList[idx] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Winners + Money */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap" as const,
              }}
            >
              {skinsWinner && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "1px",
                    }}
                  >
                    Skins
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#D94F2B",
                    }}
                  >
                    {skinsWinner}
                  </span>
                </div>
              )}
              {nassauWinner && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "1px",
                    }}
                  >
                    Nassau
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#D94F2B",
                    }}
                  >
                    {nassauWinner}
                  </span>
                </div>
              )}
              {moneyWon && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "1px",
                    }}
                  >
                    Won
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#4ade80",
                    }}
                  >
                    {moneyWon}
                  </span>
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              nassau.golf
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
