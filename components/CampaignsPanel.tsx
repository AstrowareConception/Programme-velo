"use client";

import { useState } from "react";
import type { CompletedSession } from "@/lib/types";
import type { ClimbChallenge } from "@/lib/routes";
import { campaignProgress, campaigns } from "@/lib/campaigns";

export function CampaignsPanel({
  sessions,
  routes,
  onLaunch
}: {
  sessions: CompletedSession[];
  routes: ClimbChallenge[];
  onLaunch: (route: ClimbChallenge) => void;
}) {
  const routeMap = new Map(routes.map((route) => [route.id, route]));
  const [filter, setFilter] = useState<"all" | "discovery" | "sport" | "progress">("all");
  const visible = campaigns.filter((campaign) => {
    if (filter === "all") return true;
    if (filter === "progress") {
      const progress = campaignProgress(campaign, sessions);
      return progress.completedStages > 0 && !progress.complete;
    }
    const group = campaign.group ?? (["waterside-notebook", "quiet-heritage"].includes(campaign.id) ? "discovery" : "sport");
    return group === filter;
  });

  return (
    <section className="campaignSection">
      <div className="sectionHead campaignTitle">
        <div><p className="eyebrow">CAMPAGNES</p><h2>Un objectif, plusieurs étapes.</h2></div>
        <span className="spark">{campaigns.filter((campaign) => campaignProgress(campaign, sessions).complete).length}/{campaigns.length} terminées</span>
      </div>

      <details className="campaignDrawer">
        <summary>Campagnes et carnets · {campaigns.length} objectifs à découvrir</summary>
        <p>Les étapes peuvent être faites dans le désordre. Seuls les parcours complets valident un objectif ; les pauses restent libres. Retrouve les trophées de variété dans Plus.</p>
        <div className="choiceRow campaignFilters" aria-label="Filtrer les campagnes">
          {([["all", "Tous les objectifs"], ["discovery", "Découverte"], ["sport", "Sport"], ["progress", "En cours"]] as const).map(([value, label]) =>
            <button className={filter === value ? "choice active" : "choice"} aria-pressed={filter === value} key={value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
      <div className="campaignGrid">
        {visible.map((campaign) => {
          const progress = campaignProgress(campaign, sessions);
          const nextRoute = progress.nextRouteId ? routeMap.get(progress.nextRouteId) : undefined;
          return (
            <article className={progress.complete ? "card campaignCard completed" : "card campaignCard"} key={campaign.id}>
              <div className="campaignHeader">
                <span>{campaign.icon}</span>
                <div><small>{campaign.subtitle} · {campaign.difficultyLabel}</small><h3>{campaign.title}</h3></div>
                <em>{progress.complete ? "✓" : `${progress.percent}%`}</em>
              </div>
              <p>{campaign.description}</p>
              <div className="campaignBar"><i><b style={{ width: `${progress.percent}%` }} /></i><span>{progress.completedStages}/{progress.totalStages}</span></div>
              <div className="campaignStages">
                {campaign.routeIds.map((routeId, index) => {
                  const route = routeMap.get(routeId);
                  const completed = progress.completedRouteIds.has(routeId);
                  const current = routeId === progress.nextRouteId;
                  return (
                    <span className={completed ? "done" : current ? "current" : ""} key={routeId}>
                      <b>{completed ? "✓" : index + 1}</b>
                      <small>{route?.name ?? routeId}</small>
                    </span>
                  );
                })}
              </div>
              <div className="campaignFooter">
                <span>Badge + récompense unique <strong>+{campaign.xpBonus} XP</strong></span>
                {progress.complete
                  ? <strong className="campaignComplete">Campagne terminée</strong>
                  : nextRoute && <button className="secondary" onClick={() => onLaunch(nextRoute)}>Continuer · {nextRoute.name}</button>}
              </div>
            </article>
          );
        })}
      </div>
        {visible.length === 0 && <p>Aucun objectif en cours. Choisis un carnet de découverte ou une campagne sportive pour commencer.</p>}
      </details>
    </section>
  );
}
