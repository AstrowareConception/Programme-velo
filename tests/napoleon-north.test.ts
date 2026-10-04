import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { napoleonNorthRoutes, napoleonNorthRouteIds } from "../lib/napoleon-north-routes";
import { napoleonRouteIds, napoleonRoutes } from "../lib/napoleon-routes";
import { routeThemes } from "../lib/route-themes";
import { campaigns, campaignProgress, campaignBonusXp } from "../lib/campaigns";
import { discoveryBadges } from "../lib/discovery-objectives";
import { badges, emptyState } from "../lib/data";
import { climbToWorkout } from "../lib/routes";
import type { CompletedSession } from "../lib/types";

const complete = (routeId: string): CompletedSession => ({ id: routeId, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T10:00:00Z", duration: 30, xp: 40, points: 1, kind: "endurance", intensity: "moderate", bonus: false, metrics: { source: "manual", completedRoute: true } });
const north = campaigns.find((item) => item.id === "napoleon-dauphine")!;

describe("Route Napoléon from Gap to Grenoble", () => {
  it("uses six consecutive sections of one published track, preserving the previous eight and their own Gap endpoint", () => {
    expect(napoleonNorthRoutes).toHaveLength(6);
    expect(napoleonRoutes).toHaveLength(8);
    expect(napoleonNorthRoutes.reduce((sum, route) => sum + route.distanceKm, 0)).toBeCloseTo(102.065, 2);
    expect(napoleonNorthRoutes[0].coordinates[0]).toEqual([44.557793, 6.081951]);
    expect(napoleonNorthRoutes.at(-1)?.coordinates.at(-1)).toEqual([45.183293, 5.737984]);
    expect(napoleonNorthRoutes[0].coordinates[0]).not.toEqual(napoleonRoutes.at(-1)?.coordinates.at(-1));
    napoleonNorthRoutes.slice(1).forEach((route, index) => expect(route.coordinates[0]).toEqual(napoleonNorthRoutes[index].coordinates.at(-1)));
    expect(routeThemes.find((item) => item.id === "napoleon")?.routeIds).toEqual([...napoleonRouteIds, ...napoleonNorthRouteIds]);
    for (const route of napoleonNorthRoutes) {
      expect(route.provenance?.trackName).toBe("Grenoble -> Embrun (167,3 km)");
      expect(route.provenance?.gpxSha256).toBe("8f3c12217c9c4199fcfaa66fca6f28be77bbe436e6e59f97b1cb22369bad8b36");
      expect(route.provenance?.altitudeSource).toBe("IGN RGE ALTI");
      expect(route.coordinateKm).toHaveLength(route.coordinates.length);
      expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
      expect(route.places?.[0].km).toBe(0);
      expect(route.places?.at(-1)?.km).toBe(route.distanceKm);
      route.places?.slice(1).forEach((place, index) => expect(place.km).toBeGreaterThan(route.places![index].km));
      const gain = route.profile.slice(1).reduce((sum, p, i) => sum + Math.max(0, p.elevation - route.profile[i].elevation), 0);
      expect(route.elevationGainM).toBe(Math.round(gain));
      for (const point of route.profile) expect([point.km, point.elevation, point.grade].every(Number.isFinite)).toBe(true);
    }
    const bayard = napoleonNorthRoutes[0];
    expect(bayard.elevationGainM).toBeGreaterThan(500);
    expect(bayard.profile.some((p) => p.grade < -3)).toBe(true);
    const descent = napoleonNorthRoutes[4];
    expect(descent.elevationGainM).toBe(0);
    expect(descent.finishElevationM).toBeLessThan(descent.startElevationM - 600);
    expect(descent.effort).toBe("moderate");
    expect(climbToWorkout(descent).duration).toBe(27);
  });

  it("keeps the previous carnet and trophy valid while showing actual out-of-order northern completions", () => {
    const sessions = [...napoleonRouteIds.map(complete), complete(napoleonNorthRouteIds[5]),
      { ...complete(napoleonNorthRouteIds[0]), metrics: { source: "manual" as const, completedRoute: false } },
      { ...complete(napoleonNorthRouteIds[1]), metrics: { source: "manual" as const, completedRoute: true, segmentAttackIndex: 0 } }];
    expect(campaignBonusXp(sessions)).toBe(900);
    expect(campaignProgress(north, sessions).completedStages).toBe(1);
    expect(campaignProgress(north, sessions).nextRouteId).toBe(napoleonNorthRouteIds[0]);
    expect(discoveryBadges(sessions).find((badge) => badge.id === "napoleon-three")?.unlocked).toBe(true);
    expect(discoveryBadges(sessions).find((badge) => badge.id === "napoleon-fourteen")?.progress).toBe("9/14");
    expect(discoveryBadges(sessions).find((badge) => badge.id === "napoleon-north-three")?.progress).toBe("1/3");
  });

  it("awards each carnet once, recalculates deletion and restores the same rewards after reimport", () => {
    const state = emptyState(); state.sessions = [...napoleonRouteIds, ...napoleonNorthRouteIds].map(complete);
    expect(campaignBonusXp(state.sessions)).toBe(1600);
    expect(badges(state).find((badge) => badge.id === "napoleon-fourteen")?.unlocked).toBe(true);
    state.sessions.push({ ...complete(napoleonNorthRouteIds[5]), id: "repeat" });
    expect(campaignBonusXp(state.sessions)).toBe(1600);
    state.sessions = state.sessions.filter((session) => session.id !== "repeat");
    expect(campaignBonusXp(state.sessions)).toBe(1600);
    state.sessions = state.sessions.filter((session) => session.routeId !== napoleonNorthRouteIds[5]);
    expect(campaignBonusXp(state.sessions)).toBe(900);
    expect(badges(state).find((badge) => badge.id === "campaign-napoleon-dauphine")?.progress).toBe("5/6");
    expect(badges(state).find((badge) => badge.id === "napoleon-fourteen")?.progress).toBe("13/14");
    state.sessions.push(complete(napoleonNorthRouteIds[5]));
    expect(campaignBonusXp(JSON.parse(JSON.stringify(state)).sessions)).toBe(1600);
    expect(discoveryBadges([complete("gpx-napoleon-gap-fare")]).find((badge) => badge.id === "napoleon-north-three")?.progress).toBe("0/3");
  });

  it("selects the named GPX track without reading unrelated alternatives, and refuses a changed source", () => {
    const dir = mkdtempSync(join(tmpdir(), "veloquest-track-"));
    try {
      mkdirSync(join(dir, ".cache/scenic-profiles"), { recursive: true });
      writeFileSync(join(dir, ".cache/scenic-profiles/fixture.gpx"), '<gpx><trk><name>alternative</name><trkseg><trkpt lat="48" lon="2"/></trkseg></trk><trk><name>selected</name><trkseg><trkpt lat="45" lon="6"><ele>300</ele></trkpt><trkpt lat="45.004" lon="6"><ele>340</ele></trkpt><trkpt lat="45.008" lon="6"><ele>320</ele></trkpt></trkseg></trk></gpx>');
      const source = { fixture: { key: "fixture", gpxUrl: "https://example.invalid/unneeded-cached.gpx", trackOnly: true, trackName: "selected", places: [] } };
      const run = () => spawnSync("python3", [resolve("scripts/build-exploration-profiles.py"), "--sources", "sources.json", "--output", "out.json"], { cwd: dir, encoding: "utf8" });
      writeFileSync(join(dir, "sources.json"), JSON.stringify(source));
      expect(run().status).toBe(0);
      const result = JSON.parse(readFileSync(join(dir, "out.json"), "utf8")).fixture;
      expect(result.coordinates[0]).toEqual([45, 6]);
      expect(result.coordinates.at(-1)).toEqual([45.008, 6]);
      expect(result.distanceKm).toBeCloseTo(0.88956, 4);
      source.fixture.trackName = "missing"; writeFileSync(join(dir, "sources.json"), JSON.stringify(source));
      expect(run().stderr).toContain("expected one named track");
      source.fixture.trackName = "selected";
      writeFileSync(join(dir, "sources.json"), JSON.stringify({ fixture: { ...source.fixture, gpxSha256: "0".repeat(64) } }));
      expect(run().stderr).toContain("published GPX changed");
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
