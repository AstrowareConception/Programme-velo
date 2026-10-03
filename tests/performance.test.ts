import { describe, expect, it } from "vitest";
import { analyzeRouteSectors, bestPowerForWindow, compareSectorTimes, performanceRecords } from "../lib/performance";
import { climbs } from "../lib/routes";
import type { CompletedSession } from "../lib/types";

const route = climbs.find((item) => item.id === "alpe-dhuez")!;

function session(): CompletedSession {
  const distanceStart = 40;
  const totalSeconds = 1200;
  const samples = Array.from({ length: 121 }, (_, i) => ({
    t: i * 10_000,
    distanceKm: distanceStart + route.distanceKm * (i / 120),
    powerW: 180 + Math.floor(i / 30) * 10,
    cadenceRpm: 80 + Math.floor(i / 30),
    heartRate: 130 + Math.floor(i / 30) * 5,
    speedKmh: 22
  }));

  return {
    id:"s1",
    templateId:"climb-alpe-dhuez",
    routeId:route.id,
    date:"2026-10-01T10:00:00.000Z",
    duration:20,
    points:5,
    xp:300,
    intensity:"hard",
    kind:"hills",
    bonus:false,
    metrics:{
      source:"ftms",
      timeAttack:true,
      elapsedSeconds:totalSeconds,
      checkpointSplits:[
        { km:route.distanceKm*.25, elapsedSeconds:310 },
        { km:route.distanceKm*.5, elapsedSeconds:620 },
        { km:route.distanceKm*.75, elapsedSeconds:920 },
        { km:route.distanceKm, elapsedSeconds:1200 }
      ],
      distanceKm:route.distanceKm,
      avgPowerW:195,
      maxCadenceRpm:90,
      samples
    }
  };
}

describe("performance analysis", () => {
  it("builds four route sectors with split durations", () => {
    const sectors=analyzeRouteSectors(session(),route);
    expect(sectors).toHaveLength(4);
    expect(sectors.map((s) => s.durationSeconds)).toEqual([310,310,300,280]);
    expect(sectors[0].avgPowerW).toBeDefined();
    expect(sectors[3].avgPowerW).toBeGreaterThan(sectors[0].avgPowerW!);
  });

  it("compares sectors to a reference", () => {
    const current=analyzeRouteSectors(session(),route);
    const reference=current.map((sector) => ({...sector,durationSeconds:(sector.durationSeconds??0)-5}));
    const compared=compareSectorTimes(current,reference);
    expect(compared.every((sector) => sector.deltaSeconds===5)).toBe(true);
  });

  it("finds window power records", () => {
    const best=bestPowerForWindow([session()],300);
    expect(best).toBeDefined();
    expect(best!.watts).toBeGreaterThan(180);
  });

  it("summarizes global performance records", () => {
    const records=performanceRecords([session()]);
    expect(records.totalDistanceKm).toBeCloseTo(route.distanceKm,2);
    expect(records.longestRideMinutes).toBe(20);
    expect(records.bestAveragePowerW).toBe(195);
    expect(records.maxCadenceRpm).toBe(90);
  });
});
