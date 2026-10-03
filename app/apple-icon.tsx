import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0c1020", borderRadius: 38, position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", width: 130, height: 130, borderRadius: 65,
          background: "radial-gradient(circle, rgba(80,227,255,.18), rgba(147,108,255,.02) 68%)"
        }} />
        <div style={{
          fontSize: 92, lineHeight: 1, fontWeight: 950, letterSpacing: -10,
          background: "linear-gradient(135deg,#50e3ff,#936cff)",
          backgroundClip: "text", color: "transparent", paddingRight: 10
        }}>V</div>
        <div style={{
          position: "absolute", width: 15, height: 15, borderRadius: "50%",
          background: "#b9ff66", right: 41, bottom: 38,
          boxShadow: "0 0 18px rgba(185,255,102,.7)"
        }} />
      </div>
    ),
    { ...size }
  );
}
