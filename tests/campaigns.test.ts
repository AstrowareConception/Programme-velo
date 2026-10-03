import { describe, expect, it } from "vitest";
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
    const sessions=campaign.routeIds.map(session);
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
