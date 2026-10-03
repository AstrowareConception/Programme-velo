"use client";

import type { ClimbChallenge } from "@/lib/routes";

export function ClimbProfile({ climb, progress = 0 }: { climb: ClimbChallenge; progress?: number }) {
  const width = 720;
  const height = 220;
  const pad = 22;
  const min = Math.min(...climb.profile.map((p) => p.elevation));
  const max = Math.max(...climb.profile.map((p) => p.elevation));
  const x = (km: number) => pad + (km / climb.distanceKm) * (width - pad * 2);
  const y = (e: number) => height - pad - ((e - min) / Math.max(1, max - min)) * (height - pad * 2);
  const path = climb.profile.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.km)} ${y(p.elevation)}`).join(" ");
  const km = Math.max(0, Math.min(climb.distanceKm, climb.distanceKm * progress));
  const before = [...climb.profile].reverse().find((p) => p.km <= km) ?? climb.profile[0];
  const cx = x(km);
  const cy = y(before.elevation);

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
        <line x1={cx} y1={pad} x2={cx} y2={height-pad} stroke="currentColor" strokeOpacity=".45" strokeDasharray="5 6" />
        <circle cx={cx} cy={cy} r="8" fill="currentColor" />
      </svg>
      <div className="profileScale"><span>0 km</span><strong>{km.toFixed(1)} km</strong><span>{climb.distanceKm.toFixed(1)} km</span></div>
    </div>
  );
}
