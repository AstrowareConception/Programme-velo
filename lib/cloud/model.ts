import { normalizeState, parseBackup } from "../storage";
import type { AppState } from "../types";
import type { ClimbChallenge } from "../routes";

export type CloudData = { state: Omit<AppState, "preferences">; customClimbs: ClimbChallenge[] };
export type Conflict = { path: string; local: unknown; remote: unknown };
export type Choices = Record<string, "local" | "remote">;
export function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const fields = Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",");
    return `{${fields}}`;
  }
  return JSON.stringify(value);
}
export function cloudData(state: AppState, customClimbs: ClimbChallenge[]): CloudData {
  const { preferences: _preferences, ...shared } = normalizeState(state);
  return JSON.parse(JSON.stringify({ state: shared, customClimbs }));
}
export function decodeData(text: string): CloudData {
  const raw = JSON.parse(text);
  if (!raw || !raw.state || !Array.isArray(raw.state.sessions) || !Array.isArray(raw.state.measurements) || !Array.isArray(raw.customClimbs)) throw new Error("Sauvegarde cloud incomplète.");
  for (const rows of [raw.state.sessions, raw.state.measurements, raw.customClimbs]) {
    if (rows.some((x: any) => !x || typeof x.id !== "string" || !x.id) || new Set(rows.map((x: any) => x.id)).size !== rows.length) throw new Error("Identifiants de sauvegarde invalides.");
  }
  const parsed = parseBackup(JSON.stringify({ format: "veloquest-backup-v3", ...raw }));
  return cloudData(parsed.state, parsed.customClimbs);
}
const keyed: Record<string, string> = { "state.sessions": "id", "state.measurements": "id", customClimbs: "id", "state.programPlans": "week", "state.weeklyGoals": "week", "state.habits": "date", "state.journeys": "id" };
export function mergeData(base: CloudData | null, local: CloudData, remote: CloudData, choices: Choices = {}) {
  const conflicts: Conflict[] = [];
  const eq = (a: unknown, b: unknown) => canonical(a) === canonical(b);
  const cycleKeys = ['programTimeline', 'program', 'programPlans', 'weeklyGoals'];
  const context = (state: any) => state && Object.fromEntries(cycleKeys.map(k => [k, state[k]]));
  function atomic(b: any, l: any, r: any, path: string) {
    if (eq(l, r)) return l;
    if (base && eq(l, b)) return r;
    if (base && eq(r, b)) return l;
    if (!base && l === undefined) return r;
    if (!base && r === undefined) return l;
    if (!choices[path]) conflicts.push({ path, local: l, remote: r });
    return choices[path] === 'remote' ? r : l;
  }
  function merge(b: any, l: any, r: any, path: string): any {
    if (eq(l, r)) return l;
    if (base && eq(l, b)) return r;
    if (base && eq(r, b)) return l;
    // A changed cycle and its week targets/plans travel together. Never mix two calendars.
    if (path === 'state' && l && r && !eq(l.programTimeline, r.programTimeline)) {
      const chosen = atomic(context(b), context(l), context(r), 'state.programTimeline');
      const keys = [...new Set([...Object.keys(b ?? {}), ...Object.keys(l), ...Object.keys(r)])].filter(k => !cycleKeys.includes(k));
      return { ...Object.fromEntries(keys.map(k => [k, merge(b?.[k], l[k], r[k], `state.${k}`)]).filter(([, v]) => v !== undefined)), ...chosen };
    }
    if (keyed[path]) {
      const key = keyed[path];
      const map = (rows: any[] = []) => new Map(rows.map(x => [String(x[key]), x]));
      const bm = map(b), lm = map(l), rm = map(r);
      return [...new Set([...bm.keys(), ...lm.keys(), ...rm.keys()])].sort().map(id => merge(bm.get(id), lm.get(id), rm.get(id), `${path}[${id}]`)).filter(x => x !== undefined);
    }
    if (path === "state.favoriteRouteIds") {
      const bs = new Set(b ?? []), ls = new Set(l ?? []), rs = new Set(r ?? []);
      return [...new Set([...ls, ...rs])].filter(x => !base || !bs.has(x) || (ls.has(x) && rs.has(x))).sort();
    }
    // Only merge object fields that exist on both sides; delete-versus-edit is a conflict.
    if (l && r && typeof l === "object" && typeof r === "object" && !Array.isArray(l) && !Array.isArray(r)) {
      return Object.fromEntries([...new Set([...Object.keys(b ?? {}), ...Object.keys(l), ...Object.keys(r)])].sort().map(k => [k, merge(b?.[k], l[k], r[k], path ? `${path}.${k}` : k)]).filter(([, v]) => v !== undefined));
    }
    if (!base && l === undefined) return r;
    if (!base && r === undefined) return l;
    if (!choices[path]) conflicts.push({ path, local: l, remote: r });
    return choices[path] === "remote" ? r : l;
  }
  return { data: merge(base, local, remote, "") as CloudData, conflicts };
}
export function counts(data: CloudData) { return `${data.state.sessions.length} séance(s), ${data.state.measurements.length} mesure(s), ${data.customClimbs.length} parcours personnel(s)`; }
