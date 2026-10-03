import { describe, expect, it } from "vitest";
import { collectionProgress, progressionStats, routeCollections } from "../lib/progression";
import { climbs } from "../lib/routes";
import type { CompletedSession } from "../lib/types";

function routeSession(id:string, routeId:string, date:string, extras: Partial<CompletedSession["metrics"]> = {}): CompletedSession {
  return {
    id, templateId:`climb-${routeId}`, routeId, date,
    duration:60, points:5, xp:300, intensity:"hard", kind:"hills", bonus:false,
    metrics:{ source:"manual", completedRoute:true, ...extras }
  };
}

describe("long term progression", () => {
  it("counts unique routes, elevation and successful challenges", () => {
    const sessions=[
      routeSession("1","alpe-dhuez","2026-01-01T10:00:00Z",{ challenge:{ id:"no-pause",success:true,summary:"ok",xpBonus:60 } }),
      routeSession("2","galibier-valloire","2026-01-02T10:00:00Z"),
      routeSession("3","alpe-dhuez","2026-01-03T10:00:00Z")
    ];
    const stats=progressionStats(sessions,climbs);
    expect(stats.uniqueRoutes).toBe(2);
    expect(stats.totalRouteCompletions).toBe(3);
    expect(stats.challengeSuccesses).toBe(1);
    expect(stats.uniqueChallenges).toBe(1);
    expect(stats.virtualElevationGainM).toBeGreaterThan(3000);
  });

  it("ignores explicitly incomplete route sessions", () => {
    const sessions=[
      routeSession("1","alpe-dhuez","2026-01-01T10:00:00Z",{ completedRoute:false })
    ];
    expect(progressionStats(sessions,climbs).uniqueRoutes).toBe(0);
  });

  it("counts PB improvements chronologically", () => {
    const sessions=[
      routeSession("1","alpe-dhuez","2026-01-01T10:00:00Z",{ timeAttack:true,elapsedSeconds:1200 }),
      routeSession("2","alpe-dhuez","2026-01-02T10:00:00Z",{ timeAttack:true,elapsedSeconds:1150 }),
      routeSession("3","alpe-dhuez","2026-01-03T10:00:00Z",{ timeAttack:true,elapsedSeconds:1170 }),
      routeSession("4","alpe-dhuez","2026-01-04T10:00:00Z",{ timeAttack:true,elapsedSeconds:1100 })
    ];
    expect(progressionStats(sessions,climbs).pbImprovements).toBe(2);
  });

  it("unlocks collections only when every route is conquered", () => {
    const collection=routeCollections.find((item)=>item.id==="tour-legends")!;
    const partial=collectionProgress(collection,new Set(collection.routeIds.slice(0,3)));
    expect(partial.unlocked).toBe(false);
    expect(partial.percent).toBe(75);
    expect(collectionProgress(collection,new Set(collection.routeIds)).unlocked).toBe(true);
  });
});
