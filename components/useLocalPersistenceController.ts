"use client";

import { useEffect, useRef, useState } from "react";
import { TRIAL_SNAPSHOT_KEY } from "@/lib/timed-trials";
import { STORAGE_KEY, emptyState } from "@/lib/data";
import type { ClimbChallenge } from "@/lib/routes";
import { normalizeState, safeLocalStorageWrite } from "@/lib/storage";
import type { AppState, CompletedSession, Profile } from "@/lib/types";

import { clearIntent } from "@/lib/cloud/outbox";
import { CLOUD_LINK_KEY, recoverCloudApply } from "@/lib/cloud/local";
import { canonical } from "@/lib/cloud/model";
import { startNextCycle, type NextCycleOptions } from "@/lib/program-cycles";

const CUSTOM_ROUTES_KEY = "veloquest:custom-routes:v1";

type LocalPersistenceControllerOptions = {
  onToast?: (message: string) => void;
};

export function useLocalPersistenceController({
  onToast
}: LocalPersistenceControllerOptions) {
  const [state, setState] = useState<AppState>(emptyState);
  const [customClimbs, setCustomClimbs] = useState<ClimbChallenge[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [stateSaveFailed, setStateSaveFailed] = useState(false);
  const [routesSaveFailed, setRoutesSaveFailed] = useState(false);
  const [initialSessionMinutes, setInitialSessionMinutes] = useState(35);
  const persistedStateRef = useRef<AppState | null>(null);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  useEffect(() => {
    try { recoverCloudApply(); } catch { setStateSaveFailed(true); onToastRef.current?.("Restauration locale suspendue : libère de l’espace puis recharge. Les données de reprise sont conservées."); return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const loaded = normalizeState(JSON.parse(raw));
        setState(loaded);
        setInitialSessionMinutes(loaded.guidance?.sessionMinutes ?? 35);
      } catch {
        setState(emptyState());
        setInitialSessionMinutes(35);
        onToastRef.current?.("Sauvegarde locale illisible : un état sain a été chargé.");
      }
    } else {
      setInitialSessionMinutes(15);
    }

    const savedRoutes = localStorage.getItem(CUSTOM_ROUTES_KEY);
    if (savedRoutes) {
      try {
        setCustomClimbs(JSON.parse(savedRoutes));
      } catch {
        // Preserve the existing behavior: ignore corrupted custom routes.
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || persistedStateRef.current === state) return;
    const saved = safeLocalStorageWrite(STORAGE_KEY, state);
    if (saved) persistedStateRef.current = state;
    setStateSaveFailed(!saved);
    if (!saved) onToastRef.current?.("Stockage local plein : exporte une sauvegarde puis allège l’historique.");
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const saved = safeLocalStorageWrite(CUSTOM_ROUTES_KEY, customClimbs);
    setRoutesSaveFailed(!saved);
    if (!saved) onToastRef.current?.("Impossible d’enregistrer les parcours : stockage local insuffisant.");
  }, [customClimbs, hydrated]);

  /** Close the review and discard recovery only after the history is durable. */
  function saveCompletedSession(session: CompletedSession) {
    const nextState = { ...state, sessions: [...state.sessions, session] };
    if (!safeLocalStorageWrite(STORAGE_KEY, nextState)) {
      setStateSaveFailed(true);
      onToastRef.current?.("Séance non enregistrée : le bilan reste ouvert. Libère de l’espace puis réessaie.");
      return false;
    }
    persistedStateRef.current = nextState;
    setState(nextState);
    setStateSaveFailed(false);
    return true;
  }

  function clearLocalData() {
    localStorage.removeItem(CLOUD_LINK_KEY);
    void clearIntent().catch(() => onToastRef.current?.("Les données locales sont réinitialisées, mais une copie d’envoi reste à supprimer. Recharge avant de reconnecter le cloud."));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ROUTES_KEY);
    localStorage.removeItem(TRIAL_SNAPSHOT_KEY);
    setState(emptyState());
    setCustomClimbs([]);
    setStateSaveFailed(false);
    setRoutesSaveFailed(false);
    setInitialSessionMinutes(15);
  }

  /** Keep the profile form open until its edits are durable. */
  function saveProfile(profile: Profile) {
    const nextState = { ...state, profile };
    if (!safeLocalStorageWrite(STORAGE_KEY, nextState)) {
      setStateSaveFailed(true);
      return false;
    }
    persistedStateRef.current = nextState;
    setState(nextState);
    setStateSaveFailed(false);
    return true;
  }

  function saveNextCycle(options: NextCycleOptions): string | undefined {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && canonical(normalizeState(JSON.parse(raw))) !== canonical(normalizeState(state))) return "Les données de cet onglet ont changé. Recharge avant de préparer un nouveau cycle.";
      const nextState = startNextCycle(state, options);
      if (!safeLocalStorageWrite(STORAGE_KEY, nextState)) {
        setStateSaveFailed(true);
        return "Le cycle n’a pas pu être enregistré. La proposition reste ouverte : libère du stockage puis réessaie.";
      }
      persistedStateRef.current = nextState;
      setState(nextState); setStateSaveFailed(false);
    } catch (error) { return error instanceof Error ? error.message : "Impossible d’enregistrer ce cycle."; }
  }

  function saveTrophyReceipts(ids: string[]) {
    // An automatic acknowledgement must never write an old tab over newer history.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && canonical(normalizeState(JSON.parse(raw))) !== canonical(normalizeState(state))) return false;
    } catch { return false; }
    const nextState = { ...state, preferences: { ...state.preferences!, trophyNotifications: ids } };
    if (!safeLocalStorageWrite(STORAGE_KEY, nextState)) { setStateSaveFailed(true); return false; }
    persistedStateRef.current = nextState;
    setState(nextState); setStateSaveFailed(false); return true;
  }

  return {
    state,
    setState,
    customClimbs,
    setCustomClimbs,
    hydrated,
    stateSaveFailed,
    routesSaveFailed,
    initialSessionMinutes,
    saveCompletedSession,
    saveProfile,
    saveNextCycle,
    saveTrophyReceipts,
    clearLocalData
  };
}
