import { describe, expect, it } from "vitest";
import { challengesForRoute, evaluateRouteChallenge, routeChallenges } from "../lib/challenges";
import { climbs } from "../lib/routes";

const route = climbs.find((item) => item.id === "alpe-dhuez")!;
const stage = climbs.find((item) => item.id === "chaussy-madeleine-stage")!;

describe("route challenges", () => {
  it("hides PB and stage-only challenges when not applicable", () => {
    const ids = challengesForRoute(route, false).map((challenge) => challenge.id);
    expect(ids).not.toContain("beat-pb");
    expect(ids).not.toContain("stage-finish");
    expect(challengesForRoute(stage, false).map((challenge) => challenge.id)).toContain("stage-finish");
    expect(challengesForRoute(route, true).map((challenge) => challenge.id)).toContain("beat-pb");
  });

  it("evaluates no-pause challenge", () => {
    const challenge = routeChallenges.find((item) => item.id === "no-pause")!;
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:0 }).success).toBe(true);
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:1 }).success).toBe(false);
  });

  it("evaluates cadence challenge with manual or FTMS average", () => {
    const challenge = routeChallenges.find((item) => item.id === "cadence-80")!;
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:0, avgCadenceRpm:82 }).success).toBe(true);
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:0, avgCadenceRpm:77 }).success).toBe(false);
  });

  it("evaluates negative split and final-quarter attacks", () => {
    const splits = [
      { km: route.distanceKm * .25, elapsedSeconds:300 },
      { km: route.distanceKm * .5, elapsedSeconds:620 },
      { km: route.distanceKm * .75, elapsedSeconds:900 },
      { km: route.distanceKm, elapsedSeconds:1150 }
    ];
    const negative = routeChallenges.find((item) => item.id === "negative-split")!;
    const finisher = routeChallenges.find((item) => item.id === "final-quarter")!;
    const context = { route, completedRoute:true, pauseCount:0, elapsedSeconds:1150, checkpointSplits:splits };
    expect(evaluateRouteChallenge(negative, context).success).toBe(true);
    expect(evaluateRouteChallenge(finisher, context).success).toBe(true);
  });

  it("evaluates personal-best challenge", () => {
    const challenge = routeChallenges.find((item) => item.id === "beat-pb")!;
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:0, elapsedSeconds:999, pbBeforeSeconds:1000 }).success).toBe(true);
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:true, pauseCount:0, elapsedSeconds:1001, pbBeforeSeconds:1000 }).success).toBe(false);
  });

  it("never succeeds if the route was not completed", () => {
    const challenge = routeChallenges.find((item) => item.id === "no-pause")!;
    expect(evaluateRouteChallenge(challenge, { route, completedRoute:false, pauseCount:0 }).success).toBe(false);
  });
});
