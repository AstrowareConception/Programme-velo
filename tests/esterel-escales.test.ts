import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { climbs, climbToWorkout, routeTerrain } from "../lib/routes";
import { esterelRoutes, esterelFullRouteIds, esterelShortRouteIds } from "../lib/esterel-routes";
import { napoleonShortRoutes, napoleonShortRouteIds } from "../lib/napoleon-short-routes";
import { napoleonRouteIds } from "../lib/napoleon-routes";
import { napoleonNorthRouteIds } from "../lib/napoleon-north-routes";
import { shortRouteIds } from "../lib/short-rides";
import { campaigns, campaignProgress, campaignBonusXp } from "../lib/campaigns";
import { discoveryBadges } from "../lib/discovery-objectives";
import { badges, emptyState, totalXp } from "../lib/data";
import { createBackup, parseBackup } from "../lib/storage";
import type { CompletedSession } from "../lib/types";

const complete = (routeId: string, id = routeId): CompletedSession => ({ id, routeId, templateId: `climb-${routeId}`,
  date: "2026-10-03T10:00:00Z", duration: 30, xp: 45, points: 1, kind: "endurance", intensity: "easy", bonus: false,
  metrics: { source: "manual", completedRoute: true } });
const allNew = [...esterelRoutes, ...napoleonShortRoutes];
const campaign = (id: string) => campaigns.find((c) => c.id === id)!;
const badge = (sessions: CompletedSession[], id: string) => discoveryBadges(sessions).find((b) => b.id === id)!;

describe("Estérel and independent Napoléon escapes", () => {
  it("keeps the four Estérel sections contiguous on the published tourist GPX, with a distinct inland return", () => {
    expect(esterelRoutes).toHaveLength(6);
    const full = esterelRoutes.slice(0, 4);
    expect(full.reduce((sum, route) => sum + route.distanceKm, 0)).toBeCloseTo(61.282, 2);
    expect(full[0].coordinates[0]).toEqual([43.422869, 6.766303]);
    expect(full.at(-1)?.coordinates.at(-1)).toEqual([43.423284, 6.766272]);
    full.slice(1).forEach((route, i) => expect(route.coordinates[0]).toEqual(full[i].coordinates.at(-1)));
    const inland = full[3];
    expect(inland.difficulty).toBe(3);
    expect(inland.elevationGainM).toBeGreaterThan(300);
    expect(routeTerrain(inland).ascentKm).toBeGreaterThan(5);
    expect(routeTerrain(inland).descentKm).toBeGreaterThan(5);
    expect(inland.places?.map((place) => place.label)).toContain("Estérel · RN7");
    expect(full[0].category).toBe("scenic");
    expect(full[2].maxGrade).toBeGreaterThan(4);
  });

  it("uses source-pinned geometry, coherent altitudes and ordered places without compressed distances", () => {
    const sources = { ...JSON.parse(readFileSync("scripts/esterel-sources.json", "utf8")), ...JSON.parse(readFileSync("scripts/napoleon-short-sources.json", "utf8")) };
    for (const route of allNew) {
      expect(route.provenance?.gpxSha256).toBe(sources[route.id].gpxSha256);
      expect(route.provenance?.altitudeSource).toBe("IGN RGE ALTI");
      expect(route.coordinates[0]).toEqual(sources[route.id].clip[0]);
      expect(route.coordinates.at(-1)).toEqual(sources[route.id].clip[1]);
      expect(route.profile[0].km).toBe(0);
      expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
      expect(route.coordinateKm).toHaveLength(route.coordinates.length);
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      route.places?.slice(1).forEach((place, i) => {
        expect(place.km).toBeGreaterThan(route.places![i].km);
        expect(route.coordinateKm).toContain(place.km);
      });
      let gain = 0;
      route.profile.slice(1).forEach((point, i) => {
        const previous = route.profile[i];
        expect(point.km).toBeGreaterThan(previous.km);
        expect(point.grade).toBeCloseTo((point.elevation - previous.elevation) / ((point.km - previous.km) * 10), 2);
        gain += Math.max(0, point.elevation - previous.elevation);
      });
      expect(route.elevationGainM).toBe(Math.round(gain));
      for (const segment of climbToWorkout(route).segments) {
        expect(Number(segment.resistance)).toBeGreaterThanOrEqual(1);
        expect(Number(segment.resistance)).toBeLessThanOrEqual(32);
      }
    }
    expect(napoleonShortRoutes[0].coordinates[0]).not.toEqual(climbs.find((r) => r.id === "golfe-juan-cannes-balade")!.coordinates[0]);
    expect(napoleonShortRoutes.at(-1)?.provenance?.trackName).toBe("Grenoble -> Embrun (167,3 km)");
  });

  it("offers six genuine short escapes without changing the fixed thirteen previous short objectives", () => {
    const shorts = allNew.filter((route) => route.parentRouteId);
    expect(shorts).toHaveLength(6);
    expect(shortRouteIds).toHaveLength(13);
    for (const route of shorts) {
      const parent = climbs.find((item) => item.id === route.parentRouteId)!;
      expect(route.distanceKm).toBeLessThan(parent.distanceKm);
      expect(route.provenance?.gpxSha256).toBe(parent.provenance?.gpxSha256);
      expect(climbToWorkout(route).duration).toBeGreaterThanOrEqual(15);
      expect(climbToWorkout(route).duration).toBeLessThanOrEqual(30);
      expect(climbToWorkout(route).intensity).toBe("easy");
    }
    const sessions = shorts.map((route) => complete(route.id));
    expect(campaignProgress(campaign("napoleon-paca"), sessions).completedStages).toBe(0);
    expect(campaignProgress(campaign("napoleon-dauphine"), sessions).completedStages).toBe(0);
    expect(campaignProgress(campaign("esterel-notebook"), sessions).completedStages).toBe(0);
    expect(badge(sessions, "short-three").progress).toBe("0/3");
    expect(badge(sessions, "napoleon-fourteen").progress).toBe("0/14");
    expect(badge(sessions, "esterel-red-rocks").progress).toBe("0/3");
    expect(badge(sessions, "napoleon-pocket-eagle").unlocked).toBe(true);
    expect(campaignBonusXp(sessions)).toBe(280);
    const state = emptyState(); state.sessions = sessions;
    expect(badges(state).find((item) => item.id === "scenic-three")?.unlocked).toBe(true);
    expect(badges(state).find((item) => item.id === "climb1")?.unlocked).toBe(false);
  });

  it("marks only actual out-of-order completions, ignoring incomplete rides, sectors and imported copies", () => {
    const sessions = [complete(esterelFullRouteIds[3]),
      { ...complete(esterelFullRouteIds[0]), metrics: { source: "manual" as const, completedRoute: false } },
      { ...complete(esterelFullRouteIds[1]), metrics: { source: "manual" as const, completedRoute: true, segmentAttackIndex: 0 } },
      complete("gpx-esterel-trayas-theoule")];
    expect(campaignProgress(campaign("esterel-notebook"), sessions).completedStages).toBe(1);
    expect(campaignProgress(campaign("esterel-notebook"), sessions).nextRouteId).toBe(esterelFullRouteIds[0]);
    expect(badge(sessions, "esterel-red-rocks").progress).toBe("0/3");
    expect(campaignBonusXp(sessions)).toBe(0);
  });

  it("awards the three new notebooks once and recalculates deletion, while retaining the old rewards and backups", () => {
    const state = emptyState();
    state.sessions = [...esterelFullRouteIds, ...esterelShortRouteIds, ...napoleonShortRouteIds].map((id) => complete(id));
    expect(campaignBonusXp(state.sessions)).toBe(880);
    expect(totalXp(state)).toBe(10 * 45 + 880);
    expect(badge(state.sessions, "esterel-red-rocks").unlocked).toBe(true);
    state.sessions.push(complete(esterelFullRouteIds[2], "repeat"));
    expect(campaignBonusXp(state.sessions)).toBe(880);
    state.sessions = state.sessions.filter((session) => session.id !== esterelFullRouteIds[2]);
    expect(campaignBonusXp(state.sessions)).toBe(880);
    state.sessions = state.sessions.filter((session) => session.id !== "repeat");
    expect(campaignBonusXp(state.sessions)).toBe(280);
    expect(badge(state.sessions, "esterel-red-rocks").progress).toBe("2/3");
    const restored = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(campaignBonusXp(restored.sessions)).toBe(280);
    expect(badge(restored.sessions, "esterel-red-rocks").progress).toBe("2/3");
    restored.sessions.push(...[...napoleonRouteIds, ...napoleonNorthRouteIds].map((id) => complete(id)));
    expect(campaignBonusXp(restored.sessions)).toBe(1880);
    expect(badge(restored.sessions, "napoleon-fourteen").unlocked).toBe(true);
    expect(badges(emptyState()).filter(b => !["program-return-in-comfort", "program-steady-mastery", "program-manage-your-ride"].includes(b.id) && !b.id.startsWith("days-") && !b.id.startsWith("regular-weeks-") && !b.id.startsWith("voyage-") && !b.id.startsWith("alsace-") && !b.id.startsWith("campaign-alsace-"))).toHaveLength(67);
  });
});
