"use client";

import type { ClimbChallenge } from "@/lib/routes";

export function ClimbProfile({
  climb,
  progress = 0,
  ghostProgress
}: {
  climb: ClimbChallenge;
  progress?: number;
  ghostProgress?: number;
}) {
  const width = 720;
  const height = 220;
  const pad = 22;
  const min = Math.min(...climb.profile.map((p) => p.elevation));
  const max = Math.max(...climb.profile.map((p) => p.elevation));
  const x = (km: number) => pad + (km / climb.distanceKm) * (width - pad * 2);
  const y = (e: number) => height - pad - ((e - min) / Math.max(1, max - min)) * (height - pad * 2);
  const path = climb.profile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.km)} ${y(p.elevation)}`).join(" ");

  const position = (fraction: number) => {
    const km = Math.max(0, Math.min(climb.distanceKm, climb.distanceKm * fraction));
    const before = [...climb.profile].reverse().find((p) => p.km <= km) ?? climb.profile[0];
    return { km, cx: x(km), cy: y(before.elevation) };
  };

  const rider = position(progress);
  const ghost = ghostProgress !== undefined ? position(ghostProgress) : undefined;

  return (
    <div className="profileWrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Profil altimétrique de ${climb.name}`}>
        <defs>
          <linearGradient id={`fill-${climb.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".38" />
            <stop offset="1" stopColor="currentColor" stopOpacity=".03" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${x(climb.distanceKm)} ${height-pad} L ${pad} ${height-pad} Z`} fill={`url(#fill-${climb.id})`} />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
        {ghost && (
          <>
            <line x1={ghost.cx} y1={pad} x2={ghost.cx} y2={height-pad} className="ghostProfileLine" />
            <circle cx={ghost.cx} cy={ghost.cy} r="7" className="ghostProfilePoint" />
          </>
        )}
        <line x1={rider.cx} y1={pad} x2={rider.cx} y2={height-pad} stroke="currentColor" strokeOpacity=".45" strokeDasharray="5 6" />
        <circle cx={rider.cx} cy={rider.cy} r="8" fill="currentColor" />
      </svg>
      <div className="profileScale"><span>0 km</span><strong>{rider.km.toFixed(1)} km</strong><span>{climb.distanceKm.toFixed(1)} km</span></div>
    </div>
  );
}
