import { describe, expect, it } from "vitest";
import { climbs, climbToWorkout, routeSearchText, routeTerrain } from "../lib/routes";
import { explorationRoutes } from "../lib/exploration-routes";
import { campaigns, campaignBonusXp, campaignProgress } from "../lib/campaigns";
import { discoveryBadges } from "../lib/discovery-objectives";
import { discoveryTerritories, routeThemes } from "../lib/route-themes";
import { badges, emptyState, totalXp } from "../lib/data";
import { routeCollections } from "../lib/progression";
import { createBackup, parseBackup } from "../lib/storage";
import type { CompletedSession } from "../lib/types";

function completed(routeId: string, metrics: CompletedSession["metrics"] = { source: "manual", completedRoute: true }): CompletedSession {
  return { id: `session-${routeId}`, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T18:00:00Z", duration: 20,
    xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false, metrics };
}
const badge = (sessions: CompletedSession[], id: string) => discoveryBadges(sessions).find((b) => b.id === id)!;

describe("documented exploration routes", () => {
  it("adds fifteen sourced destinations across all five difficulties without changing the original objectives", () => {
    expect(explorationRoutes).toHaveLength(15);
    expect(climbs).toHaveLength(71);
    expect(climbs.filter((r) => r.category === "scenic")).toHaveLength(29);
    expect(new Set(explorationRoutes.map((r) => r.difficulty))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(routeCollections.find((c) => c.id === "scenic-france")?.routeIds).toHaveLength(7);
    expect(campaigns.find((c) => c.id === "quiet-heritage")?.xpBonus).toBe(300);
    expect(campaigns.find((c) => c.id === "waterside-notebook")?.routeIds).toHaveLength(4);
    expect(new Set(climbs.map((r) => r.id)).size).toBe(71);
  });

  it("keeps source checksums, coherent terrain and ordered real-distance landmarks on every new route", () => {
    for (const route of explorationRoutes) {
      expect(route.provenance?.gpxSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(route.sourceUrl).toMatch(/^https:\/\//);
      expect(route.provenance?.altitudeSource).toBe("GPX officiel");
      expect(route.profile[0].km).toBe(0);
      expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
      let gain = 0;
      route.profile.slice(1).forEach((p, i) => {
        const previous = route.profile[i];
        expect(p.km).toBeGreaterThan(previous.km);
        expect(p.grade).toBeCloseTo((p.elevation - previous.elevation) / ((p.km - previous.km) * 10), 2);
        gain += Math.max(0, p.elevation - previous.elevation);
      });
      expect(route.elevationGainM).toBe(Math.round(gain));
      expect(route.coordinateKm).toHaveLength(route.coordinates.length);
      expect(route.coordinateKm?.[0]).toBe(0);
      expect(route.coordinateKm?.at(-1)).toBe(route.distanceKm);
      route.coordinateKm?.slice(1).forEach((km, i) => expect(km).toBeGreaterThan(route.coordinateKm![i]));
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      expect(new Set(route.places?.map((p) => p.label)).size).toBe(route.places?.length);
      route.places?.slice(1).forEach((p, i) => {
        expect(p.km).toBeGreaterThan(route.places![i].km);
        expect(route.coordinateKm).toContain(p.km);
      });
      for (const segment of climbToWorkout(route).segments) {
        expect(Number(segment.resistance)).toBeGreaterThanOrEqual(1);
        expect(Number(segment.resistance)).toBeLessThanOrEqual(32);
        if (route.category === "scenic") expect(segment.rpe).toBe("2–4");
      }
    }
  });

  it("distinguishes seaside Èze from the high Corniche and the Bonette pass from the summit loop", () => {
    const coast = explorationRoutes.find((r) => r.id === "eze-menton-basse-corniche")!;
    const high = explorationRoutes.find((r) => r.id === "nice-menton-grande-corniche")!;
    const menton = explorationRoutes.find((r) => r.id === "menton-garavan-promenade")!;
    const bonette = explorationRoutes.find((r) => r.id === "bonette-ubaye-tinee")!;
    expect(coast.places?.map((p) => p.label)).toContain("Monaco · port");
    expect(high.places?.map((p) => p.label)).not.toContain("Monaco · port");
    expect(coast.distanceKm).toBeGreaterThan(19);
    expect(coast.distanceKm).toBeLessThan(20);
    expect(high.elevationGainM).toBeGreaterThan(500);
    expect(menton.distanceKm).toBeGreaterThan(4);
    expect(climbToWorkout(menton).duration).toBeLessThan(20);
    expect(Math.max(...bonette.profile.map((p) => p.elevation))).toBeLessThan(2750);
    for (const id of ["sainte-croix-valensole", "castellane-deux-lacs", "verdon-route-cretes", "bretagne-roscoff-morlaix"]) {
      const terrain = routeTerrain(explorationRoutes.find((r) => r.id === id)!);
      expect(terrain.ascentKm).toBeGreaterThan(2);
      expect(terrain.descentKm).toBeGreaterThan(2);
    }
  });

  it("indexes towns and landmarks without accent sensitivity and keeps all themed references valid", () => {
    expect(routeSearchText(explorationRoutes.find((r) => r.id === "sainte-croix-valensole")!)).toContain("roumoules");
    expect(routeSearchText(explorationRoutes.find((r) => r.id === "eze-menton-basse-corniche")!)).toContain("eze-sur-mer");
    const ids = new Set(climbs.map((r) => r.id));
    expect(routeThemes).toHaveLength(10);
    expect(discoveryTerritories[0].routeIds).toHaveLength(18);
    for (const group of [...routeThemes, ...campaigns, ...discoveryTerritories]) {
      expect(new Set(group.routeIds).size).toBe(group.routeIds.length);
      group.routeIds.forEach((id) => expect(ids.has(id)).toBe(true));
    }
  });
});

describe("discovery rewards and history compatibility", () => {
  it("ignores incomplete attempts, every sector and unknown routes for the new trophies", () => {
    const invalid = climbs.flatMap((route) => [completed(route.id, { source: "manual", completedRoute: false }),
      completed(route.id, { source: "manual", completedRoute: true, segmentAttackIndex: 0 })]);
    expect(discoveryBadges([...invalid, completed("gpx-unknown")]).every((b) => !b.unlocked)).toBe(true);
    expect(campaignBonusXp(invalid)).toBe(0);
  });

  it("counts distinct native routes, distinct territories and all five difficulties without extra trophy XP", () => {
    const state = emptyState();
    state.sessions = ["menton-garavan-promenade", "bretagne-roscoff-morlaix", "castellane-deux-lacs", "turini-vesubie-sospel", "bonette-ubaye-tinee", "loire-blois-chaumont", "alsace-erstein-strasbourg"].map((id) => completed(id));
    state.sessions.push(completed("menton-garavan-promenade"));
    expect(badge(state.sessions, "five-difficulties").unlocked).toBe(true);
    expect(badge(state.sessions, "four-horizons").unlocked).toBe(true);
    expect(badge(state.sessions, "discovery-ten").progress).toBe("7/10");
    expect(badge(state.sessions, "paca-six").progress).toBe("4/6");
    expect(totalXp(state)).toBe(8 * 40 + 900); // Southern Alps campaign only; trophies add no XP.
    expect(badges(state).find((b) => b.id === "scenic-first")?.unlocked).toBe(true);
    const gentle = emptyState(); gentle.sessions = [completed("menton-garavan-promenade")];
    expect(badges(gentle).find((b) => b.id === "climb1")?.unlocked).toBe(false);
    state.sessions = state.sessions.filter((s) => s.routeId !== "bonette-ubaye-tinee");
    expect(badge(state.sessions, "five-difficulties").unlocked).toBe(false);
    expect(campaignBonusXp(state.sessions)).toBe(0);
  });

  it("awards a new notebook only once, marks out-of-order rides and recomputes after deleting the last completion", () => {
    const campaign = campaigns.find((c) => c.id === "azure-passport")!;
    const state = emptyState();
    state.sessions = [completed(campaign.routeIds[2])];
    expect(campaignProgress(campaign, state.sessions).nextRouteId).toBe(campaign.routeIds[0]);
    expect(campaignProgress(campaign, state.sessions).completedRouteIds.has(campaign.routeIds[2])).toBe(true);
    state.sessions.push(...campaign.routeIds.slice(0, 2).map((id) => completed(id)));
    expect(campaignBonusXp(state.sessions)).toBe(320);
    state.sessions.push({ ...completed(campaign.routeIds[2]), id: "repeated" });
    expect(campaignBonusXp(state.sessions)).toBe(320);
    state.sessions = state.sessions.filter((s) => s.id !== "repeated");
    expect(campaignBonusXp(state.sessions)).toBe(320);
    const imported = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(campaignBonusXp(imported.sessions)).toBe(320);
    state.sessions = state.sessions.filter((s) => s.routeId !== campaign.routeIds[2]);
    expect(campaignBonusXp(state.sessions)).toBe(0);
    expect(badges(state).find((b) => b.id === "campaign-azure-passport")?.unlocked).toBe(false);
  });
});
