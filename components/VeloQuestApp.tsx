"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Measurement, Preferences, TelemetrySample, TimeAttackSplit, WorkoutTemplate } from "@/lib/types";
import { connectFtmsBike, hasWebBluetooth, type BikeConnection, type BikeTelemetry, webBluetoothHint } from "@/lib/ftms";
import { ClimbProfile } from "@/components/ClimbProfile";
import { RouteMap } from "@/components/RouteMap";
import { MetricChart } from "@/components/MetricChart";
import { InstallCard } from "@/components/InstallCard";
import { climbs, climbToWorkout, type ClimbChallenge } from "@/lib/routes";
import { parseGpxFile } from "@/lib/gpx";
import {
  STORAGE_KEY,
  badges,
  currentProgramWeek,
  emptyState,
  levelForXp,
  totalXp,
  weekTargets,
  weeklyStats,
  workouts,
  streak,
  isPerfectWeek,
  defaultPreferences,
  levelTitle
} from "@/lib/data";
import { compactTelemetry, cueSegment, formatClock, requestScreenWakeLock } from "@/lib/session";
import { createBackup, estimateLocalBytes, normalizeState, parseBackup, safeLocalStorageWrite } from "@/lib/storage";
import { captureSplits, checkpointKilometers, formatRaceTime, ghostDeltaSeconds, personalBest, routeAttempts } from "@/lib/time-attack";

type Tab = "dashboard" | "sessions" | "climbs" | "progress" | "more";
type Energy = "easy" | "normal" | "hard";
type RouteMode = "training" | "timeAttack";
const CUSTOM_ROUTES_KEY = "veloquest:custom-routes:v1";

function pct(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function uid() {
  return crypto.randomUUID();
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function average(values: Array<number | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : undefined;
}

function maximum(values: Array<number | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return nums.length ? Math.max(...nums) : undefined;
}

function adjustedResistance(label: string, offset: number) {
  if (!offset || label === "libre") return label;
  const values = label.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(",", ".")));
  if (!values?.length) return label;
  const adjusted = values.map((value) => Math.max(1, Math.min(32, Math.round(value + offset))));
  return adjusted.length === 1 ? String(adjusted[0]) : adjusted.join("–");
}

function n(form: FormData, key: string) {
  const raw = String(form.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function VeloQuestApp() {
  const [state, setState] = useState<AppState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [active, setActive] = useState<WorkoutTemplate | null>(null);
  const [activeClimb, setActiveClimb] = useState<ClimbChallenge | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("training");
  const [timeAttackElapsedSeconds, setTimeAttackElapsedSeconds] = useState(0);
  const [timeAttackSplits, setTimeAttackSplits] = useState<TimeAttackSplit[]>([]);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(35);
  const [energy, setEnergy] = useState<Energy>("normal");
  const [toast, setToast] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [bike, setBike] = useState<BikeConnection | null>(null);
  const [telemetry, setTelemetry] = useState<BikeTelemetry>({});
  const [telemetrySamples, setTelemetrySamples] = useState<TelemetrySample[]>([]);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [connectingBike, setConnectingBike] = useState(false);
  const [controlGranted, setControlGranted] = useState(false);
  const [testResistanceLevel, setTestResistanceLevel] = useState(8);
  const [autoResistanceControl, setAutoResistanceControl] = useState(false);
  const [climbStartDistanceM, setClimbStartDistanceM] = useState<number | null>(null);
  const [customClimbs, setCustomClimbs] = useState<ClimbChallenge[]>([]);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const lastSampleAt = useRef(0);
  const segmentDeadlineRef = useRef(0);
  const timeAttackStartedAtRef = useRef(0);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setState(normalizeState(JSON.parse(raw))); }
      catch {
        setState(emptyState());
        setToast("Sauvegarde locale illisible : un état sain a été chargé.");
      }
    } else {
      setShowSetup(true);
    }
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && ["dashboard","sessions","climbs","progress","more"].includes(requestedTab)) setTab(requestedTab as Tab);

    const savedRoutes = localStorage.getItem(CUSTOM_ROUTES_KEY);
    if (savedRoutes) {
      try { setCustomClimbs(JSON.parse(savedRoutes)); } catch { /* ignore corrupted custom routes */ }
    }
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setHydrated(true);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (hydrated && !safeLocalStorageWrite(STORAGE_KEY, state)) setToast("Stockage local plein : exporte une sauvegarde puis allège l’historique.");
  }, [state, hydrated]);

  useEffect(() => {
    if (hydrated && !safeLocalStorageWrite(CUSTOM_ROUTES_KEY, customClimbs)) setToast("Impossible d’enregistrer les parcours : stockage local insuffisant.");
  }, [customClimbs, hydrated]);

  useEffect(() => {
    if (!running || !active || !sessionStarted) return;
    if (routeMode === "timeAttack" && activeClimb && bike && climbStartDistanceM !== null) return;
    segmentDeadlineRef.current = Date.now() + secondsLeft * 1000;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((segmentDeadlineRef.current - now) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        return;
      }

      let overdueMs = Math.max(0, now - segmentDeadlineRef.current);
      let next = segmentIndex + 1;

      while (next < active.segments.length) {
        const segmentMs = Math.round(active.segments[next].minutes * 60 * 1000);
        if (overdueMs < segmentMs) break;
        overdueMs -= segmentMs;
        next += 1;
      }

      if (next >= active.segments.length) {
        setSecondsLeft(0);
        setRunning(false);
        setShowFinish(true);
        setToast("Séance terminée — enregistre ta performance.");
        return;
      }

      const nextTotalMs = Math.round(active.segments[next].minutes * 60 * 1000);
      const nextRemainingSeconds = Math.max(1, Math.ceil((nextTotalMs - overdueMs) / 1000));
      setSegmentIndex(next);
      setSecondsLeft(nextRemainingSeconds);
      segmentDeadlineRef.current = now + nextRemainingSeconds * 1000;
      cueSegment(active.segments[next], { ...defaultPreferences, ...(state.preferences ?? {}) });
    }, 250);

    return () => window.clearInterval(timer);
  }, [running, active, segmentIndex, sessionStarted, routeMode, activeClimb, bike, climbStartDistanceM]);

  useEffect(() => {
    if (routeMode !== "timeAttack" || !activeClimb || !sessionStarted || !running) return;
    if (!timeAttackStartedAtRef.current) timeAttackStartedAtRef.current = Date.now() - timeAttackElapsedSeconds * 1000;

    const update = () => setTimeAttackElapsedSeconds(Math.max(0, Math.floor((Date.now() - timeAttackStartedAtRef.current) / 1000)));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [routeMode, activeClimb, sessionStarted, running]);

  useEffect(() => {
    if (!running || !active || !bike) return;
    const now = Date.now();
    if (now - lastSampleAt.current < 10000) return;
    lastSampleAt.current = now;
    setTelemetrySamples((previous) => [
      ...previous.slice(-359),
      {
        t: now,
        speedKmh: telemetry.speedKmh,
        cadenceRpm: telemetry.cadenceRpm,
        resistance: telemetry.resistance,
        powerW: telemetry.powerW,
        heartRate: telemetry.heartRate,
        distanceKm: telemetry.distanceM !== undefined ? telemetry.distanceM / 1000 : undefined
      }
    ]);
  }, [telemetry, running, active, bike]);

  const preferences: Preferences = { ...defaultPreferences, ...(state.preferences ?? {}) };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!running || !sessionStarted || !preferences.keepScreenAwake) {
      try { wakeLockRef.current?.release?.(); } catch {}
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;
    const acquire = async () => {
      const lock = await requestScreenWakeLock();
      if (!cancelled) wakeLockRef.current = lock;
      else try { await lock?.release?.(); } catch {}
    };
    acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && running) acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      try { wakeLockRef.current?.release?.(); } catch {}
      wakeLockRef.current = null;
    };
  }, [running, sessionStarted, preferences.keepScreenAwake]);

  const week = currentProgramWeek(state.profile.startDate);
  const target = weekTargets[week - 1];
  const stats = weeklyStats(state, week);
  const xp = totalXp(state);
  const level = levelForXp(xp);
  const currentLevelTitle = levelTitle(level);
  const levelXp = xp % 500;
  const allBadges = badges(state);
  const sortedMeasurements = [...state.measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latestMeasurement = sortedMeasurements.at(-1);
  const latestWeight = [...sortedMeasurements].reverse().find((m) => m.weight !== undefined)?.weight;
  const latestWaist = [...sortedMeasurements].reverse().find((m) => m.waist !== undefined)?.waist;
  const latestAbdomen = [...sortedMeasurements].reverse().find((m) => m.abdomen !== undefined)?.abdomen;
  const allClimbs = useMemo(() => [...climbs, ...customClimbs], [customClimbs]);
  const selectedSession = selectedSessionId ? state.sessions.find((session) => session.id === selectedSessionId) : undefined;
  const selectedTemplate = selectedSession ? workouts.find((w) => w.id === selectedSession.templateId) : undefined;
  const selectedRoute = selectedSession ? allClimbs.find((c) => c.id === selectedSession.routeId) : undefined;
  const currentStreak = streak(state);
  const perfectWeek = isPerfectWeek(state, week);
  const totalDistance = state.sessions.reduce((sum, session) => sum + (session.metrics?.distanceKm ?? 0), 0);
  const weightLost = state.profile.startWeight && latestWeight !== undefined ? state.profile.startWeight - latestWeight : 0;
  const waistLost = state.profile.startWaist && latestWaist !== undefined ? state.profile.startWaist - latestWaist : 0;
  const weightPoints = sortedMeasurements.filter((m) => m.weight !== undefined).map((m) => ({ label: dateLabel(m.date), value: m.weight! }));
  const waistPoints = sortedMeasurements.filter((m) => m.waist !== undefined).map((m) => ({ label: dateLabel(m.date), value: m.waist! }));
  const localBytes = hydrated ? estimateLocalBytes(state, customClimbs) : 0;

  const autoMetrics = useMemo(() => {
    const firstDistance = telemetrySamples.find((s) => s.distanceKm !== undefined)?.distanceKm;
    const lastDistance = [...telemetrySamples].reverse().find((s) => s.distanceKm !== undefined)?.distanceKm;
    return {
      distanceKm: firstDistance !== undefined && lastDistance !== undefined ? Math.max(0, lastDistance - firstDistance) : undefined,
      avgSpeedKmh: average(telemetrySamples.map((s) => s.speedKmh)),
      avgCadenceRpm: average(telemetrySamples.map((s) => s.cadenceRpm)),
      maxCadenceRpm: maximum(telemetrySamples.map((s) => s.cadenceRpm)),
      avgPowerW: average(telemetrySamples.map((s) => s.powerW)),
      maxPowerW: maximum(telemetrySamples.map((s) => s.powerW)),
      avgHeartRate: average(telemetrySamples.map((s) => s.heartRate)),
      maxHeartRate: maximum(telemetrySamples.map((s) => s.heartRate)),
      avgResistance: average(telemetrySamples.map((s) => s.resistance))
    };
  }, [telemetrySamples]);

  useEffect(() => {
    const badgeNavigator = navigator as Navigator & {
      setAppBadge?: (value?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!badgeNavigator.setAppBadge) return;
    const remaining = Math.max(0, target.sessions - stats.sessions);
    if (remaining > 0) badgeNavigator.setAppBadge(remaining).catch(() => undefined);
    else badgeNavigator.clearAppBadge?.().catch(() => undefined);
  }, [target.sessions, stats.sessions]);

  const recommendation = useMemo(() => {
    const structured = workouts.filter((w) => !w.bonus && w.id !== "free-ride");
    const recentHard = [...state.sessions]
      .filter((session) => session.intensity === "hard")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const hardRecently = recentHard && Date.now() - new Date(recentHard.date).getTime() < 30 * 3600 * 1000;
    const maxIntensity = hardRecently || stats.hard >= target.maxHard ? "moderate" : energy === "hard" ? "hard" : energy === "easy" ? "easy" : "moderate";
    const rank = { easy: 1, moderate: 2, hard: 3 };
    const candidates = structured
      .filter((w) => w.duration <= availableMinutes + 5)
      .filter((w) => rank[w.intensity] <= rank[maxIntensity])
      .sort((a, b) => {
        const intensityDelta = rank[b.intensity] - rank[a.intensity];
        if (intensityDelta !== 0) return intensityDelta;
        return b.duration - a.duration;
      });
    return candidates[0] ?? structured.sort((a, b) => a.duration - b.duration)[0];
  }, [state.sessions, stats.hard, target.maxHard, availableMinutes, energy]);

  const totalSessionSeconds = active ? active.segments.reduce((sum, segment) => sum + segment.minutes * 60, 0) : 0;
  const elapsedBeforeSegment = active ? active.segments.slice(0, segmentIndex).reduce((sum, segment) => sum + segment.minutes * 60, 0) : 0;
  const currentSegmentSeconds = active ? active.segments[segmentIndex]?.minutes * 60 || 0 : 0;
  const sessionElapsedSeconds = active ? elapsedBeforeSegment + Math.max(0, currentSegmentSeconds - secondsLeft) : 0;
  const sessionProgressPercent = totalSessionSeconds ? Math.min(100, Math.round((sessionElapsedSeconds / totalSessionSeconds) * 100)) : 0;

  const climbProgress = useMemo(() => {
    if (!activeClimb || !active) return 0;
    if (bike && telemetry.distanceM !== undefined && climbStartDistanceM !== null) {
      return Math.max(0, Math.min(1, (telemetry.distanceM - climbStartDistanceM) / (activeClimb.distanceKm * 1000)));
    }
    const timedProgress = totalSessionSeconds ? sessionElapsedSeconds / totalSessionSeconds : 0;
    return Math.max(0, Math.min(1, timedProgress));
  }, [activeClimb, active, bike, telemetry.distanceM, climbStartDistanceM, segmentIndex, totalSessionSeconds, sessionElapsedSeconds]);

  const currentRouteKm = activeClimb ? climbProgress * activeClimb.distanceKm : 0;
  const routeBest = activeClimb ? personalBest(state.sessions, activeClimb.id) : undefined;
  const routeAttemptCount = activeClimb ? routeAttempts(state.sessions, activeClimb.id).length : 0;
  const ghostDelta = activeClimb && routeMode === "timeAttack"
    ? ghostDeltaSeconds(routeBest, currentRouteKm, activeClimb.distanceKm, timeAttackElapsedSeconds)
    : undefined;
  const routeCheckpoints = activeClimb ? checkpointKilometers(activeClimb.distanceKm) : [];

  useEffect(() => {
    if (routeMode !== "timeAttack" || !activeClimb || !sessionStarted) return;
    setTimeAttackSplits((existing) => captureSplits(existing, checkpointKilometers(activeClimb.distanceKm), currentRouteKm, timeAttackElapsedSeconds));
  }, [routeMode, activeClimb, sessionStarted, currentRouteKm, timeAttackElapsedSeconds]);

  useEffect(() => {
    if (routeMode !== "timeAttack" || !activeClimb || !bike || climbStartDistanceM === null || !sessionStarted) return;
    const profileIndex = activeClimb.profile.slice(1).findIndex((point) => currentRouteKm <= point.km);
    const nextIndex = profileIndex < 0 ? active.segments.length - 1 : profileIndex;
    if (nextIndex !== segmentIndex) {
      setSegmentIndex(nextIndex);
      const seconds = Math.round(active.segments[nextIndex].minutes * 60);
      setSecondsLeft(seconds);
      cueSegment(active.segments[nextIndex], preferences);
    }
    if (climbProgress >= 0.999 && running) {
      setRunning(false);
      setShowFinish(true);
      setToast("Arrivée ! Time Attack terminé.");
    }
  }, [routeMode, activeClimb, bike, climbStartDistanceM, sessionStarted, currentRouteKm, climbProgress, segmentIndex, active, running]);

  useEffect(() => {
    if (!autoResistanceControl || !controlGranted || !running || !sessionStarted || !active || !bike?.setResistance) return;
    const resistanceText = active.segments[segmentIndex]?.resistance ?? "";
    const values = resistanceText.match(/\d+(?:[.,]\d+)?/g)?.map((v) => Number(v.replace(",", "."))) ?? [];
    if (!values.length) return;
    const targetLevel = values.reduce((sum, value) => sum + value, 0) / values.length + preferences.resistanceOffset;
    bike.setResistance(targetLevel).catch((error) => {
      setAutoResistanceControl(false);
      setBluetoothError(error instanceof Error ? error.message : "Pilotage automatique interrompu.");
    });
  }, [autoResistanceControl, controlGranted, running, sessionStarted, active, segmentIndex, bike]);

  if (!hydrated) {
    return (
      <main className="splashScreen" aria-busy="true">
        <Image src="/logo.svg" alt="" width={84} height={84} priority />
        <h1>VeloQuest</h1>
        <p>Préparation de ton cockpit…</p>
        <i><b /></i>
      </main>
    );
  }

  async function connectBike() {
    if (!hasWebBluetooth()) {
      setBluetoothError(webBluetoothHint() === "ios"
        ? "Sur iPhone/iPad, les navigateurs actuels n’exposent pas Web Bluetooth à la PWA. Le mode guidé et la saisie manuelle restent disponibles."
        : "Web Bluetooth n’est pas disponible dans ce navigateur.");
      return;
    }
    setConnectingBike(true);
    setBluetoothError(null);
    try {
      const connection = await connectFtmsBike(
        (next) => setTelemetry((prev) => ({ ...prev, ...next })),
        () => {
          setBike(null);
          setTelemetry({});
          setControlGranted(false);
          setAutoResistanceControl(false);
        }
      );
      setBike(connection);
      setControlGranted(false);
      setAutoResistanceControl(false);
      const range = connection.capabilities.resistanceRange;
      setToast(range ? `${connection.deviceName} connecté · résistance ${range.min}–${range.max}` : `${connection.deviceName} connecté`);
    } catch (error) {
      setBluetoothError(error instanceof Error ? error.message : "Connexion Bluetooth impossible.");
    } finally {
      setConnectingBike(false);
    }
  }

  async function requestBikeControl() {
    if (!bike?.requestControl) return;
    try {
      await bike.requestControl();
      setControlGranted(true);
      setToast("Contrôle FTMS accordé par le vélo.");
    } catch (error) {
      setControlGranted(false);
      setBluetoothError(error instanceof Error ? error.message : "Contrôle FTMS refusé.");
    }
  }

  async function sendTestResistance() {
    if (!bike?.setResistance || !controlGranted) return;
    try {
      await bike.setResistance(testResistanceLevel);
      setToast(`Résistance ${testResistanceLevel} confirmée par le vélo.`);
    } catch (error) {
      setBluetoothError(error instanceof Error ? error.message : "Commande de résistance refusée.");
    }
  }

  function openManualLog() {
    const freeRide = workouts.find((workout) => workout.id === "free-ride");
    if (!freeRide) return;
    setActive(freeRide);
    setActiveClimb(null);
    setSegmentIndex(0);
    setSecondsLeft(Math.round(freeRide.duration * 60));
    setRunning(false);
    setSessionStarted(true);
    setShowFinish(true);
    setTelemetrySamples([]);
  }

  function launch(workout: WorkoutTemplate, climb: ClimbChallenge | null = null, mode: RouteMode = "training") {
    setActive(workout);
    setActiveClimb(climb);
    setRouteMode(climb ? mode : "training");
    setTimeAttackElapsedSeconds(0);
    setTimeAttackSplits([]);
    timeAttackStartedAtRef.current = 0;
    setSegmentIndex(0);
    setSecondsLeft(Math.round(workout.segments[0].minutes * 60));
    setRunning(false);
    setSessionStarted(false);
    setShowFinish(false);
    setTelemetrySamples([]);
    lastSampleAt.current = 0;
    setClimbStartDistanceM(climb ? telemetry.distanceM ?? null : null);
  }

  function finishActive(form: FormData) {
    if (!active) return;
    const manualUsed = ["distance", "calories", "avgCadence", "avgPower", "avgHeartRate", "rpe", "note"]
      .some((key) => String(form.get(key) ?? "").trim().length > 0);
    const hasFtms = telemetrySamples.length > 0;
    const isTimeAttack = routeMode === "timeAttack" && Boolean(activeClimb);
    const elapsedSeconds = isTimeAttack
      ? (n(form, "elapsedSeconds") ?? timeAttackElapsedSeconds)
      : undefined;
    const duration = isTimeAttack && elapsedSeconds !== undefined
      ? elapsedSeconds / 60
      : (n(form, "duration") ?? active.duration);
    const previousBest = isTimeAttack && activeClimb ? personalBest(state.sessions, activeClimb.id) : undefined;
    const isPersonalBest = Boolean(
      isTimeAttack &&
      elapsedSeconds !== undefined &&
      (!previousBest?.metrics?.elapsedSeconds || elapsedSeconds < previousBest.metrics.elapsedSeconds)
    );
    const awardedXp = active.xp + (isPersonalBest ? 50 : 0);

    setState((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          id: uid(),
          templateId: active.id,
          routeId: activeClimb?.id,
          date: new Date().toISOString(),
          duration,
          points: active.points,
          xp: awardedXp,
          intensity: active.intensity,
          kind: active.kind,
          bonus: Boolean(active.bonus),
          rpe: n(form, "rpe"),
          note: String(form.get("note") ?? "").trim() || undefined,
          metrics: {
            source: hasFtms && manualUsed ? "mixed" : hasFtms ? "ftms" : "manual",
            elapsedSeconds,
            timeAttack: isTimeAttack || undefined,
            checkpointSplits: isTimeAttack ? timeAttackSplits : undefined,
            distanceKm: n(form, "distance") ?? autoMetrics.distanceKm ?? (activeClimb ? currentRouteKm : undefined),
            calories: n(form, "calories"),
            avgSpeedKmh: n(form, "avgSpeed") ?? autoMetrics.avgSpeedKmh,
            avgCadenceRpm: n(form, "avgCadence") ?? autoMetrics.avgCadenceRpm,
            maxCadenceRpm: autoMetrics.maxCadenceRpm,
            avgPowerW: n(form, "avgPower") ?? autoMetrics.avgPowerW,
            maxPowerW: autoMetrics.maxPowerW,
            avgHeartRate: n(form, "avgHeartRate") ?? autoMetrics.avgHeartRate,
            maxHeartRate: autoMetrics.maxHeartRate,
            avgResistance: autoMetrics.avgResistance,
            samples: hasFtms && preferences.keepTelemetryTrace ? compactTelemetry(telemetrySamples) : undefined
          }
        }
      ]
    }));
    setActive(null);
    setActiveClimb(null);
    setRunning(false);
    setShowFinish(false);
    setTelemetrySamples([]);
    setTimeAttackElapsedSeconds(0);
    setTimeAttackSplits([]);
    timeAttackStartedAtRef.current = 0;
    setToast(isPersonalBest ? `Nouveau record personnel · +${awardedXp} XP` : `Quête validée · +${awardedXp} XP`);
  }

  function beginSession() {
    if (!active) return;
    setSessionStarted(true);
    if (activeClimb) setClimbStartDistanceM(telemetry.distanceM ?? null);
    if (routeMode === "timeAttack") {
      setTimeAttackElapsedSeconds(0);
      setTimeAttackSplits([]);
      timeAttackStartedAtRef.current = Date.now();
    }
    setRunning(true);
    const seconds = Math.round(active.segments[segmentIndex].minutes * 60);
    setSecondsLeft(seconds);
    segmentDeadlineRef.current = Date.now() + seconds * 1000;
    cueSegment(active.segments[segmentIndex], preferences);
  }

  function togglePause() {
    if (!active || !sessionStarted || routeMode === "timeAttack") return;
    if (running) {
      setRunning(false);
      return;
    }
    segmentDeadlineRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
  }

  function goToSegment(index: number) {
    if (!active) return;
    const next = Math.max(0, Math.min(active.segments.length - 1, index));
    setSegmentIndex(next);
    const seconds = Math.round(active.segments[next].minutes * 60);
    setSecondsLeft(seconds);
    segmentDeadlineRef.current = Date.now() + seconds * 1000;
    if (sessionStarted) cueSegment(active.segments[next], preferences);
  }

  function updatePreference(key: keyof Omit<Preferences, "resistanceOffset">, value: boolean) {
    setState((prev) => ({
      ...prev,
      preferences: { ...defaultPreferences, ...(prev.preferences ?? {}), [key]: value }
    }));
  }

  function updateResistanceOffset(value: number) {
    setState((prev) => ({
      ...prev,
      preferences: { ...defaultPreferences, ...(prev.preferences ?? {}), resistanceOffset: Math.max(-4, Math.min(4, value)) }
    }));
  }

  function addMeasurement(form: FormData) {
    const m: Measurement = {
      id: uid(),
      date: new Date().toISOString(),
      weight: n(form, "weight"),
      waist: n(form, "waist"),
      abdomen: n(form, "abdomen")
    };
    setState((prev) => ({ ...prev, measurements: [...prev.measurements, m] }));
  }

  function saveProfile(form: FormData) {
    setState((prev) => ({
      ...prev,
      profile: {
        name: String(form.get("name") || ""),
        startDate: String(form.get("startDate") || new Date().toISOString().slice(0, 10)),
        startWeight: n(form, "startWeight"),
        targetWeight: n(form, "targetWeight"),
        startWaist: n(form, "startWaist"),
        targetWaist: n(form, "targetWaist")
      }
    }));
    setShowSetup(false);
  }

  function exportData() {
    const backup = createBackup(state, customClimbs);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veloquest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const sessions = [
      ["date","seance","duree_min","distance_km","calories","vitesse_moy","rpm_moy","watts_moy","fc_moy","rpe","source"],
      ...state.sessions.map((session) => {
        const template = workouts.find((w) => w.id === session.templateId);
        const route = allClimbs.find((c) => c.id === session.routeId);
        return [
          session.date,
          route?.name ?? template?.name ?? session.templateId,
          session.duration,
          session.metrics?.distanceKm,
          session.metrics?.calories,
          session.metrics?.avgSpeedKmh,
          session.metrics?.avgCadenceRpm,
          session.metrics?.avgPowerW,
          session.metrics?.avgHeartRate,
          session.rpe,
          session.metrics?.source
        ];
      })
    ].map((row) => row.map(quote).join(";")).join("\n");

    const measurements = [
      ["date","poids_kg","tour_taille_cm","tour_abdominal_cm"],
      ...state.measurements.map((m) => [m.date,m.weight,m.waist,m.abdomen])
    ].map((row) => row.map(quote).join(";")).join("\n");

    downloadText(`veloquest-seances-${new Date().toISOString().slice(0,10)}.csv`, sessions);
    window.setTimeout(() => downloadText(`veloquest-mesures-${new Date().toISOString().slice(0,10)}.csv`, measurements), 200);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      setState(parsed.state);
      setCustomClimbs(parsed.customClimbs);
      setToast("Sauvegarde importée.");
    } catch {
      alert("Sauvegarde invalide.");
    }
  }

  function resetLocalData() {
    if (!window.confirm("Effacer le profil, l’historique, les mesures et les parcours personnels de cet appareil ?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ROUTES_KEY);
    setState(emptyState());
    setCustomClimbs([]);
    setSelectedSessionId(null);
    setTab("dashboard");
    setShowSetup(true);
    setToast("Données locales réinitialisées.");
  }

  async function importGpx(file?: File) {
    if (!file) return;
    setGpxError(null);
    try {
      const climb = await parseGpxFile(file);
      setCustomClimbs((previous) => [climb, ...previous.filter((c) => c.id !== climb.id)]);
    } catch (error) {
      setGpxError(error instanceof Error ? error.message : "Import GPX impossible.");
    }
  }

  function deleteCustomClimb(id: string) {
    setCustomClimbs((previous) => previous.filter((climb) => climb.id !== id));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.svg" alt="" width={44} height={44} className="brandMark" priority />
          <div><strong>VeloQuest</strong><span>Ride · Level up · Repeat</span></div>
        </div>
        <div className="topActions">
          <button className={`bikePill ${bike ? "connected" : ""}`} onClick={bike ? () => { bike.disconnect(); setBike(null); setTelemetry({}); setControlGranted(false); setAutoResistanceControl(false); } : connectBike}>
            <span>{bike ? "●" : "◌"}</span>{bike ? bike.deviceName : connectingBike ? "Connexion…" : "TEB5"}
          </button>
          <div className="levelPill"><span>Niv. {level}</span><strong>{xp} XP</strong></div>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">SEMAINE {week} / 12</p>
          <h1>{state.profile.name ? `${state.profile.name}, ta quête continue.` : "Ta quête continue."}</h1>
          <p>Choisis selon ton temps et ton énergie. VeloQuest récompense la régularité, la variété et la progression.</p>
          <div className="heroLevelProgress"><span><strong>{currentLevelTitle}</strong><small>{levelXp}/500 XP vers le niveau {level + 1}</small></span><i><b style={{ width: `${Math.round((levelXp / 500) * 100)}%` }} /></i></div>
        </div>
        <div className="heroRune"><span>{level}</span><small>NIVEAU</small><em>{currentLevelTitle}</em></div>
      </section>

      {tab === "dashboard" && (
        <>
          <section className="grid statsGrid">
            <Stat label="Points" value={stats.points} target={target.points} suffix=" pts" />
            <Stat label="Minutes" value={stats.minutes} target={target.minutes} suffix=" min" />
            <Stat label="Séances" value={stats.sessions} target={target.sessions} />
            <Stat label="Variété" value={stats.variety} target={target.variety} />
          </section>

          <section className="card weeklyMission">
            <div className="sectionHead"><div><p className="eyebrow">MISSION SEMAINE {week}</p><h2>Ce qu’il reste à conquérir</h2></div><strong>{perfectWeek ? "✓ complète" : `${Math.max(0, target.points - stats.points)} pts restants`}</strong></div>
            <div className="missionItems">
              <MissionItem label="Charge" value={stats.points} target={target.points} suffix=" pts" />
              <MissionItem label="Volume" value={stats.minutes} target={target.minutes} suffix=" min" />
              <MissionItem label="Séances" value={stats.sessions} target={target.sessions} />
              <MissionItem label="Variété" value={stats.variety} target={target.variety} />
              <div className={stats.hard <= target.maxHard ? "missionItem done" : "missionItem warning"}><span>{stats.hard <= target.maxHard ? "✓" : "!"}</span><div><strong>Intensité</strong><small>{stats.hard}/{target.maxHard} séances dures max</small></div></div>
            </div>
          </section>

          <section className="grid achievementGrid">
            <article className={`card achievement ${perfectWeek ? "success" : ""}`}><span>👑</span><div><small>Semaine</small><strong>{perfectWeek ? "Parfaite" : "En cours"}</strong><em>{stats.points}/{target.points} pts · {stats.hard}/{target.maxHard} séances dures</em></div></article>
            <article className="card achievement"><span>🔥</span><div><small>Série</small><strong>{currentStreak} semaine{currentStreak > 1 ? "s" : ""}</strong><em>parfaite{currentStreak > 1 ? "s" : ""} d’affilée</em></div></article>
            <article className="card achievement"><span>🛣️</span><div><small>Distance totale</small><strong>{totalDistance.toFixed(1)} km</strong><em>enregistrés</em></div></article>
            <article className="card achievement"><span>📉</span><div><small>Transformation</small><strong>{weightLost > 0 ? `-${weightLost.toFixed(1)} kg` : "—"}</strong><em>{waistLost > 0 ? `-${waistLost.toFixed(1)} cm de taille` : "mesures à compléter"}</em></div></article>
          </section>

          <section className={`card bikeConsole ${bike ? "online" : ""}`}>
            <div className="sectionHead">
              <div><p className="eyebrow">TEB5 · MODE CONNECTÉ BETA</p><h2>{bike ? bike.deviceName : "Console Bluetooth"}</h2></div>
              <span className="connectionState">{bike ? "LIVE" : "OFFLINE"}</span>
            </div>
            {bike ? (
              <div className="consoleMetrics">
                <ConsoleMetric label="RPM" value={telemetry.cadenceRpm?.toFixed(0) ?? "—"} />
                <ConsoleMetric label="KM/H" value={telemetry.speedKmh?.toFixed(1) ?? "—"} />
                <ConsoleMetric label="WATTS" value={telemetry.powerW?.toFixed(0) ?? "—"} />
                <ConsoleMetric label="LEVEL" value={telemetry.resistance?.toFixed(0) ?? "—"} />
                <ConsoleMetric label="BPM" value={telemetry.heartRate?.toFixed(0) ?? "—"} />
              </div>
            ) : (
              <p>{webBluetoothHint() === "ios"
                ? "Sur iPhone/iPad, la PWA reste en mode guidé. Les données affichées par le vélo pourront être saisies en quelques secondes à la fin de la séance."
                : "Connecte un vélo FTMS compatible pour enregistrer automatiquement les données diffusées."}</p>
            )}
            {bike && (
              <div className="capabilityStrip">
                <span className={bike.capabilities.indoorBikeData ? "ok" : ""}>Télémétrie</span>
                <span className={bike.capabilities.controlPoint ? "ok" : ""}>Control Point</span>
                <span className={bike.capabilities.supportsResistanceTarget ? "ok" : ""}>Résistance pilotable</span>
                {bike.capabilities.resistanceRange && <span className="ok">Plage {bike.capabilities.resistanceRange.min}–{bike.capabilities.resistanceRange.max}</span>}
              </div>
            )}
            {!bike && <button className="secondary" onClick={connectBike} disabled={connectingBike}>{connectingBike ? "Recherche du vélo…" : "Connecter le vélo"}</button>}
            {bluetoothError && <p className="errorText">{bluetoothError}</p>}
          </section>

          <section className="card coachCard">
            <div className="sectionHead">
              <div><p className="eyebrow">COACH EXPRESS</p><h2>Combien de temps et quelle énergie ?</h2></div>
              <span className="coachStatus">{online ? "● prêt" : "○ hors ligne"}</span>
            </div>
            <div className="coachSelectors">
              <div><small>Temps disponible</small><div className="choiceRow">{[20,30,35,45,60].map((minutes) => <button key={minutes} className={availableMinutes === minutes ? "choice active" : "choice"} onClick={() => setAvailableMinutes(minutes)}>{minutes} min</button>)}</div></div>
              <div><small>Énergie du jour</small><div className="choiceRow">
                <button className={energy === "easy" ? "choice active" : "choice"} onClick={() => setEnergy("easy")}>🌿 tranquille</button>
                <button className={energy === "normal" ? "choice active" : "choice"} onClick={() => setEnergy("normal")}>⚡ normal</button>
                <button className={energy === "hard" ? "choice active" : "choice"} onClick={() => setEnergy("hard")}>🔥 à fond</button>
              </div></div>
            </div>
            <div className="coachRecommendation">
              <div>
                <p className="eyebrow">RECOMMANDATION</p>
                <h2>{recommendation.name}</h2>
                <p>{recommendation.tagline}</p>
                <div className="chips"><span>{recommendation.duration} min</span><span>{recommendation.points} pts</span><span>{recommendation.xp} XP</span><span>{recommendation.intensity === "hard" ? "intense" : recommendation.intensity === "moderate" ? "soutenu" : "facile"}</span></div>
              </div>
              <button className="primary" onClick={() => launch(recommendation)}>Préparer la séance</button>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">BONUS</p><h2>Une petite marge ?</h2></div><span className="spark">+20 XP</span></div>
            <p>Ajoute 15 minutes faciles. Elles comptent dans ton volume et ta régularité, mais pas dans les points principaux. Les bonus XP sont plafonnés à 60 par semaine.</p>
            <div className="bonusChoices">
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-10")!)}>10 min</button>
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-15")!)}>15 min</button>
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-20")!)}>20 min</button>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">GARDE-FOU</p><h2>Charge intense</h2></div><strong>{stats.hard}/{target.maxHard}</strong></div>
            <p>{stats.hard > target.maxHard ? "Tu as dépassé le plafond conseillé : privilégie l'endurance ou le décrassage." : "Une semaine parfaite respecte aussi le plafond de séances intenses."}</p>
          </section>
        </>
      )}

      {tab === "sessions" && (
        <section>
          <div className="pageHead pageHeadActions"><div><p className="eyebrow">CATALOGUE</p><h1>Choisis ta quête</h1><p>Du décrassage au HIIT. Le ressenti reste prioritaire sur le numéro de résistance.</p></div><button className="secondary" onClick={openManualLog}>+ Enregistrer une séance déjà faite</button></div>
          <div className="grid workoutGrid">
            {workouts.map((w) => (
              <article className={`card workoutCard ${w.bonus ? "bonusCard" : ""}`} key={w.id}>
                <div className="sectionHead"><span className={`intensity ${w.intensity}`}>{w.intensity === "easy" ? "FACILE" : w.intensity === "moderate" ? "SOUTENU" : "DUR"}</span><strong>{w.duration} min</strong></div>
                <h2>{w.name}</h2><p>{w.tagline}</p>
                <div className="chips"><span>{w.points} pts</span><span>{w.xp} XP</span><span>{w.segments.length} segments</span></div>
                <button className="secondary" onClick={() => launch(w)}>Voir / démarrer</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "climbs" && (
        <section>
          <div className="pageHead"><p className="eyebrow">COLS & PARCOURS</p><h1>Change ton salon en montagne.</h1><p>Profil, carte et résistance conseillée. Importe aussi n’importe quel fichier GPX pour créer ton propre parcours.</p></div>

          <section className="card gpxImport">
            <div>
              <p className="eyebrow">IMPORT GPX</p>
              <h2>Une route réelle devient une quête.</h2>
              <p>VeloQuest calcule la distance, le D+, les pentes lissées, le profil altimétrique et les niveaux TEB5. Le fichier reste sur ton appareil.</p>
            </div>
            <label className="primary gpxButton">Choisir un fichier GPX<input type="file" accept=".gpx,application/gpx+xml" onChange={(e) => importGpx(e.target.files?.[0])} /></label>
            {gpxError && <p className="errorText">{gpxError}</p>}
          </section>

          <div className="climbList">
            {allClimbs.map((climb) => (
              <article className="card climbCard" key={climb.id}>
                <div className="climbHeader">
                  <div><p className="eyebrow">{climb.region.toUpperCase()}</p><h2>{climb.name}</h2><p>{climb.subtitle}</p></div>
                  <div className="climbReward"><strong>+{climb.xp}</strong><small>XP</small></div>
                </div>
                <div className="climbStats">
                  <span><strong>{climb.distanceKm.toFixed(1)}</strong> km</span>
                  <span><strong>{climb.elevationGainM}</strong> m D+</span>
                  <span><strong>{climb.avgGrade.toFixed(1)} %</strong> moyen</span>
                  <span><strong>{climb.maxGrade} %</strong> max</span>
                </div>
                <ClimbProfile climb={climb} />
                <RouteMap climb={climb} />
                <p className="finePrint">{climb.note}</p>
                <div className="timeAttackSummary">
                  <span><small>TIME ATTACK</small><strong>{personalBest(state.sessions, climb.id)?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(personalBest(state.sessions, climb.id)!.metrics!.elapsedSeconds!) : "Aucun chrono"}</strong></span>
                  <span><small>TENTATIVES</small><strong>{routeAttempts(state.sessions, climb.id).length}</strong></span>
                  <span><small>MODE PRÉCIS</small><strong>{bike ? "FTMS prêt" : "simulation"}</strong></span>
                </div>
                <div className="climbActions">
                  <button className="primary" onClick={() => launch(climbToWorkout(climb), climb, "training")}>Entraînement</button>
                  <button className="secondary timeAttackButton" onClick={() => launch(climbToWorkout(climb), climb, "timeAttack")}>⏱ Time Attack</button>
                  {climb.id.startsWith("gpx-") && <button className="secondary dangerButton" onClick={() => deleteCustomClimb(climb.id)}>Supprimer</button>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "progress" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PROGRESSION</p><h1>Mesures & journal</h1></div>
          <div className="grid twoCols">
            <section className="card">
              <h2>Nouvelle mesure</h2>
              <form action={addMeasurement} className="form">
                <label>Poids (kg)<input name="weight" type="number" step="0.1" placeholder={latestWeight?.toString() || "ex. 118.4"} /></label>
                <label>Tour de taille (cm)<input name="waist" type="number" step="0.1" placeholder={latestWaist?.toString() || "ex. 112"} /></label>
                <label>Tour abdominal (cm)<input name="abdomen" type="number" step="0.1" placeholder={latestAbdomen?.toString() || "ex. 116"} /></label>
                <button className="primary" type="submit">Enregistrer</button>
              </form>
            </section>
            <section className="card">
              <h2>Objectifs</h2>
              <div className="metricBig"><span>Poids</span><strong>{latestWeight ?? state.profile.startWeight ?? "—"} kg</strong><small>objectif {state.profile.targetWeight ?? "—"} kg</small></div>
              <div className="metricBig"><span>Tour de taille</span><strong>{latestWaist ?? state.profile.startWaist ?? "—"} cm</strong><small>objectif {state.profile.targetWaist ?? "—"} cm</small></div>
            </section>
          </div>

          <div className="grid twoCols chartGrid">
            <MetricChart title="Poids" points={weightPoints} unit="kg" target={state.profile.targetWeight} />
            <MetricChart title="Tour de taille" points={waistPoints} unit="cm" target={state.profile.targetWaist} />
          </div>

          <section className="card">
            <h2>Journal des séances</h2>
            <div className="sessionHistory">
              {[...state.sessions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,20).map((session) => {
                const template = workouts.find((w) => w.id === session.templateId);
                const route = allClimbs.find((c) => c.id === session.routeId);
                return (
                  <button className="sessionHistoryRow" key={session.id} onClick={() => setSelectedSessionId(session.id)}>
                    <span>{dateLabel(session.date)}</span>
                    <div><strong>{route?.name ?? template?.name ?? session.templateId}</strong><small>{session.duration} min · {session.metrics?.source ?? "manuel"}</small></div>
                    <div className="historyMetrics">
                      {session.metrics?.distanceKm !== undefined && <span>{session.metrics.distanceKm.toFixed(1)} km</span>}
                      {session.metrics?.avgPowerW !== undefined && <span>{session.metrics.avgPowerW.toFixed(0)} W</span>}
                      {session.metrics?.avgHeartRate !== undefined && <span>{session.metrics.avgHeartRate.toFixed(0)} bpm</span>}
                      {session.rpe !== undefined && <span>RPE {session.rpe}</span>}
                      <span>›</span>
                    </div>
                  </button>
                );
              })}
              {!state.sessions.length && <p>Aucune séance enregistrée pour l’instant.</p>}
            </div>
          </section>

          <section className="card">
            <h2>Dernières mesures</h2>
            <div className="history">
              {[...state.measurements].sort((a,b) => b.date.localeCompare(a.date)).slice(0,12).map((m) => (
                <div key={m.id}><span>{dateLabel(m.date)}</span><strong>{m.weight ? `${m.weight} kg` : "—"}</strong><span>{m.waist ? `${m.waist} cm taille` : "—"}</span></div>
              ))}
              {!state.measurements.length && <p>Aucune mesure pour l'instant.</p>}
            </div>
          </section>
        </section>
      )}

      {tab === "more" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PLUS</p><h1>Réglages, badges & données</h1><p>Tout ce qui personnalise VeloQuest sans encombrer la navigation principale.</p></div>

          <InstallCard />

          <section className="card quickGuide">
            <div className="sectionHead"><div><p className="eyebrow">GUIDE RAPIDE</p><h2>Une routine simple</h2></div><span className="spark">4 étapes</span></div>
            <div className="guideSteps">
              <div><span>1</span><p><strong>Choisis selon ton temps.</strong><small>Le Coach Express adapte la séance au créneau et à ton énergie.</small></p></div>
              <div><span>2</span><p><strong>Respecte surtout le RPE.</strong><small>Le niveau TEB5 est un repère ; utilise la calibration globale s’il est trop facile ou trop dur.</small></p></div>
              <div><span>3</span><p><strong>Enregistre la séance.</strong><small>Bluetooth si disponible, sinon recopie simplement les chiffres utiles du vélo.</small></p></div>
              <div><span>4</span><p><strong>Suis les tendances.</strong><small>Poids, tour de taille, régularité et volume comptent davantage qu’une valeur isolée.</small></p></div>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">CONFORT DE SÉANCE</p><h2>Ton cockpit</h2></div><span className="spark">personnalisable</span></div>
            <div className="toggleList">
              <Toggle label="Signaux sonores" description="Un bip à chaque changement de segment." checked={preferences.soundCues} onChange={(v) => updatePreference("soundCues", v)} />
              <Toggle label="Annonces vocales" description="Annonce le segment et le niveau de résistance." checked={preferences.voiceCues} onChange={(v) => updatePreference("voiceCues", v)} />
              <Toggle label="Retour haptique" description="Vibration si le navigateur et l’appareil le permettent." checked={preferences.haptics} onChange={(v) => updatePreference("haptics", v)} />
              <Toggle label="Garder l’écran éveillé" description="Empêche la mise en veille pendant une séance quand l’API est disponible." checked={preferences.keepScreenAwake} onChange={(v) => updatePreference("keepScreenAwake", v)} />
              <Toggle label="Conserver la trace Bluetooth" description="Garde une trace compacte de la télémétrie pour l’historique." checked={preferences.keepTelemetryTrace} onChange={(v) => updatePreference("keepTelemetryTrace", v)} />
              <div className="resistanceCalibration">
                <div><strong>Calibration résistance TEB5</strong><small>Ajuste tous les niveaux guidés et automatiques sans modifier les séances.</small></div>
                <span>{preferences.resistanceOffset > 0 ? `+${preferences.resistanceOffset}` : preferences.resistanceOffset}</span>
                <input type="range" min="-4" max="4" step="1" value={preferences.resistanceOffset} onChange={(event) => updateResistanceOffset(Number(event.target.value))} />
                <div className="calibrationLabels"><small>plus facile</small><button className="secondary miniButton" onClick={() => updateResistanceOffset(0)}>neutre</button><small>plus dur</small></div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">BLUETOOTH LAB</p><h2>{bike ? bike.deviceName : "Diagnostic FTMS"}</h2></div><span className={bike ? "connectionState onlineText" : "connectionState"}>{bike ? "CONNECTÉ" : "OFFLINE"}</span></div>
            {bike ? (
              <>
                <div className="consoleMetrics compact">
                  <ConsoleMetric label="RPM" value={telemetry.cadenceRpm?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="WATTS" value={telemetry.powerW?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="LEVEL" value={telemetry.resistance?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="BPM" value={telemetry.heartRate?.toFixed(0) ?? "—"} />
                </div>
                <div className="diagnosticGrid">
                  <span><small>FTMS</small><strong>{bike.capabilities.ftms ? "OK" : "—"}</strong></span>
                  <span><small>Control Point</small><strong>{bike.capabilities.controlPoint ? "OK" : "non"}</strong></span>
                  <span><small>Résistance cible</small><strong>{bike.capabilities.supportsResistanceTarget ? "oui" : "non détectée"}</strong></span>
                  <span><small>Plage</small><strong>{bike.capabilities.resistanceRange ? `${bike.capabilities.resistanceRange.min}–${bike.capabilities.resistanceRange.max}` : "inconnue"}</strong></span>
                </div>
                <p className="finePrint">Le pilotage automatique reste verrouillé jusqu’à validation sur le TEB5 réel. Le laboratoire ci-dessous permet seulement un test manuel et explicite.</p>
                {bike.capabilities.supportsResistanceTarget && bike.requestControl && bike.setResistance && (
                  <div className="controlLab">
                    <div className="sectionHead"><div><small>LABORATOIRE DE CONTRÔLE</small><strong>{controlGranted ? "Contrôle accordé" : "Contrôle non demandé"}</strong></div><span className={controlGranted ? "labState ok" : "labState"}>{controlGranted ? "ARMÉ" : "VERROUILLÉ"}</span></div>
                    {!controlGranted ? (
                      <button className="secondary" onClick={requestBikeControl}>Demander le contrôle FTMS</button>
                    ) : (
                      <>
                        <label>Niveau de test <strong>{testResistanceLevel}</strong><input type="range" min={bike.capabilities.resistanceRange?.min ?? 1} max={bike.capabilities.resistanceRange?.max ?? 32} step={bike.capabilities.resistanceRange?.increment || 1} value={testResistanceLevel} onChange={(e) => setTestResistanceLevel(Number(e.target.value))} /></label>
                        <button className="secondary" onClick={sendTestResistance}>Envoyer ce niveau au vélo</button>
                        <Toggle label="Auto-résistance pour cette connexion" description="À chaque changement de segment, VeloQuest envoie le niveau cible au vélo. Désactivé automatiquement en cas d’erreur." checked={autoResistanceControl} onChange={setAutoResistanceControl} />
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p>{webBluetoothHint() === "ios" ? "iOS n’expose pas Web Bluetooth aux PWA. VeloQuest reste utilisable en mode guidé et saisie manuelle." : "Connecte le vélo pour inspecter précisément les caractéristiques FTMS qu’il expose."}</p>
                <button className="secondary" onClick={connectBike} disabled={connectingBike}>{connectingBike ? "Recherche…" : "Lancer le diagnostic Bluetooth"}</button>
              </>
            )}
          </section>

          <section>
            <div className="sectionHead subsectionTitle"><div><p className="eyebrow">GAMIFICATION</p><h2>Badges</h2></div><strong>{allBadges.filter((b) => b.unlocked).length}/{allBadges.length}</strong></div>
            <div className="grid badgeGrid">
              {allBadges.map((b) => (
                <article className={`card badge ${b.unlocked ? "unlocked" : ""}`} key={b.id}>
                  <span className="badgeIcon">{b.icon}</span><div><h2>{b.name}</h2><p>{b.description}</p><small>{b.unlocked ? "Débloqué" : b.progress}</small></div>
                </article>
              ))}
            </div>
          </section>

          <section className="card actionStack">
            <div><p className="eyebrow">DONNÉES LOCALES</p><h2>Profil & sauvegardes</h2><p>Les données restent sur cet appareil tant que tu ne les exportes pas.</p></div>
            <button className="secondary" onClick={() => setShowSetup(true)}>Modifier le profil et les objectifs</button>
            <div className="storageMeter"><span>Empreinte locale</span><strong>{localBytes < 1024 * 1024 ? `${Math.max(1, Math.round(localBytes / 1024))} Ko` : `${(localBytes / 1024 / 1024).toFixed(2)} Mo`}</strong></div>
            <button className="secondary" onClick={exportData}>Exporter une sauvegarde JSON v3</button>
            <button className="secondary" onClick={exportCsv}>Exporter séances + mesures en CSV</button>
            <label className="secondary fileButton">Importer une sauvegarde<input type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} /></label>
            <Link href="/confidentialite" className="secondary linkButton">Confidentialité & stockage local</Link>
            <button className="secondary dangerButton" onClick={resetLocalData}>Réinitialiser les données de cet appareil</button>
          </section>
        </section>
      )}

      <nav className="bottomNav" aria-label="Navigation principale">
        <NavButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon="⌂" label="Quête" />
        <NavButton active={tab === "sessions"} onClick={() => setTab("sessions")} icon="⚡" label="Séances" />
        <NavButton active={tab === "climbs"} onClick={() => setTab("climbs")} icon="▲" label="Parcours" />
        <NavButton active={tab === "progress"} onClick={() => setTab("progress")} icon="↗" label="Suivi" />
        <NavButton active={tab === "more"} onClick={() => setTab("more")} icon="•••" label="Plus" />
      </nav>

      {active && (
        <div className="modalBackdrop">
          <div className={`sessionModal ${activeClimb ? "climbSession" : ""}`}>
            <button className="close" aria-label="Fermer la séance" onClick={() => { setActive(null); setActiveClimb(null); setRunning(false); setSessionStarted(false); }}>×</button>

            {showFinish ? (
              <form action={finishActive} className="finishForm">
                <p className="eyebrow">JOURNAL DE SÉANCE</p>
                <h2>Enregistre ta performance</h2>
                {routeMode === "timeAttack" && activeClimb && (
                  <div className="raceFinishBanner">
                    <span><small>CHRONO</small><strong>{formatRaceTime(timeAttackElapsedSeconds)}</strong></span>
                    <span><small>RECORD AVANT DÉPART</small><strong>{routeBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(routeBest.metrics.elapsedSeconds) : "première tentative"}</strong></span>
                  </div>
                )}
                {telemetrySamples.length > 0 && <p className="connectedNotice">✓ {telemetrySamples.length} échantillons FTMS récupérés. Les champs connus sont préremplis.</p>}
                <div className="form">
                  <div className="formRow">
                    {routeMode === "timeAttack" && activeClimb
                      ? <label>Chrono final (secondes)<input name="elapsedSeconds" type="number" step="1" defaultValue={timeAttackElapsedSeconds || undefined} /></label>
                      : <label>Durée (min)<input name="duration" type="number" step="1" defaultValue={active.duration} /></label>}
                    <label>RPE ressenti /10<input name="rpe" type="number" min="1" max="10" step="0.5" /></label>
                  </div>
                  <div className="formRow">
                    <label>Distance (km)<input name="distance" type="number" step="0.01" defaultValue={autoMetrics.distanceKm?.toFixed(2)} /></label>
                    <label>Calories affichées<input name="calories" type="number" step="1" /></label>
                  </div>
                  <div className="formRow">
                    <label>Vitesse moyenne<input name="avgSpeed" type="number" step="0.1" defaultValue={autoMetrics.avgSpeedKmh?.toFixed(1)} /></label>
                    <label>RPM moyen<input name="avgCadence" type="number" step="1" defaultValue={autoMetrics.avgCadenceRpm?.toFixed(0)} /></label>
                  </div>
                  <div className="formRow">
                    <label>Puissance moyenne (W)<input name="avgPower" type="number" step="1" defaultValue={autoMetrics.avgPowerW?.toFixed(0)} /></label>
                    <label>FC moyenne (bpm)<input name="avgHeartRate" type="number" step="1" defaultValue={autoMetrics.avgHeartRate?.toFixed(0)} /></label>
                  </div>
                  <label>Note<input name="note" placeholder="Jambes, sommeil, difficulté, réglage…" /></label>
                  <button className="primary" type="submit">Valider la quête · +{active.xp} XP</button>
                </div>
              </form>
            ) : !sessionStarted ? (
              <div className="sessionPreview">
                <p className="eyebrow">{activeClimb ? (routeMode === "timeAttack" ? "TIME ATTACK" : "PARCOURS") : "PRÉPARATION"}</p>
                <h2>{active.name}</h2>
                <p className="previewDescription">{active.description}</p>
                <div className="previewStats">
                  <span><small>{routeMode === "timeAttack" && activeClimb ? "Record" : "Durée"}</small><strong>{routeMode === "timeAttack" && activeClimb ? (routeBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(routeBest.metrics.elapsedSeconds) : "à établir") : `${active.duration} min`}</strong></span>
                  <span><small>Intensité</small><strong>{active.intensity === "hard" ? "dure" : active.intensity === "moderate" ? "soutenue" : "facile"}</strong></span>
                  <span><small>Récompense</small><strong>+{active.xp} XP</strong></span>
                  <span><small>Segments</small><strong>{active.segments.length}</strong></span>
                </div>
                {bike && <div className="connectedNotice">✓ {bike.deviceName} connecté · télémétrie automatique activée</div>}
                {routeMode === "timeAttack" && activeClimb && (
                  <div className="timeAttackIntro">
                    <strong>{bike ? "Mode FTMS précis" : "Mode simulation"}</strong>
                    <p>{bike
                      ? "La distance réelle pilote la position, les pentes, les splits et le ghost. Le chrono ne se met pas en pause."
                      : "Sans distance Bluetooth, le profil avance sur le scénario temporel. Tu pourras saisir le chrono réel du vélo à l’arrivée."}</p>
                  </div>
                )}
                <div className="segmentPlan">
                  {active.segments.map((segment, index) => (
                    <button key={index} type="button" onClick={() => goToSegment(index)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{segment.label}</strong><small>{segment.minutes} min · niveau {adjustedResistance(segment.resistance, preferences.resistanceOffset)} · RPE {segment.rpe}</small></div>
                    </button>
                  ))}
                </div>
                <div className="previewFooter">
                  <span>{preferences.keepScreenAwake ? "☀ écran actif" : "écran standard"} · {preferences.voiceCues ? "voix active" : preferences.soundCues ? "bips actifs" : "silencieux"}</span>
                  <button className="primary bigStart" onClick={beginSession}>{routeMode === "timeAttack" && activeClimb ? "Lancer le chrono" : "Démarrer la séance"}</button>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">{activeClimb ? "COL DE LÉGENDE" : active.name.toUpperCase()}</p>
                <h2>{active.segments[segmentIndex].label}</h2>

                {activeClimb && (
                  <>
                    <div className="climbLiveTitle"><strong>{activeClimb.name}</strong><span>{currentRouteKm.toFixed(1)} / {activeClimb.distanceKm.toFixed(1)} km</span></div>
                    {routeMode === "timeAttack" && (
                      <div className="timeAttackHud">
                        <span><small>CHRONO</small><strong>{formatRaceTime(timeAttackElapsedSeconds)}</strong></span>
                        <span className={ghostDelta === undefined ? "" : ghostDelta <= 0 ? "ahead" : "behind"}><small>VS PB</small><strong>{ghostDelta === undefined ? "—" : `${ghostDelta > 0 ? "+" : "−"}${formatRaceTime(Math.abs(ghostDelta))}`}</strong></span>
                        <span><small>PB</small><strong>{routeBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(routeBest.metrics.elapsedSeconds) : "—"}</strong></span>
                      </div>
                    )}
                    <ClimbProfile climb={activeClimb} progress={climbProgress} ghostProgress={routeMode === "timeAttack" && routeBest?.metrics?.elapsedSeconds ? Math.min(1, timeAttackElapsedSeconds / routeBest.metrics.elapsedSeconds) : undefined} />
                    <RouteMap climb={activeClimb} progress={climbProgress} ghostProgress={routeMode === "timeAttack" && routeBest?.metrics?.elapsedSeconds ? Math.min(1, timeAttackElapsedSeconds / routeBest.metrics.elapsedSeconds) : undefined} />
                    {routeMode === "timeAttack" && (
                      <div className="checkpointStrip">
                        {routeCheckpoints.map((km, index) => {
                          const split = timeAttackSplits.find((item) => item.km === km);
                          return <span key={km} className={split ? "passed" : ""}><small>{index < 3 ? `${(index + 1) * 25}%` : "ARRIVÉE"}</small><strong>{split ? formatRaceTime(split.elapsedSeconds) : `${km.toFixed(1)} km`}</strong></span>;
                        })}
                      </div>
                    )}
                  </>
                )}

                <div className="resistance">
                  <small>NIVEAU TEB5</small>
                  <strong>{adjustedResistance(active.segments[segmentIndex].resistance, preferences.resistanceOffset)}</strong>
                </div>
                <div className="timer" aria-live="off">{formatClock(secondsLeft)}</div>
                <div className="sessionOverall">
                  <div><span>Segment {segmentIndex + 1}/{active.segments.length}</span><strong>{sessionProgressPercent}%</strong></div>
                  <i><b style={{ width: `${sessionProgressPercent}%` }} /></i>
                  {autoResistanceControl && controlGranted && <small>AUTO LEVEL ACTIF</small>}
                </div>
                <div className="segmentMeta"><span>RPE {active.segments[segmentIndex].rpe}</span>{active.segments[segmentIndex].cadence && <span>Cible {active.segments[segmentIndex].cadence} tr/min</span>}</div>
                {bike && (
                  <div className="liveStrip">
                    <span><small>RPM</small><strong>{telemetry.cadenceRpm?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>W</small><strong>{telemetry.powerW?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>KM/H</small><strong>{telemetry.speedKmh?.toFixed(1) ?? "—"}</strong></span>
                    <span><small>BPM</small><strong>{telemetry.heartRate?.toFixed(0) ?? "—"}</strong></span>
                  </div>
                )}
                {active.segments[segmentIndex + 1] && (
                  <div className="nextSegment"><small>ENSUITE</small><strong>{active.segments[segmentIndex + 1].label}</strong><span>niveau {adjustedResistance(active.segments[segmentIndex + 1].resistance, preferences.resistanceOffset)}</span></div>
                )}
                {active.segments.length <= 30 && <div className="segmentProgress">{active.segments.map((_, i) => <i key={i} className={i <= segmentIndex ? "done" : ""} />)}</div>}
                <div className="modalActions three">
                  <button className="secondary" disabled={segmentIndex === 0} onClick={() => goToSegment(segmentIndex - 1)}>← Précédent</button>
                  {routeMode === "timeAttack" && activeClimb
                    ? <button className="primary" disabled>Chrono actif</button>
                    : <button className="primary" onClick={togglePause}>{running ? "Pause" : "Reprendre"}</button>}
                  <button className="secondary" disabled={segmentIndex >= active.segments.length - 1} onClick={() => goToSegment(segmentIndex + 1)}>Suivant →</button>
                </div>
                <button className="finish" onClick={() => { setRunning(false); setShowFinish(true); }}>Terminer et enregistrer</button>
              </>
            )}
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="modalBackdrop" onClick={() => setSelectedSessionId(null)}>
          <section className="sessionModal historyDetail" onClick={(event) => event.stopPropagation()}>
            <button className="close" aria-label="Fermer le détail" onClick={() => setSelectedSessionId(null)}>×</button>
            <p className="eyebrow">JOURNAL</p>
            <h2>{selectedRoute?.name ?? selectedTemplate?.name ?? selectedSession.templateId}</h2>
            <p className="detailDate">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(selectedSession.date))}</p>
            <div className="detailMetrics">
              <DetailMetric label={selectedSession.metrics?.timeAttack ? "Time Attack" : "Durée"} value={selectedSession.metrics?.elapsedSeconds !== undefined ? formatRaceTime(selectedSession.metrics.elapsedSeconds) : `${selectedSession.duration.toFixed(1)} min`} />
              <DetailMetric label="Distance" value={selectedSession.metrics?.distanceKm !== undefined ? `${selectedSession.metrics.distanceKm.toFixed(2)} km` : "—"} />
              <DetailMetric label="Calories" value={selectedSession.metrics?.calories !== undefined ? `${selectedSession.metrics.calories} kcal` : "—"} />
              <DetailMetric label="RPE" value={selectedSession.rpe !== undefined ? `${selectedSession.rpe}/10` : "—"} />
              <DetailMetric label="RPM moyen" value={selectedSession.metrics?.avgCadenceRpm?.toFixed(0) ?? "—"} />
              <DetailMetric label="RPM max" value={selectedSession.metrics?.maxCadenceRpm?.toFixed(0) ?? "—"} />
              <DetailMetric label="Puissance moy." value={selectedSession.metrics?.avgPowerW !== undefined ? `${selectedSession.metrics.avgPowerW.toFixed(0)} W` : "—"} />
              <DetailMetric label="Puissance max" value={selectedSession.metrics?.maxPowerW !== undefined ? `${selectedSession.metrics.maxPowerW.toFixed(0)} W` : "—"} />
              <DetailMetric label="FC moyenne" value={selectedSession.metrics?.avgHeartRate !== undefined ? `${selectedSession.metrics.avgHeartRate.toFixed(0)} bpm` : "—"} />
              <DetailMetric label="FC max" value={selectedSession.metrics?.maxHeartRate !== undefined ? `${selectedSession.metrics.maxHeartRate.toFixed(0)} bpm` : "—"} />
              <DetailMetric label="Résistance moy." value={selectedSession.metrics?.avgResistance?.toFixed(1) ?? "—"} />
              <DetailMetric label="Source" value={selectedSession.metrics?.source ?? "manuel"} />
            </div>
            {selectedSession.metrics?.timeAttack && selectedSession.metrics.checkpointSplits?.length ? (
              <div className="detailSplits">{selectedSession.metrics.checkpointSplits.map((split) => <span key={split.km}><small>{split.km.toFixed(1)} km</small><strong>{formatRaceTime(split.elapsedSeconds)}</strong></span>)}</div>
            ) : null}
            {selectedSession.note && <div className="sessionNote"><small>NOTE</small><p>{selectedSession.note}</p></div>}
            {selectedSession.metrics?.samples?.length ? <p className="finePrint">{selectedSession.metrics.samples.length} points de télémétrie compactés sont conservés avec cette séance.</p> : null}
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      {showSetup && (
        <div className="modalBackdrop">
          <form action={saveProfile} className="sessionModal setupModal">
            <Image src="/logo.svg" alt="" width={64} height={64} className="setupLogo" />
            <p className="eyebrow">BIENVENUE DANS VELOQUEST</p>
            <h2>Configure ta quête</h2>
            <div className="form">
              <label>Prénom ou pseudo<input name="name" defaultValue={state.profile.name} placeholder="Ton nom" /></label>
              <label>Date de départ<input name="startDate" type="date" defaultValue={state.profile.startDate} required /></label>
              <div className="formRow">
                <label>Poids de départ<input name="startWeight" type="number" step="0.1" defaultValue={state.profile.startWeight} /></label>
                <label>Objectif poids<input name="targetWeight" type="number" step="0.1" defaultValue={state.profile.targetWeight} /></label>
              </div>
              <div className="formRow">
                <label>Tour de taille départ<input name="startWaist" type="number" step="0.1" defaultValue={state.profile.startWaist} /></label>
                <label>Objectif tour de taille<input name="targetWaist" type="number" step="0.1" defaultValue={state.profile.targetWaist} /></label>
              </div>
              <button className="primary" type="submit">Entrer dans VeloQuest</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function MissionItem({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  const done = value >= target;
  return <div className={done ? "missionItem done" : "missionItem"}><span>{done ? "✓" : "•"}</span><div><strong>{label}</strong><small>{value}{suffix} / {target}{suffix}</small></div></div>;
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return <span><small>{label}</small><strong>{value}</strong></span>;
}

function ConsoleMetric({ label, value }: { label: string; value: string }) {
  return <div className="consoleMetric"><small>{label}</small><strong>{value}</strong></div>;
}

function Stat({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  return <article className="card stat"><span>{label}</span><strong>{value}{suffix}</strong><small>objectif {target}{suffix}</small><div className="bar"><i style={{ width: `${pct(value, target)}%` }} /></div></article>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggleRow">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button className={active ? "active" : ""} onClick={onClick} aria-current={active ? "page" : undefined}><span>{icon}</span><small>{label}</small></button>;
}
