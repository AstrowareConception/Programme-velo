import { describe, expect, it } from "vitest";
import { climbs, climbToWorkout } from "../lib/routes";
import { shortRoutes, shortRouteIds } from "../lib/short-rides";
import { napoleonRoutes } from "../lib/napoleon-routes";
import { campaigns, campaignProgress, campaignBonusXp } from "../lib/campaigns";
import { discoveryBadges } from "../lib/discovery-objectives";
import { badges, emptyState } from "../lib/data";
import type { CompletedSession } from "../lib/types";

const completed = (routeId: string, metrics: CompletedSession["metrics"] = { source: "manual", completedRoute: true }): CompletedSession => ({
  id: routeId, templateId: `climb-${routeId}`, routeId, date: "2026-10-03T10:00:00Z", duration: 25, xp: 45, points: 1, kind: "endurance", intensity: "easy", bonus: false, metrics
});

describe("short rides and Route Napoléon", () => {
  it("adds nine independent actual sections within 15–30 simulated minutes and keeps the steep Verdon effort moderate", () => {
    expect(shortRoutes).toHaveLength(9);
    expect(shortRouteIds).toHaveLength(13);
    for (const route of shortRoutes) {
      const parent = climbs.find((item) => item.id === route.parentRouteId)!;
      expect(route.distanceKm).toBeLessThan(parent.distanceKm);
      expect(route.provenance?.gpxSha256).toBe(parent.provenance?.gpxSha256);
      expect(route.provenance?.section).toBeTruthy();
      expect(climbToWorkout(route).duration).toBeGreaterThanOrEqual(15);
      expect(climbToWorkout(route).duration).toBeLessThanOrEqual(30);
    }
    const riez = shortRoutes.find((route) => route.id === "riez-montagnac-short")!;
    expect(riez.difficulty).toBe(2);
    expect(riez.maxGrade).toBeGreaterThan(8);
    expect(climbToWorkout(riez).intensity).toBe("moderate");
    expect(Math.max(...climbToWorkout(riez).segments.map((segment) => Number(segment.resistance)))).toBeLessThanOrEqual(14);
  });

  it("keeps the eight road sections continuous from Golfe-Juan to Gap with actual terrain, not joined GPX route waypoints", () => {
    expect(napoleonRoutes).toHaveLength(8);
    expect(napoleonRoutes[0].coordinates[0]).toEqual([43.56864, 7.077]);
    expect(napoleonRoutes.at(-1)?.places?.at(-1)?.label).toBe("Gap");
    expect(napoleonRoutes.reduce((sum, route) => sum + route.distanceKm, 0)).toBeCloseTo(239.832936, 2);
    napoleonRoutes.slice(1).forEach((route, index) => expect(route.coordinates[0]).toEqual(napoleonRoutes[index].coordinates.at(-1)));
    for (const route of [...napoleonRoutes, ...shortRoutes]) {
      expect(route.provenance?.gpxSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
      expect(route.coordinateKm).toHaveLength(route.coordinates.length);
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      route.places?.slice(1).forEach((place, index) => expect(place.km).toBeGreaterThan(route.places![index].km));
      let gain = 0;
      route.profile.slice(1).forEach((point, index) => {
        const previous = route.profile[index];
        expect(point.km).toBeGreaterThan(previous.km);
        expect(point.grade).toBeCloseTo((point.elevation-previous.elevation)/((point.km-previous.km)*10), 2);
        gain += Math.max(0, point.elevation-previous.elevation);
      });
      expect(route.elevationGainM).toBe(Math.round(gain));
    }
    expect(napoleonRoutes.every((route) => route.provenance?.altitudeSource === "IGN RGE ALTI")).toBe(true);
  });

  it("provides landscape, highlights, sources and place information for every route, clearly marking simplified profiles", () => {
    for (const route of climbs) {
      expect(route.scenery?.length).toBeGreaterThan(150);
      expect(route.highlights?.length).toBeGreaterThanOrEqual(2);
      expect(route.sourceUrl).toMatch(/^https:\/\//);
      expect(route.places?.length).toBeGreaterThanOrEqual(2);
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      if (!route.provenance) expect(route.placesNote).toContain("ne sont pas des positions GPS");
    }
    const ventoux = climbs.find((route) => route.id === "ventoux-bedoin")!;
    expect(ventoux.scenery).toContain("Chalet Reynard");
    expect(ventoux.distanceKm).toBe(21);
    expect(ventoux.profile).toHaveLength(9);
    expect(ventoux.xp).toBe(420);
  });

  it("does not complete parent routes with short rides, nor whole stages with incomplete attempts or sectors", () => {
    const route = shortRoutes[0];
    const sessions = [completed(route.id), completed("napoleon-sisteron-gap"),
      completed("napoleon-grasse-vallier", { source: "manual", completedRoute: false }),
      completed("napoleon-castellane-barreme", { source: "manual", completedRoute: true, segmentAttackIndex: 2 })];
    const parentCampaign = campaigns.find((campaign) => campaign.id === "azure-passport")!;
    expect(campaignProgress(parentCampaign, sessions).completedStages).toBe(0);
    expect(campaignProgress(parentCampaign, sessions).completedRouteIds.has(route.parentRouteId!)).toBe(false);
    const campaign = campaigns.find((item) => item.id === "napoleon-paca")!;
    const progress = campaignProgress(campaign, sessions);
    expect(progress.completedStages).toBe(1);
    expect(progress.completedRouteIds.has(campaign.routeIds[7])).toBe(true);
    expect(progress.nextRouteId).toBe(campaign.routeIds[0]);
  });

  it("awards the Route Napoléon reward once and recomputes its trophy after the last completion is removed", () => {
    const campaign = campaigns.find((item) => item.id === "napoleon-paca")!;
    const state = emptyState(); state.sessions = campaign.routeIds.map((id) => completed(id));
    expect(campaignBonusXp(state.sessions)).toBe(900);
    state.sessions.push({ ...completed(campaign.routeIds[7]), id: "repeat" });
    expect(campaignBonusXp(state.sessions)).toBe(900);
    expect(badges(state).find((badge) => badge.id === "campaign-napoleon-paca")?.unlocked).toBe(true);
    state.sessions = state.sessions.filter((session) => session.routeId !== campaign.routeIds[7]);
    expect(campaignBonusXp(state.sessions)).toBe(0);
    expect(badges(state).find((badge) => badge.id === "campaign-napoleon-paca")?.progress).toBe("7/8");
  });

  it("counts distinct short discoveries and gentle landscapes without changing the fixed PACA trophy", () => {
    const state = emptyState(); state.sessions = shortRoutes.slice(0, 3).map((route) => completed(route.id));
    state.sessions.push(completed(shortRoutes[0].id));
    expect(discoveryBadges(state.sessions).find((badge) => badge.id === "short-three")?.unlocked).toBe(true);
    expect(discoveryBadges(state.sessions).find((badge) => badge.id === "short-six")?.progress).toBe("3/6");
    expect(discoveryBadges(state.sessions).find((badge) => badge.id === "paca-six")?.progress).toBe("0/6");
    expect(badges(state).find((badge) => badge.id === "scenic-three")?.unlocked).toBe(true);
    expect(badges(state).find((badge) => badge.id === "climb1")?.unlocked).toBe(false);
  });
});
