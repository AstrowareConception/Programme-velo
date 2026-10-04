import { describe, expect, it } from "vitest";
import { routePositionAt } from "../lib/route-map-position";
import { scenicRoutes } from "../lib/scenic-routes";

const route = scenicRoutes.find((r) => r.id === "cagnes-cannes-littoral")!;

describe("map progress by distance", () => {
  it("uses physical spacing when GPS points have unequal density", () => {
    const uneven = { ...route, coordinates: [[0, 0], [0, 0.01], [0, 0.03]] as [number, number][], coordinateKm: undefined };
    expect(routePositionAt(uneven, 0.5)[1]).toBeCloseTo(0.015, 6);
  });

  it("puts the rider on Antibes at the exact landmark distance from the source GPX", () => {
    const antibes = route.places!.find((p) => p.label === "Antibes")!;
    const position = routePositionAt(route, antibes.km / route.distanceKm);
    expect(position[0]).toBeCloseTo(43.58407, 6);
    expect(position[1]).toBeCloseTo(7.12391, 6);
    expect(route.coordinateKm).toHaveLength(route.coordinates.length);
    expect(route.coordinateKm?.at(-1)).toBe(route.distanceKm);
  });

  it("keeps endpoints stable for out-of-range progress and a single-point geometry", () => {
    expect(routePositionAt(route, -1)).toEqual(route.coordinates[0]);
    expect(routePositionAt(route, NaN)).toEqual(route.coordinates[0]);
    expect(routePositionAt(route, 2)).toEqual(route.coordinates.at(-1));
    const single = { ...route, coordinates: [[43, 7]] as [number, number][] };
    expect(routePositionAt(single, 0.5)).toEqual([43, 7]);
  });
});
