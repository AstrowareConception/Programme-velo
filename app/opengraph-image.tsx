import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", position:"relative", overflow:"hidden", background:"#070a13", color:"#f7f8ff", fontFamily:"system-ui" }}>
      <div style={{ position:"absolute", width:620, height:620, borderRadius:310, border:"90px solid rgba(80,227,255,.08)", right:-120, top:-180 }} />
      <div style={{ position:"absolute", width:430, height:430, borderRadius:215, background:"rgba(147,108,255,.10)", left:-120, bottom:-190 }} />
      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"78px 86px", width:"78%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:40 }}>
          <div style={{ width:82, height:82, borderRadius:22, background:"#0c1020", border:"2px solid rgba(80,227,255,.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:55, fontWeight:950, color:"#50e3ff" }}>V</div>
          <div style={{ fontSize:30, fontWeight:800, letterSpacing:2 }}>VELOQUEST</div>
        </div>
        <div style={{ fontSize:72, lineHeight:1.02, fontWeight:950, letterSpacing:-4 }}>Ride. Level up.<br/>Repeat.</div>
        <div style={{ fontSize:27, color:"#9ba7c0", marginTop:30, lineHeight:1.4 }}>Coach indoor · séances guidées · FTMS · cols réels · progression · gamification</div>
        <div style={{ display:"flex", gap:12, marginTop:38 }}>
          {["12 semaines","32 niveaux","PWA offline"].map((label) => <span key={label} style={{ padding:"10px 16px", borderRadius:999, border:"1px solid rgba(255,255,255,.14)", fontSize:19 }}>{label}</span>)}
        </div>
      </div>
    </div>,
    size
  );
}
