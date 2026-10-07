"use client";

import { useEffect, useRef, useState } from "react";
import { STORAGE_KEY, emptyState } from "@/lib/data";
import type { ClimbChallenge } from "@/lib/routes";
import { normalizeState, safeLocalStorageWrite } from "@/lib/storage";
import type { AppState } from "@/lib/types";

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
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  useEffect(() => {
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
    if (!hydrated) return;
    const saved = safeLocalStorageWrite(STORAGE_KEY, state);
    setStateSaveFailed(!saved);
    if (!saved) onToastRef.current?.("Stockage local plein : exporte une sauvegarde puis allège l’historique.");
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const saved = safeLocalStorageWrite(CUSTOM_ROUTES_KEY, customClimbs);
    setRoutesSaveFailed(!saved);
    if (!saved) onToastRef.current?.("Impossible d’enregistrer les parcours : stockage local insuffisant.");
  }, [customClimbs, hydrated]);

  function clearLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ROUTES_KEY);
    setState(emptyState());
    setCustomClimbs([]);
    setStateSaveFailed(false);
    setRoutesSaveFailed(false);
    setInitialSessionMinutes(15);
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
    clearLocalData
  };
}
