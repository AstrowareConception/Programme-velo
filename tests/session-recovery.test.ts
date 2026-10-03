import { describe, expect, it } from "vitest";
import { advanceWorkoutPosition, restoreSessionSnapshot, type ActiveSessionSnapshot } from "../lib/session-recovery";
import { workouts } from "../lib/data";

const workout=workouts.find((item)=>item.id==="progressive-35")!;

function snapshot(overrides:Partial<ActiveSessionSnapshot>={}):ActiveSessionSnapshot {
  return {
    version:1,
    savedAt:1_000_000,
    workoutId:workout.id,
    routeMode:"training",
    segmentIndex:0,
    secondsLeft:300,
    running:true,
    sessionStarted:true,
    showFinish:false,
    timeAttackElapsedSeconds:0,
    timeAttackSplits:[],
    pauseCount:0,
    sessionResistanceDelta:0,
    telemetrySamples:[],
    hadBikeConnection:false,
    ...overrides
  };
}

describe("session recovery",()=>{
  it("advances inside the current segment",()=>{
    const restored=advanceWorkoutPosition(workout,0,300,120);
    expect(restored.segmentIndex).toBe(0);
    expect(restored.secondsLeft).toBe(180);
    expect(restored.completed).toBe(false);
  });

  it("crosses multiple segments after a long suspension",()=>{
    const restored=advanceWorkoutPosition(workout,0,60,360);
    expect(restored.segmentIndex).toBeGreaterThan(1);
    expect(restored.completed).toBe(false);
  });

  it("marks the workout complete if suspension exceeds remaining duration",()=>{
    const restored=advanceWorkoutPosition(workout,workout.segments.length-1,30,120);
    expect(restored.completed).toBe(true);
    expect(restored.secondsLeft).toBe(0);
  });

  it("adds background time to a running Time Attack",()=>{
    const original=snapshot({routeMode:"timeAttack",timeAttackElapsedSeconds:500});
    const restored=restoreSessionSnapshot(original,workout,1_060_000);
    expect(restored.timeAttackElapsedSeconds).toBe(560);
  });

  it("does not advance a paused snapshot",()=>{
    const original=snapshot({running:false,secondsLeft:200});
    const restored=restoreSessionSnapshot(original,workout,2_000_000);
    expect(restored.secondsLeft).toBe(200);
    expect(restored.timeAttackElapsedSeconds).toBe(0);
  });
});
