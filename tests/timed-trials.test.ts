import { describe, expect, it } from "vitest";
import { bestTrial, declareTrial, sampleTrial, startTrial, stopTrial, tickTrial, timedTrials, trialSession } from "../lib/timed-trials";
import { createBackup, parseBackup } from "../lib/storage";
import { emptyState } from "../lib/data";
const minute = timedTrials[0], km = timedTrials[3];
describe("flying start and measured timing", () => {
 it("excludes countdown metres, starts on first actual packet, interpolates the finish", () => {
  let run = startTrial(km, 0, "ftms", "Bike");
  run = sampleTrial(run, 400, 4000);
  expect(run.distanceM).toBe(0);
  run = sampleTrial(run, 500, 5200);
  expect(run.start).toBe(5200);
  for (let i = 1; i <= 9; i++) run = sampleTrial(run, 500 + i * 100, 5200 + i * 1000);
  run = sampleTrial(run, 1600, 15200);
  expect(run).toMatchObject({ distanceM: 1000, elapsedSeconds: 9.5, eligible: true, completed: true, phase: "review" });
  expect(sampleTrial(run, 9000, 18000)).toEqual(run);
 });
 it("ends a time trial at the deadline and never adds post-deadline metres", () => {
  let run = sampleTrial(startTrial(minute, 0, "ftms", "Bike"), 100, 5000);
  for (let i = 1; i < 60; i++) run = sampleTrial(run, 100 + i * 5, 5000 + i * 1000);
  const result = sampleTrial(run, 10000, 65050);
  expect(result).toMatchObject({ distanceM: 295, elapsedSeconds: 60, completed: true, eligible: true });
 });
 it("rejects missing departure, resets, gaps, stale endpoints and stopped events", () => {
  expect(tickTrial(startTrial(km, 0, "ftms"), 11000).eligible).toBe(false);
  let run = sampleTrial(startTrial(minute, 0, "ftms"), 100, 5000);
  expect(sampleTrial(run, 99, 6000).phase).toBe("review");
  expect(sampleTrial(run, 1000, 12000)).toMatchObject({ phase:"review", eligible:false });
  for (let i = 1; i < 57; i++) run = sampleTrial(run, 100 + i * 5, 5000 + i * 1000);
  expect(tickTrial(run, 65000)).toMatchObject({ completed:true, eligible:false });
  expect(stopTrial(run).eligible).toBe(false);
 });
});
describe("declared attempts and durable history", () => {
 it("keeps a continuous manual clock and gives no record for an early stop", () => {
  let run = tickTrial(startTrial(minute, 0, "manual"), 5000);
  expect(run).toMatchObject({ phase:"running", elapsedSeconds:0 });
  run = tickTrial(run, 65000);
  const result = declareTrial(run, 450);
  expect(result).toMatchObject({source:"manual",distanceM:450,eligible:true,elapsedSeconds:60});
  expect(declareTrial(stopTrial(run), 450).eligible).toBe(false);
  expect(declareTrial(run, NaN).eligible).toBe(false);
  expect(declareTrial(run, 0).eligible).toBe(false);
 });
 it("keeps devices and manual records separate and round-trips a v3 backup", () => {
  const run = tickTrial(startTrial(minute, 0, "manual"), 65000);
  const result = declareTrial(run, 500);
  const session = trialSession(run, result);
  const state = {...emptyState(), sessions:[session]};
  expect(bestTrial(state.sessions, minute.id, "manual")?.distanceM).toBe(500);
  expect(bestTrial(state.sessions, minute.id, "ftms", "Bike")).toBeUndefined();
  const measured = {...session, metrics:{...session.metrics!,timedTrial:{...result,source:"ftms" as const, deviceName:"Bike"}}};
  expect(bestTrial([measured], minute.id, "ftms", "Other")).toBeUndefined();
  expect(parseBackup(JSON.stringify(createBackup(state, []))).state.sessions).toEqual(state.sessions);
  expect(bestTrial([], minute.id, "manual")).toBeUndefined();
 });
 it("compares distance events by lower time", () => {
  const run = {...tickTrial(startTrial(km, 0, "manual"), 15000), phase:"review" as const, completed:true};
  const fast = trialSession(run, declareTrial(run, 1000));
  const slow = trialSession({...run, elapsedSeconds:20}, declareTrial({...run, elapsedSeconds:20}, 1000));
  expect(bestTrial([slow,fast], km.id, "manual")?.elapsedSeconds).toBe(10);
 });
});
