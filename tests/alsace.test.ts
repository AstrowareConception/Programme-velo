import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import baseline from "./fixtures/catalogue-before-alsace.json";
import sources from "../scripts/alsace-sources.json";
import { alsaceRoutes, alsaceFullRouteIds, alsaceShortRouteIds } from "../lib/alsace-routes";
import { climbs, climbToWorkout, routeTerrain } from "../lib/routes";
import { badges, emptyState } from "../lib/data";
import { campaigns, campaignProgress, campaignBonusXp } from "../lib/campaigns";
import { normalizeState, createBackup, parseBackup } from "../lib/storage";
import { voyagePlan } from "../lib/voyage";
import type { CompletedSession } from "../lib/types";

const complete = (routeId: string, id = routeId): CompletedSession => ({ id, routeId, templateId: `climb-${routeId}`, date: "2026-10-06T10:00:00Z", duration: 30, points: 1, xp: 40, intensity: "easy", kind: "endurance", bonus: false, metrics: { source: "manual", completedRoute: true } });
const full = campaigns.find(c => c.id === "alsace-vineyards-notebook")!;
const short = campaigns.find(c => c.id === "alsace-pocket-notebook")!;

describe("source-pinned Alsace stages and independent escapes", () => {
  it("preserves every former route, campaign and badge definition from the shipped baseline", () => {
    expect(Object.keys(baseline.routeHashes)).toHaveLength(71);
    for (const [id, hash] of Object.entries(baseline.routeHashes)) {
      expect(createHash("sha256").update(JSON.stringify(climbs.find(r => r.id === id))).digest("hex"), id).toBe(hash);
    }
    for (const campaign of baseline.campaigns) expect(campaigns.find(c => c.id === campaign.id)).toEqual(campaign);
    const current = badges(emptyState());
    for (const badge of baseline.badges) expect(current.find(b => b.id === badge.id)).toEqual(badge);
    expect(current).toHaveLength(83);
    expect(new Set(current.map(b => b.id)).size).toBe(83);
    expect(new Set(current.map(b => b.name)).size).toBe(83);
  });

  it("uses only the reviewed continuous source section and keeps ordered real-distance places", () => {
    expect(alsaceRoutes).toHaveLength(9);
    expect(alsaceFullRouteIds).toHaveLength(6);
    expect(alsaceShortRouteIds).toHaveLength(3);
    for (const route of alsaceRoutes) {
      const source = sources[route.id as keyof typeof sources];
      expect(source.pointRange).toEqual([67, 7641]);
      expect(route.provenance).toMatchObject({ gpxSha256: source.gpxSha256, altitudeSource: "IGN RGE ALTI", profileStepM: 500 });
      expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
      expect(route.coordinateKm?.at(-1)).toBe(route.distanceKm);
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      for (let i = 1; i < route.profile.length; i++) {
        const a = route.profile[i - 1], b = route.profile[i];
        expect(b.km).toBeGreaterThan(a.km);
        expect(b.elevation).toBeGreaterThan(100);
        expect(b.grade).toBeCloseTo((b.elevation - a.elevation) / ((b.km - a.km) * 10), 2);
      }
      expect(voyagePlan(route, [], 15)).not.toBeNull();
    }
    const fullRoutes = alsaceFullRouteIds.map(id => climbs.find(r => r.id === id)!);
    for (let i = 1; i < fullRoutes.length; i++) expect(fullRoutes[i].coordinates[0]).toEqual(fullRoutes[i - 1].coordinates.at(-1));
    expect(new Set(fullRoutes.map(r => r.difficulty))).toEqual(new Set([1, 2, 3]));
    const rolling = routeTerrain(fullRoutes[1]);
    expect(fullRoutes[1].elevationGainM).toBeGreaterThan(100);
    expect(rolling.descentKm).toBeGreaterThan(1);
    expect(fullRoutes[1].profile.some(p => p.grade < -0.5)).toBe(true);
    expect(fullRoutes[3].places?.[1].landmark).toContain("2,4 km");
  });

  it("keeps short passages genuinely short, easy and separate from the parent route", () => {
    for (const id of alsaceShortRouteIds) {
      const route = climbs.find(r => r.id === id)!;
      const workout = climbToWorkout(route);
      expect(workout.duration).toBeGreaterThan(10);
      expect(workout.duration).toBeLessThan(25);
      expect(workout.intensity).toBe("easy");
      expect(route.distanceKm).toBeLessThan(climbs.find(r => r.id === route.parentRouteId)!.distanceKm);
    }
    const sessions = alsaceShortRouteIds.map(id => complete(id));
    expect(campaignProgress(full, sessions).completedStages).toBe(0);
    expect(campaignProgress(short, sessions).complete).toBe(true);
    expect(campaignBonusXp(sessions)).toBe(120);
    expect(badges({ ...emptyState(), sessions }).find(b => b.id === "alsace-villages")?.progress).toBe("0/3");
    expect(badges({ ...emptyState(), sessions }).find(b => b.id === "climb1")?.unlocked).toBe(false);
  });

  it("counts actual out-of-order completions, ignores incomplete rides, sectors and GPX copies", () => {
    const sessions = [complete(alsaceFullRouteIds[5]), complete(alsaceFullRouteIds[5], "repeat"),
      { ...complete(alsaceFullRouteIds[0]), metrics: { source: "manual" as const, completedRoute: false } },
      { ...complete(alsaceFullRouteIds[1]), metrics: { source: "manual" as const, completedRoute: true, segmentAttackIndex: 0 } },
      complete(`gpx-${alsaceFullRouteIds[2]}`)];
    expect(campaignProgress(full, sessions)).toMatchObject({ completedStages: 1, nextRouteId: alsaceFullRouteIds[0], complete: false });
    expect(campaignBonusXp(sessions)).toBe(0);
  });

  it("grants notebook bonuses once and recalculates removal and old/current imports", () => {
    const sessions = [...alsaceFullRouteIds, ...alsaceShortRouteIds].map(id => complete(id));
    sessions.push(complete(alsaceFullRouteIds[0], "repeat"));
    expect(campaignBonusXp(sessions)).toBe(770);
    const state = normalizeState({ ...emptyState(), sessions, favoriteRouteIds: [alsaceFullRouteIds[0]], voyage: { routeId: alsaceFullRouteIds[5], minutes: 30 } });
    const restored = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(restored.sessions).toEqual(state.sessions);
    expect(restored.voyage).toEqual(state.voyage);
    expect(campaignBonusXp(restored.sessions)).toBe(770);
    restored.sessions = restored.sessions.filter(s => s.routeId !== alsaceFullRouteIds[5]);
    expect(campaignBonusXp(restored.sessions)).toBe(120);
    expect(campaignProgress(full, restored.sessions).nextRouteId).toBe(alsaceFullRouteIds[5]);
    const old = parseBackup(JSON.stringify({ format: "veloquest-backup-v2", state: { ...emptyState(), sessions: [complete(alsaceFullRouteIds[0])] } }));
    expect(campaignProgress(full, old.state.sessions).completedStages).toBe(1);
  });
});
