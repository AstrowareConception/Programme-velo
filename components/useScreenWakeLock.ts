"use client";

import { useEffect, useState } from "react";

export type ScreenWakeState = "inactive" | "requesting" | "active" | "unavailable" | "refused" | "released";
type ScreenLock = EventTarget & { released: boolean; release: () => Promise<void> };

export function useScreenWakeLock(enabled: boolean) {
  const [status, setStatus] = useState<ScreenWakeState>("inactive");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const manager = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<ScreenLock> } }).wakeLock;
    if (!enabled) { setStatus("inactive"); return; }
    if (!manager) { setStatus("unavailable"); return; }
    let disposed = false;
    let generation = 0;
    let held: ScreenLock | null = null;

    const release = () => {
      const lock = held;
      held = null;
      if (lock && !lock.released) void lock.release().catch(() => undefined);
    };
    const acquire = async () => {
      if (held && !held.released) return;
      const current = ++generation;
      if (document.visibilityState !== "visible") { setStatus("released"); return; }
      setStatus("requesting");
      try {
        const lock = await manager.request("screen");
        if (disposed || current !== generation || document.visibilityState !== "visible") {
          if (!lock.released) await lock.release();
          return;
        }
        held = lock;
        setStatus(lock.released ? "released" : "active");
        lock.addEventListener("release", () => {
          if (!disposed && held === lock) { held = null; setStatus("released"); }
        }, { once: true });
      } catch {
        if (!disposed && current === generation) setStatus("refused");
      }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") void acquire();
      else { generation++; release(); setStatus("released"); }
    };
    void acquire();
    document.addEventListener("visibilitychange", visibility);
    return () => { disposed = true; generation++; document.removeEventListener("visibilitychange", visibility); release(); };
  }, [enabled, attempt]);

  return { status, retry: () => setAttempt(value => value + 1) };
}

export function screenWakeLabel(status: ScreenWakeState, enabled: boolean) {
  if (!enabled) return "Maintien de l’écran désactivé";
  return {
    inactive: "Maintien de l’écran au départ",
    requesting: "Maintien de l’écran en cours…",
    active: "Écran maintenu éveillé",
    unavailable: "Maintien de l’écran indisponible",
    refused: "Maintien de l’écran refusé",
    released: "Maintien de l’écran interrompu"
  }[status];
}
