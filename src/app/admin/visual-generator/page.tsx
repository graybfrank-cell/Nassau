"use client";
import { useState, useEffect } from "react";

const NASSAU_GREEN = "#10B981";
const NASSAU_DARK = "#0F172A";
const NASSAU_GOLD = "#F59E0B";

// Platform presets
const PLATFORMS = {
  instagram_post: { width: 1080, height: 1080, label: "Instagram Post", ratio: "1:1" },
  instagram_story: { width: 1080, height: 1920, label: "Instagram Story/Reel", ratio: "9:16" },
  instagram_carousel: { width: 1080, height: 1350, label: "Instagram Carousel", ratio: "4:5" },
  twitter: { width: 1200, height: 675, label: "Twitter/X Post", ratio: "16:9" },
  tiktok: { width: 1080, height: 1920, label: "TikTok", ratio: "9:16" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn Post", ratio: "1.91:1" },
  youtube_thumb: { width: 1280, height: 720, label: "YouTube Thumbnail", ratio: "16:9" },
  og_image: { width: 1200, height: 630, label: "OG / Share Card", ratio: "1.91:1" },
};

const TEMPLATES = [
  { id: "stat_card", name: "Stat Card", desc: "Bold stat with supporting text", icon: "📊" },
  { id: "quote_card", name: "Quote / Hot Take", desc: "Text-forward opinion or quote", icon: "💬" },
  { id: "carousel_cover", name: "Carousel Cover", desc: "Cover slide for swipe posts", icon: "📱" },
  { id: "budget_breakdown", name: "Budget Breakdown", desc: "Trip cost breakdown visual", icon: "💰" },
  { id: "course_spotlight", name: "Course Spotlight", desc: "Featured course with photo", icon: "⛳" },
  { id: "meme_format", name: "Meme / Humor", desc: "Relatable golf meme format", icon: "😂" },
  { id: "tip_card", name: "Tip / How-To", desc: "Actionable golf trip advice", icon: "💡" },
  { id: "recap_card", name: "Round/Trip Recap", desc: "Post-round or post-trip summary", icon: "🏆" },
];

const STYLES = [
  { id: "nassau_dark", name: "Nassau Dark", bg: "#0F172A", text: "#FFFFFF", accent: "#10B981" },
  { id: "nassau_green", name: "Nassau Green", bg: "#10B981", text: "#FFFFFF", accent: "#0F172A" },
  { id: "nassau_gold", name: "Nassau Gold", bg: "#F59E0B", text: "#0F172A", accent: "#10B981" },
  { id: "clean_white", name: "Clean White", bg: "#FFFFFF", text: "#0F172A", accent: "#10B981" },
  { id: "clubhouse", name: "Clubhouse", bg: "#1a2332", text: "#E8DCC8", accent: "#C9A96E" },
  { id: "sunset", name: "Golden Hour", bg: "#1C1917", text: "#FEF3C7", accent: "#F59E0B" },
];

function PreviewCanvas({ config }) {
  const platform = PLATFORMS[config.platform] || PLATFORMS.instagram_post;
  const style = STYLES.find(s => s.id === config.style) || STYLES[0];
  
  // Scale to fit in preview
  const maxW = 400;
  const maxH = 500;
  const scale = Math.min(maxW / platform.width, maxH / platform.height);
  const w = platform.width * scale;
  const h = platform.height * scale;

  return (
    <div className="flex items-center justify-center">
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: style.bg,
          color: style.text,
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Inter', sans-serif",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: `radial-gradient(${style.accent} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }} />
        
        {/* Content based on template */}
        <div style={{ position: "relative", zIndex: 1, padding: w * 0.06, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          
          {/* Nassau logo area */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: w * 0.04, fontWeight: 800, letterSpacing: "0.05em", color: style.accent }}>
              NASSAU
            </span>
            <span style={{ fontSize: w * 0.025, opacity: 0.5 }}>nassau.golf</span>
          </div>

          {/* Main content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: w * 0.03 }}>
            {config.template === "stat_card" && (
              <>
                <div style={{ fontSize: w * 0.15, fontWeight: 900, lineHeight: 1, color: style.accent }}>
                  {config.stat || "$2,400"}
                </div>
                <div style={{ fontSize: w * 0.045, fontWeight: 600, lineHeight: 1.3 }}>
                  {config.headline || "Per person for 4 days of golf in Bandon Dunes with 6 guys"}
                </div>
                <div style={{ fontSize: w * 0.03, opacity: 0.6, lineHeight: 1.5 }}>
                  {config.subtext || "Flights + lodging + 4 rounds + food + the inevitable skins losses"}
                </div>
              </>
            )}
            
            {config.template === "quote_card" && (
              <>
                <div style={{ fontSize: w * 0.07, fontWeight: 300, opacity: 0.3, color: style.accent }}>"</div>
                <div style={{ fontSize: w * 0.055, fontWeight: 600, lineHeight: 1.4, marginTop: -w * 0.04 }}>
                  {config.headline || "Your buddy says 'I'll Venmo you later' and you both know that's a lie."}
                </div>
                <div style={{ fontSize: w * 0.03, opacity: 0.5, marginTop: w * 0.02 }}>
                  {config.subtext || "— Every trip captain ever"}
                </div>
              </>
            )}
            
            {config.template === "carousel_cover" && (
              <>
                <div style={{ fontSize: w * 0.06, fontWeight: 800, lineHeight: 1.2, textTransform: "uppercase" }}>
                  {config.headline || "The Real Cost of a Scottsdale Golf Trip"}
                </div>
                <div style={{ width: w * 0.15, height: 3, backgroundColor: style.accent, borderRadius: 2 }} />
                <div style={{ fontSize: w * 0.035, opacity: 0.7, lineHeight: 1.5 }}>
                  {config.subtext || "Swipe for the full breakdown →"}
                </div>
              </>
            )}

            {config.template === "budget_breakdown" && (
              <>
                <div style={{ fontSize: w * 0.045, fontWeight: 700, marginBottom: w * 0.02 }}>
                  {config.headline || "4 Days in Scottsdale — Per Person"}
                </div>
                {(config.items || ["Flights: $320", "Lodging: $480", "Greens Fees: $740", "Food & Drinks: $360", "Skins Losses: $47"]).map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: `${w * 0.015}px 0`,
                    borderBottom: `1px solid ${style.accent}22`,
                    fontSize: w * 0.035,
                  }}>
                    <span style={{ opacity: 0.8 }}>{item.split(":")[0]}</span>
                    <span style={{ fontWeight: 700, color: style.accent }}>{item.split(":")[1]}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between", marginTop: w * 0.02,
                  fontSize: w * 0.045, fontWeight: 800,
                }}>
                  <span>Total</span>
                  <span style={{ color: style.accent }}>{config.stat || "$1,947"}</span>
                </div>
              </>
            )}

            {config.template === "course_spotlight" && (
              <>
                <div style={{ fontSize: w * 0.03, fontWeight: 600, color: style.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Course Spotlight
                </div>
                <div style={{ fontSize: w * 0.065, fontWeight: 800, lineHeight: 1.2 }}>
                  {config.headline || "TPC Scottsdale — Stadium Course"}
                </div>
                <div style={{ display: "flex", gap: w * 0.04, fontSize: w * 0.03, opacity: 0.7 }}>
                  <span>⛳ {config.stat || "$185/round"}</span>
                  <span>📍 {config.subtext || "Scottsdale, AZ"}</span>
                </div>
              </>
            )}

            {config.template === "meme_format" && (
              <>
                <div style={{ fontSize: w * 0.04, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {config.subtext || "POV"}
                </div>
                <div style={{ fontSize: w * 0.055, fontWeight: 700, lineHeight: 1.3 }}>
                  {config.headline || "You're the one friend trying to plan the boys' golf trip and no one will commit to dates"}
                </div>
              </>
            )}

            {config.template === "tip_card" && (
              <>
                <div style={{ fontSize: w * 0.03, fontWeight: 600, color: style.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Trip Captain Tip
                </div>
                <div style={{ fontSize: w * 0.05, fontWeight: 700, lineHeight: 1.3 }}>
                  {config.headline || "Book your Bandon Dunes trip 18 months out. Not 12. Not 6. Eighteen."}
                </div>
                <div style={{ fontSize: w * 0.03, opacity: 0.6, lineHeight: 1.5 }}>
                  {config.subtext || "The lottery system fills up fast and your crew will need time to commit."}
                </div>
              </>
            )}

            {config.template === "recap_card" && (
              <>
                <div style={{ fontSize: w * 0.03, fontWeight: 600, color: style.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Round Recap
                </div>
                <div style={{ fontSize: w * 0.06, fontWeight: 800, lineHeight: 1.2 }}>
                  {config.headline || "Scottsdale Day 2"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: w * 0.02, marginTop: w * 0.02 }}>
                  {[
                    { label: "Course", value: config.subtext || "TPC Stadium" },
                    { label: "Best Score", value: config.stat || "78" },
                    { label: "Skins Won", value: "4" },
                    { label: "Nassau Winner", value: "Tyler (+$15)" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: w * 0.02, background: `${style.accent}15`, borderRadius: 6 }}>
                      <div style={{ fontSize: w * 0.02, opacity: 0.5, textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: w * 0.035, fontWeight: 700 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!config.template && (
              <div style={{ fontSize: w * 0.05, fontWeight: 600, lineHeight: 1.3 }}>
                {config.headline || "Select a template to get started"}
              </div>
            )}
          </div>

          {/* CTA area */}
          {config.cta && (
            <div style={{
              backgroundColor: style.accent,
              color: style.bg,
              padding: `${w * 0.025}px ${w * 0.04}px`,
              borderRadius: 8,
              fontSize: w * 0.03,
              fontWeight: 700,
              textAlign: "center",
            }}>
              {config.cta}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NassauVisualGenerator() {
  const [config, setConfig] = useState({
    platform: "instagram_post",
    template: "stat_card",
    style: "nassau_dark",
    headline: "",
    subtext: "",
    stat: "",
    cta: "",
    items: [],
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeTab, setActiveTab] = useState("design");

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/marketing/visual-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (data.success && data.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
        setGeneratedContent(data.config);
      } else {
        console.error("AI generation failed:", data.error);
      }
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportSVG() {
    const previewEl = document.getElementById("nassau-preview");
    if (!previewEl) return;
    
    const target = previewEl.querySelector("div > div") as HTMLElement;
    if (!target) return;

    // Load html2canvas from CDN via script tag
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load html2canvas"));
        document.head.appendChild(script);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await (window as any).html2canvas(target, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `nassau-${config.template}-${config.platform}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: open in new tab for manual save
      const dataUrl = await captureToCanvas(target);
      if (dataUrl) {
        const w = window.open();
        if (w) {
          w.document.write(`<img src="${dataUrl}" style="max-width:100%"/><p>Right-click → Save Image As</p>`);
        }
      }
    }
  }

  async function captureToCanvas(el: HTMLElement): Promise<string | null> {
    try {
      const rect = el.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * 3;
      canvas.height = rect.height * 3;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${el.outerHTML}</div>
        </foreignObject>
      </svg>`;
      
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
      
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      ctx.scale(3, 3);
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#09090b",
      color: "#fafafa",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #27272a",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: NASSAU_GREEN, letterSpacing: "0.05em" }}>NASSAU</span>
          <span style={{ fontSize: 14, color: "#71717a" }}>Visual Content Generator</span>
        </div>
        <button
          onClick={handleExportSVG}
          style={{
            background: NASSAU_GREEN,
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↓ Export PNG
        </button>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
        {/* Left Panel - Controls */}
        <div style={{ 
          width: 380, 
          borderRight: "1px solid #27272a",
          overflowY: "auto",
          padding: 20,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#18181b", borderRadius: 8, padding: 4 }}>
            {["design", "ai", "batch"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab === tab ? "#27272a" : "transparent",
                  color: activeTab === tab ? "#fafafa" : "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {tab === "ai" ? "AI Generate" : tab}
              </button>
            ))}
          </div>

          {activeTab === "design" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Platform */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>Platform</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {Object.entries(PLATFORMS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => updateConfig("platform", key)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${config.platform === key ? NASSAU_GREEN : "#27272a"}`,
                        background: config.platform === key ? `${NASSAU_GREEN}15` : "#18181b",
                        color: config.platform === key ? NASSAU_GREEN : "#a1a1aa",
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {p.label}<br/>
                      <span style={{ fontSize: 10, opacity: 0.6 }}>{p.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>Template</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateConfig("template", t.id)}
                      style={{
                        padding: "10px",
                        borderRadius: 6,
                        border: `1px solid ${config.template === t.id ? NASSAU_GREEN : "#27272a"}`,
                        background: config.template === t.id ? `${NASSAU_GREEN}15` : "#18181b",
                        color: config.template === t.id ? "#fafafa" : "#a1a1aa",
                        fontSize: 11,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{t.icon}</span><br/>
                      <span style={{ fontWeight: 600 }}>{t.name}</span><br/>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>Color Style</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => updateConfig("style", s.id)}
                      style={{
                        width: 48, height: 48,
                        borderRadius: 8,
                        border: `2px solid ${config.style === s.id ? NASSAU_GREEN : "#27272a"}`,
                        background: s.bg,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: s.accent }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Fields */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>Content</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    placeholder="Headline / Main Text"
                    value={config.headline}
                    onChange={e => updateConfig("headline", e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 6,
                      border: "1px solid #27272a", background: "#18181b",
                      color: "#fafafa", fontSize: 13, outline: "none",
                    }}
                  />
                  <input
                    placeholder="Subtext / Supporting copy"
                    value={config.subtext}
                    onChange={e => updateConfig("subtext", e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 6,
                      border: "1px solid #27272a", background: "#18181b",
                      color: "#fafafa", fontSize: 13, outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="Key stat (e.g., $2,400)"
                      value={config.stat}
                      onChange={e => updateConfig("stat", e.target.value)}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 6,
                        border: "1px solid #27272a", background: "#18181b",
                        color: "#fafafa", fontSize: 13, outline: "none",
                      }}
                    />
                    <input
                      placeholder="CTA (optional)"
                      value={config.cta}
                      onChange={e => updateConfig("cta", e.target.value)}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 6,
                        border: "1px solid #27272a", background: "#18181b",
                        color: "#fafafa", fontSize: 13, outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                Describe what you want and AI will generate the content in Nassau's voice. Examples:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Scottsdale trip cost breakdown for 6 guys, 4 days",
                  "Hot take about people who don't track skins bets properly",
                  "Carousel cover about booking Bandon Dunes 18 months out",
                  "Meme about the group chat when planning a golf trip",
                  "Stat card about how much golfers spend on travel annually",
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setAiPrompt(example)}
                    style={{
                      padding: "8px 12px", borderRadius: 6,
                      border: "1px solid #27272a", background: "#18181b",
                      color: "#a1a1aa", fontSize: 11, cursor: "pointer",
                      textAlign: "left", lineHeight: 1.4,
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Describe the visual you want..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={4}
                style={{
                  width: "100%", padding: "12px", borderRadius: 8,
                  border: "1px solid #27272a", background: "#18181b",
                  color: "#fafafa", fontSize: 13, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleAIGenerate}
                disabled={generating || !aiPrompt.trim()}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: generating ? "#27272a" : `linear-gradient(135deg, ${NASSAU_GREEN}, #059669)`,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: generating ? "default" : "pointer",
                  opacity: !aiPrompt.trim() ? 0.5 : 1,
                }}
              >
                {generating ? "✨ Generating..." : "✨ Generate with AI"}
              </button>
              {generatedContent && (
                <div style={{
                  padding: 12, borderRadius: 8,
                  border: `1px solid ${NASSAU_GREEN}33`,
                  background: `${NASSAU_GREEN}08`,
                  fontSize: 11, color: "#a1a1aa",
                }}>
                  <div style={{ fontWeight: 600, color: NASSAU_GREEN, marginBottom: 4 }}>Generated Config</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 10 }}>
                    {JSON.stringify(generatedContent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "batch" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                <strong style={{ color: "#fafafa" }}>Batch Generation</strong> — coming post-launch. This will connect to the Social Agent and auto-generate visuals for your entire weekly Calendar.
              </div>
              <div style={{ padding: 16, borderRadius: 8, border: "1px dashed #27272a", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#71717a" }}>
                  Social Agent → Visual Generator Pipeline
                </div>
                <div style={{ fontSize: 11, color: "#52525b", marginTop: 8, lineHeight: 1.5 }}>
                  Calendar slot → Social Agent generates copy → Visual Generator creates matching graphics → Review & publish
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#52525b", lineHeight: 1.5 }}>
                <strong style={{ color: "#a1a1aa" }}>Integration roadmap:</strong><br/>
                1. Ideogram API for text-on-image graphics<br/>
                2. Midjourney API for course photography<br/>
                3. Runway Gen-4 for short-form video<br/>
                4. Auto-export to Buffer/Later for scheduling
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div style={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          background: "#0a0a0b",
          position: "relative",
        }} id="nassau-preview">
          <PreviewCanvas config={config} />
        </div>
      </div>
    </div>
  );
}
