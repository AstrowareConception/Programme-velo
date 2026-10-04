import { describe, expect, it } from "vitest";
import { badges, emptyState, totalXp } from "../lib/data";
import { parseBackup } from "../lib/storage";
import type { CompletedSession } from "../lib/types";
import { campaignBonusXp, campaignProgress, campaigns, completedRouteIds } from "../lib/campaigns";

function session(routeId:string, overrides:Partial<CompletedSession>={}):CompletedSession {
  return {
    id:routeId+Math.random(),
    templateId:"climb-"+routeId,
    routeId,
    date:new Date().toISOString(),
    duration:60,
    points:3,
    xp:100,
    intensity:"moderate",
    kind:"hills",
    bonus:false,
    metrics:{ source:"manual", completedRoute:true },
    ...overrides
  };
}

describe("campaigns",()=>{
  it("starts the discovery campaign on the easiest route",()=>{
    const campaign=campaigns.find(c=>c.id==="provence-discovery")!;
    const progress=campaignProgress(campaign,[]);
    expect(progress.completedStages).toBe(0);
    expect(progress.nextRouteId).toBe("sorgue-velleron-loop");
    expect(progress.percent).toBe(0);
    expect(progress.complete).toBe(false);
  });

  it("advances to the next incomplete ordered stage",()=>{
    const campaign=campaigns.find(c=>c.id==="provence-discovery")!;
    const sessions=[
      session("sorgue-velleron-loop"),
      session("vaison-medieval-loop")
    ];
    const progress=campaignProgress(campaign,sessions);
    expect(progress.completedStages).toBe(2);
    expect(progress.nextRouteId).toBe("uchaux-loop");
    expect(progress.percent).toBe(50);
  });

  it("unlocks campaign completion and campaign XP",()=>{
    const campaign=campaigns.find(c=>c.id==="provence-discovery")!;
    const sessions=campaign.routeIds.map((routeId)=>session(routeId));
    expect(campaignProgress(campaign,sessions).complete).toBe(true);
    expect(campaignBonusXp(sessions)).toBeGreaterThanOrEqual(campaign.xpBonus);
  });

  it("does not count Segment Attacks as completed campaign stages",()=>{
    const segment=session("sorgue-velleron-loop",{
      metrics:{ source:"manual", completedRoute:false, segmentAttackIndex:0, elapsedSeconds:300 }
    });
    const completed=completedRouteIds([segment]);
    expect(completed.has("sorgue-velleron-loop")).toBe(false);
  });
});


it("tracks the actual completed routes out of order", () => {
  const campaign = campaigns[0];
  const progress = campaignProgress(campaign, [session(campaign.routeIds[2])]);
  expect(progress.completedStages).toBe(1);
  expect(progress.completedRouteIds.has(campaign.routeIds[0])).toBe(false);
  expect(progress.completedRouteIds.has(campaign.routeIds[2])).toBe(true);
  expect(progress.nextRouteId).toBe(campaign.routeIds[0]);
});

it("excludes incomplete attempts and even malformed completed Segment Attacks", () => {
  const routeId = campaigns[0].routeIds[0];
  expect(completedRouteIds([
    session(routeId, { metrics: { source: "manual", completedRoute: false } }),
    session(routeId, { metrics: { source: "manual", completedRoute: true, segmentAttackIndex: 0 } })
  ]).size).toBe(0);
});

it("awards one campaign bonus and badge, recalculated after deletion and legacy import", () => {
  const campaign = campaigns[0];
  const state = emptyState();
  state.sessions = campaign.routeIds.map((routeId) => session(routeId));
  const xp = totalXp(state);
  expect(campaignBonusXp(state.sessions)).toBe(500);
  expect(badges(state).find((b) => b.id === `campaign-${campaign.id}`)?.unlocked).toBe(true);
  state.sessions.push(session(campaign.routeIds[0]));
  expect(campaignBonusXp(state.sessions)).toBe(500);
  expect(totalXp(state)).toBe(xp + 100);
  state.sessions = state.sessions.filter((s) => s.routeId !== campaign.routeIds[2]);
  expect(campaignBonusXp(state.sessions)).toBe(0);
  expect(badges(state).find((b) => b.id === `campaign-${campaign.id}`)?.unlocked).toBe(false);
  const legacy = campaign.routeIds.map((routeId) => session(routeId, { metrics: undefined }));
  const imported = parseBackup(JSON.stringify({ ...state, sessions: legacy })).state;
  expect(campaignProgress(campaign, imported.sessions).complete).toBe(true);
});
