import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences } from "../lib/data";
import { adjustedResistance, cueSegment, prepareCueAudio, releaseCueAudio, shouldCueSegment, testCueAudio } from "../lib/session-cues";
import { createBackup, normalizeState, parseBackup } from "../lib/storage";

afterEach(() => { releaseCueAudio(); vi.unstubAllGlobals(); });
const segment = { label: "Une ville", minutes: 2, resistance: "8–10", rpe: "3–4", cadence: "80–90" };

describe("reader preferences and honest audio guidance", () => {
  it("keeps old histories and defaults while validating new optional fields", () => {
    const session = { id: "old", templateId: "recovery-30", date: "2026-10-04T18:00:00Z", duration: 30, xp: 35 };
    const state = normalizeState({ profile: { name: "Rider" }, sessions: [session], preferences: { soundCues: false, cueVolume: Infinity, announceUpcoming: "yes", readerView: "fake" } });
    expect(state.sessions).toEqual([session]);
    expect(state.preferences).toMatchObject({ soundCues: false, cueVolume: 65, cueFrequency: "all", announceUpcoming: false, readerView: "full" });
    expect(normalizeState({ preferences: { cueVolume: -4 } }).preferences?.cueVolume).toBe(0);
    expect(normalizeState({ preferences: { cueVolume: 300 } }).preferences?.cueVolume).toBe(100);
  });

  it("round-trips essential view and audio settings through v3 without changing favorites or sessions", () => {
    const state = normalizeState({ favoriteRouteIds: ["ventoux-bedoin"], preferences: { cueVolume: 25, cueFrequency: "changes", announceUpcoming: true, readerView: "essential" } });
    const result = parseBackup(JSON.stringify(createBackup(state, [])));
    expect(result.state).toEqual(state);
  });

  it("suppresses repeated scenery labels, but announces changes to resistance, effort or cadence", () => {
    const prefs = { ...defaultPreferences, cueFrequency: "changes" as const };
    expect(shouldCueSegment(segment, undefined, prefs)).toBe(true);
    expect(shouldCueSegment({ ...segment, label: "Une autre ville" }, segment, prefs)).toBe(false);
    for (const change of [{ resistance: "11" }, { rpe: "4–5" }, { cadence: "libre" }]) expect(shouldCueSegment({ ...segment, ...change }, segment, prefs)).toBe(true);
    expect(shouldCueSegment(segment, segment, defaultPreferences)).toBe(true);
  });

  it("speaks the calibrated level, anticipation and configured volume", () => {
    const speak = vi.fn();
    class Utterance { constructor(public text: string) {} }
    vi.stubGlobal("window", { speechSynthesis: { speak, cancel: vi.fn() }, SpeechSynthesisUtterance: Utterance });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    vi.stubGlobal("navigator", {});
    cueSegment(segment, { ...defaultPreferences, soundCues: false, haptics: false, voiceCues: true, cueVolume: 25, resistanceOffset: 2 }, { upcoming: true });
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0]).toMatchObject({ text: "Dans dix secondes. Une ville. niveau 10–12. Effort 3–4 sur dix.", volume: 0.25, lang: "fr-FR" });
    expect(adjustedResistance("31–32", 4)).toBe("32–32");
    expect(adjustedResistance("libre", 4)).toBe("libre");
  });

  it("does not claim a test was sent when audio is muted, missing or blocked", async () => {
    vi.stubGlobal("window", {});
    expect(await testCueAudio({ ...defaultPreferences, soundCues: false })).toContain("Active les bips ou la voix");
    expect(await testCueAudio({ ...defaultPreferences, cueVolume: 0 })).toContain("à zéro");
    expect(await testCueAudio(defaultPreferences)).toContain("indisponibles");
    class BlockedContext { state = "suspended"; resume = () => Promise.reject(new Error("refused")); close = () => Promise.resolve(); }
    vi.stubGlobal("window", { AudioContext: BlockedContext });
    expect(await prepareCueAudio(defaultPreferences)).toBe(false);
    expect(await testCueAudio(defaultPreferences)).toContain("indisponibles");
  });

  it("reuses one audio context, scales the beep and releases it after the session", async () => {
    const ramp = vi.fn();
    const close = vi.fn(async () => undefined);
    const resume = vi.fn(async () => { player.state = "running"; });
    const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: ramp }, connect: vi.fn(() => ({})), disconnect: vi.fn() };
    const oscillator = () => ({ frequency: { value: 0 }, connect: vi.fn(() => gain), start: vi.fn(), stop: vi.fn(), addEventListener: vi.fn(), disconnect: vi.fn() });
    const player = { state: "suspended", currentTime: 4, destination: {}, createGain: () => gain, createOscillator: oscillator, resume, close };
    const Context = vi.fn(function () { return player; });
    vi.stubGlobal("window", { AudioContext: Context });
    vi.stubGlobal("navigator", {});
    const preferences = { ...defaultPreferences, cueVolume: 25, haptics: false };
    expect(await prepareCueAudio(preferences)).toBe(true);
    cueSegment(segment, preferences);
    cueSegment(segment, preferences);
    expect(Context).toHaveBeenCalledOnce();
    expect(resume).toHaveBeenCalledOnce();
    expect(ramp).toHaveBeenCalledWith(0.03, 4.015);
    expect(close).not.toHaveBeenCalled();
    releaseCueAudio();
    expect(close).toHaveBeenCalledOnce();
  });

  it("does not replay hidden-page cues or speak at zero volume", () => {
    const speak = vi.fn();
    vi.stubGlobal("window", { speechSynthesis: { speak }, SpeechSynthesisUtterance: class {} });
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", { visibilityState: "hidden" });
    cueSegment(segment, { ...defaultPreferences, voiceCues: true, soundCues: false });
    expect(speak).not.toHaveBeenCalled();
    vi.stubGlobal("document", { visibilityState: "visible" });
    cueSegment(segment, { ...defaultPreferences, voiceCues: true, soundCues: false, cueVolume: 0 });
    expect(speak).not.toHaveBeenCalled();
  });
});
