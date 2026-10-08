import { STORAGE_KEY } from "../data";
import { cloudData, type CloudData } from "./model";
import { normalizeState } from "../storage";
export const CLOUD_LINK_KEY = "veloquest:cloud-link:v1";
const ROUTES = "veloquest:custom-routes:v1", JOURNAL = "veloquest:cloud-apply:v1";
export type CloudLink = { uid: string; revision: string | null };
export function readLink(): CloudLink | null { try { const l = JSON.parse(localStorage.getItem(CLOUD_LINK_KEY) ?? "null"); return l && typeof l.uid === "string" && (l.revision === null || typeof l.revision === "string") ? l : null; } catch { return null; } }
export function diskData(): CloudData | null { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? cloudData(normalizeState(JSON.parse(raw)), JSON.parse(localStorage.getItem(ROUTES) ?? "[]")) : null; } catch { return null; } }
/** A write-ahead journal completes interrupted multi-key installs on the next load. */
export function recoverCloudApply() {
  const raw = localStorage.getItem(JOURNAL); if (!raw) return;
  const journal = JSON.parse(raw);
  for (const key of [STORAGE_KEY, ROUTES, CLOUD_LINK_KEY]) {
    if (typeof journal[key] !== "string") throw new Error("Restauration locale incomplète : conserve les données du navigateur.");
  }
  for (const key of [STORAGE_KEY, ROUTES, CLOUD_LINK_KEY]) localStorage.setItem(key, journal[key]);
  localStorage.removeItem(JOURNAL);
}
export function installCloud(data: CloudData, link: CloudLink) {
  const old = localStorage.getItem(STORAGE_KEY);
  const preferences = old ? normalizeState(JSON.parse(old)).preferences : undefined;
  const state = normalizeState({ ...data.state, preferences });
  const values = { [STORAGE_KEY]: JSON.stringify(state), [ROUTES]: JSON.stringify(data.customClimbs), [CLOUD_LINK_KEY]: JSON.stringify(link) };
  // If this fails, not a single live key has been changed.
  localStorage.setItem(JOURNAL, JSON.stringify(values));
  recoverCloudApply();
  return { state, customClimbs: data.customClimbs };
}
