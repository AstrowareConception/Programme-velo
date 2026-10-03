import { describe, expect, it } from "vitest";
import {
  climbs,
  remainingRouteStats,
  resistanceForGrade,
  routeCategory,
  routeDifficulty,
  routeSearchText,
  routeTerrain
} from "../lib/routes";

describe("resistanceForGrade", () => {
  it("makes descents easy and steep climbs hard", () => {
    expect(resistanceForGrade(-6)).toBe(5);
    expect(resistanceForGrade(0)).toBe(8);
    expect(resistanceForGrade(4)).toBe(15);
    expect(resistanceForGrade(8)).toBe(23);
    expect(resistanceForGrade(13)).toBe(29);
  });

  it("is monotonic across representative grades", () => {
    const grades = [-8,-4,-1,1,3,5,6,8,9,11,14];
    const levels = grades.map(resistanceForGrade);
    for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
  });
});

describe("route library", () => {
  it("contains a balanced mix of climbs and multi-profile stages", () => {
    expect(climbs.length).toBeGreaterThanOrEqual(13);
    expect(climbs.some((route) => routeCategory(route) === "stage")).toBe(true);
    expect(climbs.filter((route) => routeDifficulty(route) === 2).length).toBeGreaterThanOrEqual(3);
    expect(climbs.filter((route) => routeDifficulty(route) === 3).length).toBeGreaterThanOrEqual(2);
  });

  it("offers easier stages with both climbing and descending terrain", () => {
    const easierStages = climbs.filter((route) => routeCategory(route) === "stage" && routeDifficulty(route) <= 3);
    expect(easierStages.length).toBeGreaterThanOrEqual(5);
    easierStages.forEach((route) => {
      const terrain = routeTerrain(route);
      expect(terrain.ascentKm).toBeGreaterThan(0);
      expect(terrain.descentKm).toBeGreaterThan(0);
    });
  });

  it("keeps difficulty in the 1..5 range", () => {
    climbs.forEach((route) => {
      expect(routeDifficulty(route)).toBeGreaterThanOrEqual(1);
      expect(routeDifficulty(route)).toBeLessThanOrEqual(5);
    });
  });

  it("computes ascent/descent terrain coherently", () => {
    const stage = climbs.find((route) => route.id === "chaussy-madeleine-stage");
    expect(stage).toBeDefined();
    const terrain = routeTerrain(stage!);
    expect(terrain.ascentKm).toBeGreaterThan(20);
    expect(terrain.descentKm).toBeGreaterThan(15);
    expect(terrain.ascentKm + terrain.descentKm + terrain.flatKm).toBeCloseTo(stage!.distanceKm, 1);
    expect(terrain.minGrade).toBeLessThan(0);
  });

  it("computes remaining distance and elevation gain", () => {
    const galibier = climbs.find((route) => route.id === "galibier-valloire")!;
    const start = remainingRouteStats(galibier, 0);
    const late = remainingRouteStats(galibier, 15);
    expect(start.distanceKm).toBeCloseTo(17, 2);
    expect(start.elevationGainM).toBeGreaterThan(1100);
    expect(late.distanceKm).toBeCloseTo(2, 2);
    expect(late.elevationGainM).toBeLessThan(start.elevationGainM);
  });

  it("indexes names, regions and tags for search", () => {
    const madeleine = climbs.find((route) => route.id === "madeleine-maurienne")!;
    const searchable = routeSearchText(madeleine);
    expect(searchable).toContain("madeleine");
    expect(searchable).toContain("maurienne");
    expect(searchable).toContain("tour de france");
  });
});
