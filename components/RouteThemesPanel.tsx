"use client";

import { completedRouteIds } from "@/lib/campaigns";
import { routeThemes } from "@/lib/route-themes";
import type { CompletedSession } from "@/lib/types";

export function RouteThemesPanel({ sessions, selectedId, onSelect }: {
  sessions: CompletedSession[]; selectedId: string; onSelect: (id: string) => void;
}) {
  const completed = completedRouteIds(sessions);
  return (
    <section className="routeThemes" aria-label="Thèmes de découverte">
      <div className="sectionHead"><div><p className="eyebrow">CARNET DE VOYAGE</p><h2>Choisis ton paysage.</h2></div></div>
      <p>Les thèmes réunissent balades et étapes. Choisis ensuite la difficulté et la durée qui te conviennent.</p>
      <div className="routeThemeGrid">
        {routeThemes.map((theme) => <button key={theme.id} className="themeCard" aria-pressed={selectedId === theme.id} onClick={() => onSelect(theme.id)}>
          <span aria-hidden="true">{theme.icon}</span><strong>{theme.title}</strong><small>{theme.description}</small>
          <em>{theme.routeIds.length} parcours · {theme.routeIds.filter((id) => completed.has(id)).length} découverts</em>
        </button>)}
      </div>
    </section>
  );
}
