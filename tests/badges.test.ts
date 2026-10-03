import { describe, expect, it } from "vitest";
import { badges, emptyState } from "../lib/data";
import type { CompletedSession } from "../lib/types";

function challengeSession(id:string, challengeId:string): CompletedSession {
  return {
    id,
    templateId:"climb-alpe-dhuez",
    routeId:"alpe-dhuez",
    date:`2026-01-${String(Number(id)+1).padStart(2,"0")}T10:00:00Z`,
    duration:60,
    points:5,
    xp:360,
    intensity:"hard",
    kind:"hills",
    bonus:false,
    metrics:{
      source:"manual",
      completedRoute:true,
      challenge:{ id:challengeId, success:true, summary:"ok", xpBonus:60 }
    }
  };
}

describe("challenge badges", () => {
  it("unlocks first and variety challenge milestones from successful results", () => {
    const state=emptyState();
    state.sessions=[
      challengeSession("1","no-pause"),
      challengeSession("2","cadence-80"),
      challengeSession("3","negative-split"),
      challengeSession("4","final-quarter"),
      challengeSession("5","no-pause")
    ];
    const byId=new Map(badges(state).map((badge)=>[badge.id,badge]));
    expect(byId.get("challenge1")?.unlocked).toBe(true);
    expect(byId.get("challenge5")?.unlocked).toBe(true);
    expect(byId.get("challenge-variety")?.unlocked).toBe(true);
  });

  it("does not count failed challenges", () => {
    const state=emptyState();
    const failed=challengeSession("1","no-pause");
    failed.metrics!.challenge!.success=false;
    state.sessions=[failed];
    expect(badges(state).find((badge)=>badge.id==="challenge1")?.unlocked).toBe(false);
  });
});
