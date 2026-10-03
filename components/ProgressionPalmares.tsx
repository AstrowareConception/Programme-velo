"use client";

import type { CompletedSession } from "@/lib/types";
import type { ClimbChallenge } from "@/lib/routes";
import { collectionProgress, progressionStats, routeCollections } from "@/lib/progression";

export function ProgressionPalmares({ sessions, routes }: { sessions: CompletedSession[]; routes: ClimbChallenge[] }) {
  const stats = progressionStats(sessions, routes);

  return (
    <section className="card palmares">
      <div className="sectionHead"><div><p className="eyebrow">PALMARÈS</p><h2>Ta saison VeloQuest</h2></div><span className="spark">{stats.uniqueRoutes} sommet{stats.uniqueRoutes > 1 ? "s" : ""}</span></div>
      <div className="palmaresStats">
        <span><small>D+ virtuel</small><strong>{Math.round(stats.virtualElevationGainM / 100) / 10} km</strong></span>
        <span><small>Parcours terminés</small><strong>{stats.totalRouteCompletions}</strong></span>
        <span><small>Défis réussis</small><strong>{stats.challengeSuccesses}</strong></span>
        <span><small>Défis différents</small><strong>{stats.uniqueChallenges}</strong></span>
        <span><small>Time Attacks</small><strong>{stats.timeAttackAttempts}</strong></span>
        <span><small>PB améliorés</small><strong>{stats.pbImprovements}</strong></span>
      </div>

      <div className="collectionList">
        {routeCollections.map((collection) => {
          const progress = collectionProgress(collection, stats.completedRouteIds);
          return (
            <article className={progress.unlocked ? "collectionCard unlocked" : "collectionCard"} key={collection.id}>
              <span>{collection.icon}</span>
              <div>
                <div><strong>{collection.title}</strong><small>{progress.completed}/{progress.total}</small></div>
                <p>{collection.description}</p>
                <i><b style={{ width: `${progress.percent}%` }} /></i>
              </div>
              <em>{progress.unlocked ? "✓" : `${progress.percent}%`}</em>
            </article>
          );
        })}
      </div>
    </section>
  );
}
