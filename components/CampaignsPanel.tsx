"use client";

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

  return (
    <section className="campaignSection">
      <div className="sectionHead campaignTitle">
        <div><p className="eyebrow">CAMPAGNES</p><h2>Un objectif, plusieurs étapes.</h2></div>
        <span className="spark">{campaigns.filter((campaign) => campaignProgress(campaign, sessions).complete).length}/{campaigns.length} terminées</span>
      </div>

      <div className="campaignGrid">
        {campaigns.map((campaign) => {
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
                  const completed = index < progress.completedStages || progress.complete;
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
                <span>Récompense <strong>+{campaign.xpBonus} XP</strong></span>
                {progress.complete
                  ? <strong className="campaignComplete">Campagne terminée</strong>
                  : nextRoute && <button className="secondary" onClick={() => onLaunch(nextRoute)}>Continuer · {nextRoute.name}</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
