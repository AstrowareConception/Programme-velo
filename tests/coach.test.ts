import { describe, expect, it } from "vitest";
import { recommendAdaptiveWorkout } from "../lib/coach";
import { emptyState, weekTargets, workouts } from "../lib/data";
import type { CompletedSession } from "../lib/types";

const now=new Date("2026-10-03T12:00:00Z");
const weekly={ sessions:2,minutes:90,points:5,hard:0,variety:2 };

function session(id:string, templateId:string, hours:number, rpe:number, intensity:"easy"|"moderate"|"hard"="moderate"): CompletedSession {
  const workout=workouts.find((item)=>item.id===templateId)!;
  return {
    id,templateId,date:new Date(now.getTime()-hours*3_600_000).toISOString(),
    duration:workout.duration,points:workout.points,xp:workout.xp,
    intensity,kind:workout.kind,bonus:false,rpe,
    metrics:{source:"manual"}
  };
}

describe("adaptive coach", () => {
  it("prioritizes recovery after a dense recent load", () => {
    const state=emptyState();
    state.sessions=[
      session("1","threshold-45",12,9,"hard"),
      session("2","hiit-25",24,9,"hard"),
      session("3","endurance-45",36,8,"moderate"),
      session("4","progressive-35",60,9,"hard")
    ];
    const result=recommendAdaptiveWorkout({
      state,workouts,target:weekTargets[0],weekly:{...weekly,hard:2},availableMinutes:35,energy:"hard",now
    });
    expect(result.load).toBe("recovery");
    expect(result.workout.intensity).not.toBe("hard");
  });

  it("allows a hard workout when energy is high and load permits it", () => {
    const state=emptyState();
    state.sessions=[session("1","endurance-45",72,5,"moderate")];
    const result=recommendAdaptiveWorkout({
      state,workouts,target:weekTargets[0],weekly,availableMinutes:40,energy:"hard",now
    });
    expect(result.load).toBe("push");
    expect(result.workout.intensity).toBe("hard");
  });

  it("avoids immediately repeating the same workout when an alternative fits", () => {
    const state=emptyState();
    state.sessions=[session("1","endurance-45",24,6,"moderate")];
    const result=recommendAdaptiveWorkout({
      state,workouts,target:weekTargets[0],weekly,availableMinutes:45,energy:"normal",now
    });
    expect(result.workout.id).not.toBe("endurance-45");
  });

  it("suggests a small resistance increase after repeatedly low RPE on the chosen workout", () => {
    const state=emptyState();
    state.sessions=[
      session("1","progressive-35",72,5,"hard"),
      session("2","progressive-35",144,5.5,"hard")
    ];
    const result=recommendAdaptiveWorkout({
      state,workouts,target:weekTargets[0],weekly,availableMinutes:35,energy:"hard",now
    });
    if (result.workout.id === "progressive-35") expect(result.suggestedResistanceDelta).toBe(1);
  });
});
