import { describe, expect, it, vi, afterEach } from "vitest";
import { emptyState, STORAGE_KEY } from "../lib/data";
import { cloudData, decodeData, mergeData, canonical } from "../lib/cloud/model";
import { accept, propose, type RemoteStore } from "../lib/cloud/engine";
import { CLOUD_LINK_KEY, installCloud, recoverCloudApply } from "../lib/cloud/local";
const data = () => cloudData(emptyState(), []);
const session = (id: string, points = .5) => ({ id, templateId: "short-loosen-10", date: "2026-10-08T16:00:00Z", duration: 10, points, xp: 15, intensity: "easy" as const, kind: "recovery" as const, bonus: false });
afterEach(() => vi.unstubAllGlobals());
describe("cloud merge", () => {
  it("unions independent offline sessions without changing old rewards", () => {
    const b = data(), l = data(), r = data(); b.state.sessions = [session("old", 0)]; l.state.sessions = [...b.state.sessions, session("tablet")]; r.state.sessions = [...b.state.sessions, session("phone", 2)];
    const merged = mergeData(b, l, r); expect(merged.conflicts).toEqual([]); expect(merged.data.state.sessions.map(s => [s.id, s.points])).toEqual([["old", 0], ["phone", 2], ["tablet", .5]]);
  });
  it("does not resurrect a deletion from an old offline device", () => {
    const b = data(); b.state.sessions = [session("deleted")]; const l = structuredClone(b), r = data();
    expect(mergeData(b, l, r).data.state.sessions).toEqual([]);
  });
  it("requires a choice for edit-versus-delete and preserves independent additions", () => {
    const b = data(); b.state.sessions = [session("s")]; const l = structuredClone(b); l.state.sessions[0].points = 1; const r = data(); r.state.sessions = [session("new")];
    const proposal = mergeData(b, l, r); expect(proposal.conflicts.map(c => c.path)).toEqual(["state.sessions[s]"]);
    expect(mergeData(b, l, r, { "state.sessions[s]": "remote" }).data.state.sessions.map(s => s.id)).toEqual(["new"]);
    expect(mergeData(b, l, r, { "state.sessions[s]": "local" }).data.state.sessions).toContainEqual(l.state.sessions[0]);
  });
  it("combines profile fields and requires a choice for a double edit", () => {
    const b = data(), l = data(), r = data(); l.state.profile.name = "Tablet"; r.state.profile.targetWeight = 90;
    expect(mergeData(b, l, r).data.state.profile).toMatchObject({ name: "Tablet", targetWeight: 90 });
    r.state.profile.name = "Phone"; expect(mergeData(b, l, r).conflicts.map(c => c.path)).toContain("state.profile.name");
  });
  it("keeps device preferences out of the cloud and rejects corrupt identifiers", () => {
    expect(data().state).not.toHaveProperty("preferences"); const b = data(); b.state.sessions = [session("x"), session("x")];
    expect(() => decodeData(JSON.stringify(b))).toThrow(/Identifiants/);
  });
  it("merges plans by week, habits by date and favorite removals without duplication", () => {
    const b = data(), l = data(), r = data(); b.state.favoriteRouteIds = ["old"]; l.state.favoriteRouteIds = []; r.state.favoriteRouteIds = ["old", "new"];
    l.state.habits = [{ date: "2026-10-08", walk: 10, strength: 0, balancedMeal: true, rest: false }]; r.state.habits = [{ date: "2026-10-09", walk: 20, strength: 0, balancedMeal: false, rest: false }];
    const merged = mergeData(b, l, r); expect(merged.data.state.favoriteRouteIds).toEqual(["new"]); expect(merged.data.state.habits).toHaveLength(2);
  });
});
describe("cloud transaction orchestration", () => {
  function remote(initial = data()) {
    const versions = new Map([["first", initial]]); let head = "first";
    const store: RemoteStore = { uid: "u", head: async () => head, read: async id => structuredClone(versions.get(id)!), commit: vi.fn(async (expected, next, before) => { if (head !== expected) throw new Error("concurrent"); if (before) versions.set("archive", before); head = "second"; versions.set(head, next); return head; }) };
    return { store, versions, advance: () => { head = "other"; } };
  }
  it("refuses stale confirmation before writing", async () => {
    const { store } = remote(); const local = data(), p = await propose(store, local, "first"); const changed = data(); changed.state.sessions.push(session("new"));
    await expect(accept(store, p, {}, () => changed, vi.fn())).rejects.toThrow(/changé/); expect(store.commit).not.toHaveBeenCalled();
  });
  it("preserves the local version before restoration and installs only after acknowledgment", async () => {
    const current = data(); current.state.sessions.push(session("s")); const { store, versions } = remote(data()); const p = await propose(store, current, "first", "first"); const install = vi.fn();
    await accept(store, p, {}, () => current, install); expect(versions.get("archive")).toEqual(current); expect(install).toHaveBeenCalledWith(data(), "second");
  });
  it("does not install after a session starts while upload is pending", async () => {
    const { store } = remote(); const local = data(); local.state.sessions.push(session("s")); const p = await propose(store, local, "first"); const install = vi.fn(); let checks = 0;
    await expect(accept(store, p, {}, () => ++checks === 1 ? local : null, install)).rejects.toThrow(/changé/); expect(install).not.toHaveBeenCalled();
  });
  it("does not write another revision for unchanged data", async () => {
    const { store } = remote(); const local = data(); await accept(store, await propose(store, local, "first"), {}, () => local, vi.fn()); expect(store.commit).not.toHaveBeenCalled();
  });
});
describe("atomic local install", () => {
  it("leaves all live data untouched if staging fails", () => {
    const setItem = vi.fn(() => { throw new Error("quota"); }); vi.stubGlobal("localStorage", { getItem: () => null, setItem });
    expect(() => installCloud(data(), { uid: "u", revision: "r" })).toThrow(); expect(setItem.mock.calls).toHaveLength(1);
  });
  it("recovers a partially applied journal and preserves local preferences", () => {
    const map = new Map<string, string>(); const state = emptyState(); state.preferences = { ...state.preferences!, cadenceOffset: -25 };
    map.set(STORAGE_KEY, JSON.stringify(state)); let fail = true;
    vi.stubGlobal("localStorage", { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { if (k === CLOUD_LINK_KEY && fail) throw new Error("quota"); map.set(k, v); }, removeItem: (k: string) => map.delete(k) });
    const next = data(); next.state.sessions.push(session("s")); expect(() => installCloud(next, { uid: "u", revision: "r" })).toThrow(); fail = false; recoverCloudApply();
    expect(JSON.parse(map.get(STORAGE_KEY)!).preferences.cadenceOffset).toBe(-25); expect(JSON.parse(map.get(STORAGE_KEY)!).sessions[0].id).toBe("s"); expect(JSON.parse(map.get(CLOUD_LINK_KEY)!)).toEqual({ uid: "u", revision: "r" }); expect(map.has("veloquest:cloud-apply:v1")).toBe(false);
  });
});
it("retains a deletion made during an upload when recovering the acknowledged version", async () => {
  const original = data(); original.state.sessions.push(session("new"));
  const now = data(); // The user deleted the just-sent session while the request was in flight.
  const head = structuredClone(original); head.state.sessions.push(session("other-device"));
  const store: RemoteStore = { uid: "u", head: async () => "ack", read: async () => head, commit: vi.fn() };
  const proposal = await propose(store, now, null, undefined, original);
  expect(proposal.data.state.sessions.map(s => s.id)).toEqual(["other-device"]);
});
it("does not create an archive when merely receiving an already-backed-up remote addition", async () => {
  const base = data(), updated = data(); updated.state.sessions.push(session("remote"));
  const store: RemoteStore = { uid: "u", head: async () => "new", read: async id => id === "old" ? base : updated, commit: vi.fn() };
  const proposal = await propose(store, base, "old"), install = vi.fn(); await accept(store, proposal, {}, () => base, install);
  expect(store.commit).not.toHaveBeenCalled(); expect(install).toHaveBeenCalledWith(updated, "new");
});
it("does not send anything when the durable outbox cannot be written", async () => {
  const local = data(); local.state.sessions.push(session("s"));
  const store: RemoteStore = { uid: "u", head: async () => null, read: vi.fn(), commit: vi.fn() };
  await expect(accept(store, await propose(store, local, null), {}, () => local, vi.fn(), () => { throw new Error("disk full"); })).rejects.toThrow("disk full");
  expect(store.commit).not.toHaveBeenCalled();
});
