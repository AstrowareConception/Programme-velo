import { describe, expect, it } from "vitest";
import { captureSplits, checkpointKilometers, formatRaceTime, ghostDeltaSeconds, ghostDistanceAtElapsed, personalBest } from "../lib/time-attack";
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
});
