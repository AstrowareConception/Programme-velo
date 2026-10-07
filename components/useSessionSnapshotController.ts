"use client";

import { useEffect, useRef, useState } from "react";
import type { CadenceScore } from "@/lib/effort";
import { compactTelemetry } from "@/lib/session";
import {
  clearActiveSessionSnapshot,
  readActiveSessionSnapshot,
  writeActiveSessionSnapshot,
  type ActiveSessionSnapshot
} from "@/lib/session-recovery";
import type { TelemetrySample, TimeAttackSplit, VoyagePortion, WorkoutTemplate } from "@/lib/types";

type SessionSnapshotControllerOptions = {
  active: WorkoutTemplate | null;
  activeClimbId?: string;
  routeMode: ActiveSessionSnapshot["routeMode"];
  activeVoyage: VoyagePortion | null;
  activeChallengeId?: string;
  segmentAttackIndex: number | null;
  segmentIndex: number;
  secondsLeft: number;
  running: boolean;
  sessionStarted: boolean;
  showFinish: boolean;
  timeAttackElapsedSeconds: number;
  timeAttackSplits: TimeAttackSplit[];
  pauseCount: number;
  sessionResistanceDelta: number;
  climbStartDistanceM: number | null;
  telemetrySamples: TelemetrySample[];
  cadenceOffset: number;
  cadenceScore: CadenceScore;
  cadenceSettingsKey?: string;
  cadenceSettingsChanged: boolean;
  hadBikeConnection: boolean;
  onForeground?: () => void;
};

export function useSessionSnapshotController({
  active,
  activeClimbId,
  routeMode,
  activeVoyage,
  activeChallengeId,
  segmentAttackIndex,
  segmentIndex,
  secondsLeft,
  running,
  sessionStarted,
  showFinish,
  timeAttackElapsedSeconds,
  timeAttackSplits,
  pauseCount,
  sessionResistanceDelta,
  climbStartDistanceM,
  telemetrySamples,
  cadenceOffset,
  cadenceScore,
  cadenceSettingsKey,
  cadenceSettingsChanged,
  hadBikeConnection,
  onForeground
}: SessionSnapshotControllerOptions) {
  const [resumeSnapshot, setResumeSnapshot] = useState<ActiveSessionSnapshot | null>(null);
  const activeSnapshotRef = useRef<ActiveSessionSnapshot | null>(null);
  const onForegroundRef = useRef(onForeground);
  onForegroundRef.current = onForeground;

  useEffect(() => {
    setResumeSnapshot(readActiveSessionSnapshot());
  }, []);

  useEffect(() => {
    if (!active || !sessionStarted) {
      activeSnapshotRef.current = null;
      return;
    }

    activeSnapshotRef.current = {
      version: 1,
      savedAt: Date.now(),
      workoutId: active.id,
      routeId: activeClimbId,
      routeMode,
      voyage: activeVoyage ?? undefined,
      challengeId: activeChallengeId,
      segmentAttackIndex: segmentAttackIndex ?? undefined,
      segmentIndex,
      secondsLeft,
      running,
      sessionStarted,
      showFinish,
      timeAttackElapsedSeconds,
      timeAttackSplits,
      pauseCount,
      sessionResistanceDelta,
      climbStartDistanceM,
      telemetrySamples: compactTelemetry(telemetrySamples, 180),
      cadenceOffset,
      cadenceScore,
      cadenceSettingsKey,
      cadenceSettingsChanged,
      hadBikeConnection
    };
  }, [
    active,
    activeClimbId,
    routeMode,
    activeVoyage,
    activeChallengeId,
    segmentAttackIndex,
    segmentIndex,
    secondsLeft,
    running,
    sessionStarted,
    showFinish,
    timeAttackElapsedSeconds,
    timeAttackSplits,
    pauseCount,
    sessionResistanceDelta,
    climbStartDistanceM,
    telemetrySamples,
    cadenceOffset,
    cadenceScore,
    cadenceSettingsKey,
    cadenceSettingsChanged,
    hadBikeConnection
  ]);

  useEffect(() => {
    if (!active || !sessionStarted) return;

    const save = () => {
      if (!activeSnapshotRef.current) return;
      const snapshot = { ...activeSnapshotRef.current, savedAt: Date.now() };
      activeSnapshotRef.current = snapshot;
      writeActiveSessionSnapshot(snapshot);
    };

    save();
    const timer = window.setInterval(save, 5000);
    const onPageHide = () => save();
    let wasHidden = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        save();
      } else if (wasHidden) {
        onForegroundRef.current?.();
        wasHidden = false;
      }
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active?.id, sessionStarted]);

  function dismissResumeSnapshot() {
    setResumeSnapshot(null);
  }

  function clearResumeSnapshot() {
    clearActiveSessionSnapshot();
    activeSnapshotRef.current = null;
    setResumeSnapshot(null);
  }

  function saveForLater() {
    if (!activeSnapshotRef.current) return true;
    const snapshot = { ...activeSnapshotRef.current, savedAt: Date.now() };
    activeSnapshotRef.current = snapshot;
    if (!writeActiveSessionSnapshot(snapshot)) return false;
    setResumeSnapshot(snapshot);
    return true;
  }

  return {
    resumeSnapshot,
    dismissResumeSnapshot,
    clearResumeSnapshot,
    saveForLater
  };
}
