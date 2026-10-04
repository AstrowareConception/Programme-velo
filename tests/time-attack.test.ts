import { describe, expect, it } from "vitest";
import { captureSplits, checkpointKilometers, formatRaceTime, ghostDeltaSeconds, ghostDistanceAtElapsed, personalBest, segmentAttempts, segmentBounds, segmentPersonalBest } from "../lib/time-attack";
import type { CompletedSession } from "../lib/types";

function attempt(seconds:number): CompletedSession {
  return {
    id:String(seconds), templateId:"climb-x", routeId:"x", date:new Date().toISOString(),
    duration:seconds/60, points:1, xp:1, intensity:"hard", kind:"hills", bonus:false,
    metrics:{ source:"manual", timeAttack:true, elapsedSeconds:seconds }
  };
}

describe("time attack helpers", () => {
  it("formats race time", () => {
    expect(formatRaceTime(65)).toBe("1:05");
    expect(formatRaceTime(3661)).toBe("1:01:01");
  });

  it("finds personal best", () => {
    const best=personalBest([attempt(1000),attempt(900),attempt(950)],"x");
    expect(best?.metrics?.elapsedSeconds).toBe(900);
  });

  it("captures checkpoints once", () => {
    const cps=checkpointKilometers(20);
    const first=captureSplits([],cps,11,500);
    expect(first.map(s=>s.km)).toEqual([5,10]);
    const second=captureSplits(first,cps,16,700);
    expect(second.map(s=>s.km)).toEqual([5,10,15]);
  });

  it("computes ghost delta from PB average pace fallback", () => {
    const best=attempt(1200);
    expect(ghostDeltaSeconds(best,10,20,590)).toBe(-10);
    expect(ghostDistanceAtElapsed(best,600,20)).toBe(10);
  });

  it("uses recorded telemetry for ghost position", () => {
    const best=attempt(1000);
    best.metrics!.samples = [
      { t:1000, distanceKm:50 },
      { t:501000, distanceKm:58 },
      { t:1001000, distanceKm:70 }
    ];
    expect(ghostDistanceAtElapsed(best,500,20)).toBe(8);
  });

  it("computes quarter-sector bounds", () => {
    expect(segmentBounds(40, 0)).toEqual({ startKm:0, endKm:10, distanceKm:10, startRatio:0, endRatio:.25 });
    expect(segmentBounds(40, 2)).toEqual({ startKm:20, endKm:30, distanceKm:10, startRatio:.5, endRatio:.75 });
  });

  it("tracks personal best independently for each Segment Attack sector", () => {
    const s1a=attempt(400); s1a.metrics!.timeAttack=undefined; s1a.metrics!.segmentAttackIndex=0;
    const s1b=attempt(380); s1b.metrics!.timeAttack=undefined; s1b.metrics!.segmentAttackIndex=0;
    const s2=attempt(300); s2.metrics!.timeAttack=undefined; s2.metrics!.segmentAttackIndex=1;
    const sessions=[s1a,s1b,s2];

    expect(segmentAttempts(sessions,"x",0)).toHaveLength(2);
    expect(segmentPersonalBest(sessions,"x",0)?.metrics?.elapsedSeconds).toBe(380);
    expect(segmentPersonalBest(sessions,"x",1)?.metrics?.elapsedSeconds).toBe(300);
  });
});


it("ignores partial route and sector attempts when selecting records", () => {
  const valid = attempt(900); valid.metrics!.completedRoute = true;
  const partial = attempt(20); partial.metrics!.completedRoute = false;
  expect(personalBest([valid, partial], "x")?.metrics?.elapsedSeconds).toBe(900);
  const sector = attempt(300); sector.metrics!.segmentAttackIndex = 0; sector.metrics!.completedSegment = true;
  const unfinished = attempt(10); unfinished.metrics!.segmentAttackIndex = 0; unfinished.metrics!.completedSegment = false;
  expect(segmentPersonalBest([sector, unfinished], "x", 0)?.metrics?.elapsedSeconds).toBe(300);
  expect(personalBest([partial], "x")).toBeUndefined();
});
