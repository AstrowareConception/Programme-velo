"use client";

import { CadenceCalibration } from "@/components/CadenceCalibration";
import { AdaptiveProgram } from "@/components/AdaptiveProgram";
import { WeeklyReview, SessionDebrief } from "@/components/WeeklyReview";
import { MasteryPanel } from "@/components/MasteryPanel";
import { PersonalJourneys } from "@/components/PersonalJourneys";
import { BackupTransfer, BackupPaste } from "@/components/BackupTransfer";
import { CalorieResult } from "@/components/CalorieResult";
import { isCalorieWorkout, startCalories, sampleCalories, measuredCaloriesEligible, bestCalorieAttempt, type CalorieAttempt, type CalorieResult as CalorieResultType } from "@/lib/calorie-challenge";
import { VoiceCommands } from "@/components/VoiceCommands";
import { BleDiagnosticPanel } from "@/components/BleDiagnosticPanel";
import Image from "next/image";
import { WeeklyGoalsForm } from "@/components/WeeklyGoalsForm";
import { EffortProfile } from "@/components/EffortProfile";
import { CoachComparison } from "@/components/CoachComparison";
import { CadenceResult } from "@/components/CadenceResult";
import { withCadenceOffset, addCadenceInterval, bestCadenceAttempt, cadenceSummary, effortSettingsKey, emptyCadenceScore, numericRange, resistanceTarget } from "@/lib/effort";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, CompletedSession, Measurement, Preferences, TelemetrySample, TimeAttackSplit, VoyagePortion, WorkoutTemplate } from "@/lib/types";
import { VoyagePanel } from "@/components/VoyagePanel";
import { voyagePlan, voyageProgress, voyageWorkout } from "@/lib/voyage";
import { validVoyagePortion } from "@/lib/voyage-progress";
import { useBikeController } from "@/components/useBikeController";
import { webBluetoothHint } from "@/lib/bike-adapters";
import { ClimbProfile } from "@/components/ClimbProfile";
import { RouteMap } from "@/components/RouteMap";
import { RoutePlaces } from "@/components/RoutePlaces";
import { RoutePhotos } from "@/components/RoutePhotos";
import { WorkoutProgramsPanel } from "@/components/WorkoutProgramsPanel";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { GettingStartedCard } from "@/components/GettingStartedCard";
import { firstGuidedWorkout, guidanceCandidates, guidanceSessions, initialGuidance } from "@/lib/onboarding";
import { MetricChart } from "@/components/MetricChart";
import { InstallCard } from "@/components/InstallCard";
import { PwaStatusCard, usePwa } from "@/components/PwaProvider";
import { ReaderViewChoice, SessionComfort } from "@/components/SessionComfort";
import { screenWakeLabel, useScreenWakeLock } from "@/components/useScreenWakeLock";
import { PerformanceRecords, SectorAnalysis } from "@/components/PerformancePanel";
import { ProgressionPalmares } from "@/components/ProgressionPalmares";
import { CampaignsPanel } from "@/components/CampaignsPanel";
import { RouteThemesPanel } from "@/components/RouteThemesPanel";
import { routeThemes } from "@/lib/route-themes";
import { recommendAdaptiveWorkout } from "@/lib/coach";
import {
  climbs,
  climbToWorkout,
  routeSegmentWorkout,
  routeCategory,
  routeDifficulty,
  routeSearchText,
  routeTerrain,
  type ClimbChallenge,
  type RouteCategory
} from "@/lib/routes";
import { parseGpxFile } from "@/lib/gpx";
import {
  STORAGE_KEY,
  badges,
  currentProgramWeek,
  emptyState,
  levelForXp,
  totalXp,
  weekTargetFor,
  changeWeeklyGoals,
  weeklyStats,
  sessionsForProgramWeek,
  workouts,
  streak,
  isPerfectWeek,
  defaultPreferences,
  levelTitle
} from "@/lib/data";
import { localInputDate, localInputDateTime, localDateToIso } from "@/lib/dates";
import { counterDelta } from "@/lib/session";
import { compactTelemetry, formatClock } from "@/lib/session";
import { cueCoach, adjustedResistance, cueSegment, prepareCueAudio, releaseCueAudio } from "@/lib/session-cues";
import { createBackup, estimateLocalBytes, normalizeState, parseBackup, safeLocalStorageWrite } from "@/lib/storage";
import { captureSplits, checkpointKilometers, formatRaceTime, ghostDeltaSeconds, ghostDistanceAtElapsed, personalBest, routeAttempts, segmentAttempts, segmentBounds, segmentPersonalBest } from "@/lib/time-attack";
import { challengesForRoute, evaluateRouteChallenge, routeChallenges, type RouteChallenge } from "@/lib/challenges";
import {
  clearActiveSessionSnapshot,
  readActiveSessionSnapshot,
  restoreSessionSnapshot,
  writeActiveSessionSnapshot,
  type ActiveSessionSnapshot
} from "@/lib/session-recovery";

type Tab = "dashboard" | "sessions" | "climbs" | "progress" | "more";
type Energy = "easy" | "normal" | "hard";
type RouteMode = "training" | "timeAttack" | "segmentAttack" | "voyage";
const CUSTOM_ROUTES_KEY = "veloquest:custom-routes:v1";

function pct(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function quantity(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
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

function n(form: FormData, key: string) {
  const raw = String(form.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function VeloQuestApp() {
  const pwa = usePwa();
  const [state, setState] = useState<AppState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [stateSaveFailed, setStateSaveFailed] = useState(false);
  const [routesSaveFailed, setRoutesSaveFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [active, setActive] = useState<WorkoutTemplate | null>(null);
  const [activeClimb, setActiveClimb] = useState<ClimbChallenge | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("training");
  const [activeVoyage, setActiveVoyage] = useState<VoyagePortion | null>(null);
  const [voyagePickerOpen, setVoyagePickerOpen] = useState(false);
  const [challengeRoute, setChallengeRoute] = useState<ClimbChallenge | null>(null);
  const [segmentAttackRoute, setSegmentAttackRoute] = useState<ClimbChallenge | null>(null);
  const [segmentAttackIndex, setSegmentAttackIndex] = useState<number | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<RouteChallenge | null>(null);
  const [pauseCount, setPauseCount] = useState(0);
  const [timeAttackElapsedSeconds, setTimeAttackElapsedSeconds] = useState(0);
  const [timeAttackSplits, setTimeAttackSplits] = useState<TimeAttackSplit[]>([]);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [finishReviewed, setFinishReviewed] = useState(false);
  const [cadenceScore, setCadenceScore] = useState(emptyCadenceScore);
  const [cadenceSettingsKey, setCadenceSettingsKey] = useState<string | undefined>();
  const [cadenceSettingsChanged, setCadenceSettingsChanged] = useState(false);
  const cadenceReading = useRef<{ at: number; rpm?: number }>({ at: 0 });
  const autoWriteBusy = useRef(false);
  const lastAutoTarget = useRef<number | undefined>(undefined);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(35);
  const [energy, setEnergy] = useState<Energy>("normal");
  const [sessionResistanceDelta, setSessionResistanceDelta] = useState(0);
  const [backupExport, setBackupExport] = useState<ReturnType<typeof createBackup> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [telemetrySamples, setTelemetrySamples] = useState<TelemetrySample[]>([]);
  const [diagnosingBike, setDiagnosingBike] = useState(false);
  const cadenceBase = useRef<WorkoutTemplate | null>(null);
  const [sessionCadenceOffset, setSessionCadenceOffset] = useState(0);
  const coachFeedback = useRef({ belowSince: 0, lastAt: 0, lastAdviceAt: 0, lastLevel: undefined as number | undefined });
  const calorieTracker = useRef<CalorieAttempt | undefined>(undefined);
  const calorieReading = useRef<{ kcal: number; at: number } | undefined>(undefined);
  const [calorieAttempt, setCalorieAttempt] = useState<CalorieAttempt | undefined>();
  const [calorieLevel, setCalorieLevel] = useState<number | undefined>();
  const [calorieSource, setCalorieSource] = useState<"ftms" | "manual">("manual");
  const [manualChallengeCalories, setManualChallengeCalories] = useState("");
  const [caloriesOnly, setCaloriesOnly] = useState(false);
  const [expressOnly, setExpressOnly] = useState(false);
  const [sessionIntensityFilter, setSessionIntensityFilter] = useState("all");
  const {
    bike,
    telemetry,
    lastTelemetryAt,
    bluetoothError,
    connectingBike,
    controlGranted,
    controlBusy,
    testResistanceLevel,
    resistanceMappingVerified,
    autoResistanceControl,
    connectBike,
    disconnectBike,
    requestBikeControl,
    sendTestResistance,
    failAutomaticControl,
    setTestResistanceLevel,
    setResistanceMappingVerified,
    setAutoResistanceControl
  } = useBikeController({
    diagnosing: diagnosingBike,
    isLocked: () => pwa.locked(),
    onBeforeConnect: () => {
      if (calorieTracker.current) {
        calorieTracker.current = { ...calorieTracker.current, valid: false };
        setCalorieAttempt(calorieTracker.current);
      }
      calorieReading.current = undefined;
    },
    onTelemetry: (next) => {
      if (next.totalEnergyKcal !== undefined) {
        const now = Date.now();
        calorieReading.current = { kcal: next.totalEnergyKcal, at: now };
        if (calorieTracker.current) {
          calorieTracker.current = sampleCalories(calorieTracker.current, next.totalEnergyKcal, now);
          setCalorieAttempt(calorieTracker.current);
        }
      }
      if (Object.prototype.hasOwnProperty.call(next, "cadenceRpm")) {
        cadenceReading.current = { at: Date.now(), rpm: next.cadenceRpm };
      }
    },
    onDisconnected: () => {
      if (calorieTracker.current) {
        calorieTracker.current = { ...calorieTracker.current, valid: false };
        setCalorieAttempt(calorieTracker.current);
      }
      calorieReading.current = undefined;
    },
    onToast: setToast
  });
  const [climbStartDistanceM, setClimbStartDistanceM] = useState<number | null>(null);
  const [customClimbs, setCustomClimbs] = useState<ClimbChallenge[]>([]);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const [routeSearch, setRouteSearch] = useState("");
  const [routeThemeId, setRouteThemeId] = useState("");
  const [routeCategoryFilter, setRouteCategoryFilter] = useState<"all" | RouteCategory>("all");
  const [routeDifficultyFilter, setRouteDifficultyFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [routeFavoritesOnly, setRouteFavoritesOnly] = useState(false);
  const [routeSort, setRouteSort] = useState<"featured" | "distance" | "elevation" | "difficulty" | "pb">("featured");
  const [routeDuration, setRouteDuration] = useState<"all" | "30" | "60" | "long">("all");
  const [resumeSnapshot, setResumeSnapshot] = useState<ActiveSessionSnapshot | null>(null);
  const lastSampleAt = useRef(0);
  const activeSnapshotRef = useRef<ActiveSessionSnapshot | null>(null);
  const segmentDeadlineRef = useRef(0);
  const timeAttackStartedAtRef = useRef(0);
  const cuePreferencesRef = useRef<Preferences>(defaultPreferences);
  const upcomingCueRef = useRef("");
  const readerRef = useRef<HTMLDivElement>(null);
  const [foregroundNotice, setForegroundNotice] = useState(false);
  const preferences: Preferences = { ...defaultPreferences, ...(state.preferences ?? {}) };
  useEffect(() => { pwa.setBusy(!hydrated || Boolean(active) || Boolean(bike) || connectingBike || diagnosingBike || showSetup || stateSaveFailed || routesSaveFailed); }, [hydrated, active, bike, connectingBike, diagnosingBike, showSetup, stateSaveFailed, routesSaveFailed, pwa.setBusy]);
  const screenWake = useScreenWakeLock(running && sessionStarted && preferences.keepScreenAwake);

  useEffect(() => { setFinishReviewed(false); }, [showFinish]);

  useEffect(() => {
    if (!running || !sessionStarted || !active || showFinish || isCalorieWorkout(active.id)) return;
    let previous = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const seconds = Math.max(0, (now - previous) / 1000);
      const reading = cadenceReading.current;
      const fresh = bike && now - reading.at <= 5000 && seconds <= 3;
      setCadenceScore(score => addCadenceInterval(score, segmentIndex, active.segments[segmentIndex]?.cadence, seconds, fresh ? reading.rpm : undefined));
      previous = now;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, sessionStarted, active, segmentIndex, bike, showFinish]);

  useEffect(() => {
    cuePreferencesRef.current = { ...defaultPreferences, ...(state.preferences ?? {}), resistanceOffset: preferences.resistanceOffset + sessionResistanceDelta };
  }, [state.preferences, preferences.resistanceOffset, sessionResistanceDelta]);

  useEffect(() => {
    if (!active || showFinish) releaseCueAudio();
  }, [active, showFinish]);
  useEffect(() => () => releaseCueAudio(), []);
  useEffect(() => {
    if (sessionStarted) readerRef.current?.scrollTo({ top: 0 });
  }, [sessionStarted, preferences.readerView]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const loaded = normalizeState(JSON.parse(raw));
        setState(loaded);
        setAvailableMinutes(loaded.guidance?.sessionMinutes ?? 35);
      }
      catch {
        setState(emptyState());
        setToast("Sauvegarde locale illisible : un état sain a été chargé.");
      }
    } else setAvailableMinutes(15);
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && ["dashboard","sessions","climbs","progress","more"].includes(requestedTab)) setTab(requestedTab as Tab);

    const savedRoutes = localStorage.getItem(CUSTOM_ROUTES_KEY);
    if (savedRoutes) {
      try { setCustomClimbs(JSON.parse(savedRoutes)); } catch { /* ignore corrupted custom routes */ }
    }
    setResumeSnapshot(readActiveSessionSnapshot());
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
    if (hydrated) {
      const saved = safeLocalStorageWrite(STORAGE_KEY, state); setStateSaveFailed(!saved);
      if (!saved) setToast("Stockage local plein : exporte une sauvegarde puis allège l’historique.");
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (hydrated) {
      const saved = safeLocalStorageWrite(CUSTOM_ROUTES_KEY, customClimbs); setRoutesSaveFailed(!saved);
      if (!saved) setToast("Impossible d’enregistrer les parcours : stockage local insuffisant.");
    }
  }, [customClimbs, hydrated]);

  useEffect(() => {
    if (!active || !sessionStarted) {
      activeSnapshotRef.current = null;
      return;
    }
    activeSnapshotRef.current = {
      version: 1,
      savedAt: Date.now(),
      workoutId: active.id,
      routeId: activeClimb?.id,
      routeMode,
      voyage: activeVoyage ?? undefined,
      challengeId: activeChallenge?.id,
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
      cadenceOffset: sessionCadenceOffset,
      cadenceScore, cadenceSettingsKey, cadenceSettingsChanged,
      hadBikeConnection: Boolean(bike)
    };
  }, [active, activeClimb, routeMode, activeVoyage, activeChallenge, segmentAttackIndex, segmentIndex, secondsLeft, running, sessionStarted, showFinish, timeAttackElapsedSeconds, timeAttackSplits, pauseCount, sessionResistanceDelta, climbStartDistanceM, telemetrySamples, cadenceScore, cadenceSettingsKey, cadenceSettingsChanged, bike, sessionCadenceOffset]);

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
      if (document.visibilityState === "hidden") { wasHidden = true; save(); }
      else if (wasHidden) { setForegroundNotice(true); wasHidden = false; }
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active?.id, sessionStarted]);

  useEffect(() => {
    if (!running || !active || !sessionStarted) return;
    if ((routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb && bike && climbStartDistanceM !== null) return;
    segmentDeadlineRef.current = Date.now() + secondsLeft * 1000;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((segmentDeadlineRef.current - now) / 1000);
      if (remaining > 0) {
        const nextSegment = active.segments[segmentIndex + 1];
        const key = `${active.id}:${segmentIndex}`;
        if (remaining >= 9 && remaining <= 10 && nextSegment && cuePreferencesRef.current.announceUpcoming && upcomingCueRef.current !== key) {
          upcomingCueRef.current = key;
          cueSegment(nextSegment, cuePreferencesRef.current, { previous: active.segments[segmentIndex], upcoming: true });
        }
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
        setSegmentIndex(active.segments.length - 1);
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
      cueSegment(active.segments[next], cuePreferencesRef.current, { previous: active.segments[next - 1] });
    }, 250);

    return () => window.clearInterval(timer);
  }, [running, active, segmentIndex, sessionStarted, routeMode, activeClimb, bike, climbStartDistanceM]);

  useEffect(() => {
    if ((routeMode !== "timeAttack" && routeMode !== "segmentAttack") || !activeClimb || !sessionStarted || !running) return;
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
        calories: telemetry.totalEnergyKcal,
        distanceKm: telemetry.distanceM !== undefined ? telemetry.distanceM / 1000 : undefined
      }
    ]);
  }, [telemetry, running, active, bike]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const week = currentProgramWeek(state.profile.startDate);
  const target = weekTargetFor(state, week);
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
  const favoriteRouteIds = state.favoriteRouteIds ?? [];
  const visibleRoutes = useMemo(() => {
    const query = routeSearch.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const theme = routeThemes.find((item) => item.id === routeThemeId);
    const filtered = allClimbs.filter((route) => {
      if (theme && !theme.routeIds.includes(route.id)) return false;
      if (query && !routeSearchText(route).includes(query)) return false;
      if (routeCategoryFilter !== "all" && routeCategory(route) !== routeCategoryFilter) return false;
      if (routeDifficultyFilter && routeDifficulty(route) !== routeDifficultyFilter) return false;
      if (routeFavoritesOnly && !favoriteRouteIds.includes(route.id)) return false;
      if (routeDuration !== "all") {
        const minutes = climbToWorkout(route).duration;
        if (routeDuration === "30" && minutes > 30) return false;
        if (routeDuration === "60" && (minutes <= 30 || minutes > 60)) return false;
        if (routeDuration === "long" && minutes <= 60) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (routeSort === "distance") return b.distanceKm - a.distanceKm;
      if (routeSort === "elevation") return b.elevationGainM - a.elevationGainM;
      if (routeSort === "difficulty") return routeDifficulty(b) - routeDifficulty(a);
      if (routeSort === "pb") {
        const aPb = personalBest(state.sessions, a.id)?.metrics?.elapsedSeconds ?? Number.POSITIVE_INFINITY;
        const bPb = personalBest(state.sessions, b.id)?.metrics?.elapsedSeconds ?? Number.POSITIVE_INFINITY;
        return aPb - bPb;
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || routeDifficulty(b) - routeDifficulty(a);
    });
  }, [allClimbs, routeSearch, routeThemeId, routeCategoryFilter, routeDifficultyFilter, routeFavoritesOnly, routeDuration, routeSort, favoriteRouteIds, state.sessions]);
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
      avgResistance: average(telemetrySamples.map((s) => s.resistance)),
      calories: counterDelta(telemetrySamples.map((s) => s.calories))
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

  const adaptiveCoach = useMemo(() => recommendAdaptiveWorkout({
    state,
    workouts: guidanceCandidates(state, workouts, availableMinutes),
    target,
    weekly: {
      sessions: stats.sessions,
      minutes: stats.minutes,
      points: stats.points,
      hard: stats.hard,
      variety: stats.variety
    },
    availableMinutes,
    energy
  }), [state, target, stats.sessions, stats.minutes, stats.points, stats.hard, stats.variety, availableMinutes, energy]);

  const recommendation = adaptiveCoach.workout;
  const guidedView = state.guidance?.status === "active";
  const discoveryCount = guidanceSessions(state).length;
  const guidedRecommendation = discoveryCount === 0 ? firstGuidedWorkout(workouts) : recommendation;
  const guidedWeekCount = guidanceSessions({ ...state, sessions: sessionsForProgramWeek(state, week) }).length;

  const totalSessionSeconds = active ? active.segments.reduce((sum, segment) => sum + segment.minutes * 60, 0) : 0;
  const elapsedBeforeSegment = active ? active.segments.slice(0, segmentIndex).reduce((sum, segment) => sum + segment.minutes * 60, 0) : 0;
  const currentSegmentSeconds = active ? active.segments[segmentIndex]?.minutes * 60 || 0 : 0;
  const scenicSession = activeClimb?.category === "scenic";
  const sessionElapsedSeconds = active ? elapsedBeforeSegment + Math.max(0, currentSegmentSeconds - secondsLeft) : 0;
  const sessionProgressPercent = totalSessionSeconds ? Math.min(100, Math.round((sessionElapsedSeconds / totalSessionSeconds) * 100)) : 0;

  const activeSegmentBounds = activeClimb && segmentAttackIndex !== null
    ? segmentBounds(activeClimb.distanceKm, segmentAttackIndex)
    : undefined;

  const climbProgress = useMemo(() => {
    if (!activeClimb || !active) return 0;
    const timedProgress = totalSessionSeconds ? sessionElapsedSeconds / totalSessionSeconds : 0;

    if (routeMode === "voyage" && activeVoyage) {
      return (activeVoyage.startKm + Math.min(1, timedProgress) * (activeVoyage.endKm - activeVoyage.startKm)) / activeClimb.distanceKm;
    }

    if (bike && telemetry.distanceM !== undefined && climbStartDistanceM !== null) {
      const localKm = Math.max(0, (telemetry.distanceM - climbStartDistanceM) / 1000);
      if (routeMode === "segmentAttack" && activeSegmentBounds) {
        const absoluteKm = Math.min(activeSegmentBounds.endKm, activeSegmentBounds.startKm + localKm);
        return Math.max(0, Math.min(1, absoluteKm / activeClimb.distanceKm));
      }
      return Math.max(0, Math.min(1, localKm / activeClimb.distanceKm));
    }

    if (routeMode === "segmentAttack" && activeSegmentBounds) {
      const ratio = activeSegmentBounds.startRatio + timedProgress * (activeSegmentBounds.endRatio - activeSegmentBounds.startRatio);
      return Math.max(0, Math.min(1, ratio));
    }

    return Math.max(0, Math.min(1, timedProgress));
  }, [activeClimb, active, bike, telemetry.distanceM, climbStartDistanceM, routeMode, activeVoyage, activeSegmentBounds, totalSessionSeconds, sessionElapsedSeconds]);

  const currentRouteKm = activeClimb ? climbProgress * activeClimb.distanceKm : 0;
  const routeBest = activeClimb ? personalBest(state.sessions, activeClimb.id) : undefined;
  const segmentBest = activeClimb && segmentAttackIndex !== null
    ? segmentPersonalBest(state.sessions, activeClimb.id, segmentAttackIndex)
    : undefined;
  const activeRaceBest = routeMode === "segmentAttack" ? segmentBest : routeBest;
  const routeAttemptCount = activeClimb ? routeAttempts(state.sessions, activeClimb.id).length : 0;
  const segmentAttemptCount = activeClimb && segmentAttackIndex !== null
    ? segmentAttempts(state.sessions, activeClimb.id, segmentAttackIndex).length
    : 0;
  const raceDistanceKm = routeMode === "segmentAttack" && activeSegmentBounds
    ? activeSegmentBounds.distanceKm
    : activeClimb?.distanceKm ?? 0;
  const raceCurrentKm = routeMode === "segmentAttack" && activeSegmentBounds
    ? Math.max(0, currentRouteKm - activeSegmentBounds.startKm)
    : currentRouteKm;
  const ghostDelta = activeClimb && (routeMode === "timeAttack" || routeMode === "segmentAttack")
    ? ghostDeltaSeconds(activeRaceBest, raceCurrentKm, raceDistanceKm, timeAttackElapsedSeconds)
    : undefined;
  const ghostDistanceLocalKm = activeClimb && (routeMode === "timeAttack" || routeMode === "segmentAttack")
    ? ghostDistanceAtElapsed(activeRaceBest, timeAttackElapsedSeconds, raceDistanceKm)
    : undefined;
  const ghostAbsoluteKm = ghostDistanceLocalKm !== undefined
    ? (routeMode === "segmentAttack" && activeSegmentBounds ? activeSegmentBounds.startKm + ghostDistanceLocalKm : ghostDistanceLocalKm)
    : undefined;
  const ghostProgress = activeClimb && ghostAbsoluteKm !== undefined
    ? Math.max(0, Math.min(1, ghostAbsoluteKm / activeClimb.distanceKm))
    : undefined;
  const routeCheckpoints = activeClimb ? checkpointKilometers(activeClimb.distanceKm) : [];

  useEffect(() => {
    if (routeMode !== "timeAttack" || !activeClimb || !sessionStarted) return;
    setTimeAttackSplits((existing) => captureSplits(existing, checkpointKilometers(activeClimb.distanceKm), currentRouteKm, timeAttackElapsedSeconds));
  }, [routeMode, activeClimb, sessionStarted, currentRouteKm, timeAttackElapsedSeconds]);

  useEffect(() => {
    if ((routeMode !== "timeAttack" && routeMode !== "segmentAttack") || !activeClimb || !active || !bike || climbStartDistanceM === null || !sessionStarted) return;

    let nextIndex = segmentIndex;
    if (routeMode === "segmentAttack" && activeSegmentBounds) {
      const localProgress = Math.max(0, Math.min(0.999, (currentRouteKm - activeSegmentBounds.startKm) / activeSegmentBounds.distanceKm));
      nextIndex = Math.min(active.segments.length - 1, Math.floor(localProgress * active.segments.length));
    } else {
      const profileIndex = activeClimb.profile.slice(1).findIndex((point) => currentRouteKm <= point.km);
      nextIndex = profileIndex < 0 ? active.segments.length - 1 : profileIndex;
    }

    if (nextIndex !== segmentIndex) {
      setSegmentIndex(nextIndex);
      const seconds = Math.round(active.segments[nextIndex].minutes * 60);
      setSecondsLeft(seconds);
      cueSegment(active.segments[nextIndex], cuePreferencesRef.current, { previous: active.segments[segmentIndex] });
    }

    const finished = routeMode === "segmentAttack" && activeSegmentBounds
      ? currentRouteKm >= activeSegmentBounds.endKm - 0.01
      : climbProgress >= 0.999;

    if (finished && running) {
      setRunning(false);
      setShowFinish(true);
      setToast(routeMode === "segmentAttack" ? "Secteur terminé !" : "Arrivée ! Time Attack terminé.");
    }
  }, [routeMode, activeClimb, activeSegmentBounds, bike, climbStartDistanceM, sessionStarted, currentRouteKm, climbProgress, segmentIndex, active, running]);

  const calorieMode = isCalorieWorkout(active?.id);
  const currentTarget = calorieMode ? calorieLevel : active ? resistanceTarget(active.segments[segmentIndex], currentSegmentSeconds - secondsLeft, preferences.resistanceOffset + sessionResistanceDelta) : undefined;
  const currentRange = active ? numericRange(active.segments[segmentIndex].resistance) : undefined;
  const resistanceDirection = !currentRange ? "Libre" : currentRange[0] === currentRange[1] ? "Palier" : secondsLeft > currentSegmentSeconds / 2 ? "Montée de résistance" : "Descente de résistance";
  const calorieComplete = Boolean(calorieMode && calorieTracker.current && sessionElapsedSeconds >= totalSessionSeconds - .01);
  const calorieValue = calorieSource === "ftms" ? calorieAttempt?.kcal : manualChallengeCalories.trim() ? Number(manualChallengeCalories) : undefined;
  const calorieResult: CalorieResultType | undefined = calorieMode && calorieValue !== undefined && Number.isFinite(calorieValue) && calorieValue >= 0 ? {
    version: 1, durationSeconds: Math.round((active?.duration ?? 0) * 60), source: calorieSource, deviceName: calorieSource === "ftms" ? calorieAttempt?.deviceName : undefined, kcal: calorieValue,
    eligible: calorieComplete && (calorieSource === "manual" || measuredCaloriesEligible(calorieAttempt))
  } : undefined;
  const caloriePrevious = active && calorieMode ? bestCalorieAttempt(state.sessions, active.id, calorieSource, calorieSource === "ftms" ? calorieAttempt?.deviceName ?? bike?.deviceName : undefined) : undefined;
  const cadenceLive = cadenceSummary(cadenceScore);
  const currentSettingsKey = active ? effortSettingsKey(active.id, active.segments, preferences.resistanceOffset + sessionResistanceDelta, routeMode) : undefined;
  const comparisonKey = cadenceSettingsKey ?? currentSettingsKey;
  const previousCadenceBest = bestCadenceAttempt(state.sessions, comparisonKey);
  const distanceScoredRace = Boolean(activeClimb && bike && climbStartDistanceM !== null && (routeMode === "timeAttack" || routeMode === "segmentAttack"));
  const cadenceExerciseComplete = distanceScoredRace ? raceCurrentKm >= raceDistanceKm * .98 : sessionProgressPercent >= 98;
  const cadenceRecordEligible = Boolean(active && !cadenceSettingsChanged && comparisonKey === currentSettingsKey && !cadenceLive.provisional && active.segments.every((segment, index) => {
    const scored = numericRange(segment.cadence) || segment.cadence === "libre";
    return !scored || (cadenceScore.segments[index]?.eligibleSeconds ?? 0) >= (distanceScoredRace ? 1 : segment.minutes * 60 * .98);
  }) && cadenceExerciseComplete);
  useEffect(() => {
    if (sessionStarted && cadenceSettingsKey && currentSettingsKey !== cadenceSettingsKey) setCadenceSettingsChanged(true);
  }, [sessionStarted, cadenceSettingsKey, currentSettingsKey]);

  useEffect(() => {
    if (!autoResistanceControl || !controlGranted || !running || !sessionStarted || !active || !bike?.setResistance) {
      lastAutoTarget.current = undefined;
      return;
    }
    if (currentTarget === undefined || autoWriteBusy.current || lastAutoTarget.current === currentTarget) return;
    autoWriteBusy.current = true;
    lastAutoTarget.current = currentTarget;
    bike.setResistance(currentTarget).catch((error) => {
      failAutomaticControl(error);
    }).finally(() => { autoWriteBusy.current = false; });
  }, [autoResistanceControl, controlGranted, running, sessionStarted, active, segmentIndex, bike, currentTarget, secondsLeft]);

  useEffect(() => {
    const feedback = coachFeedback.current;
    if (!active || !running || !sessionStarted || showFinish) { feedback.belowSince = 0; return; }
    const now = Date.now();
    const range = numericRange(active.segments[segmentIndex]?.cadence);
    const reading = cadenceReading.current;
    const below = range && reading.rpm !== undefined && now - reading.at <= 5000 && reading.rpm < range[0];
    if (!below) feedback.belowSince = 0;
    else if (!feedback.belowSince) feedback.belowSince = now;
    if (now - feedback.lastAdviceAt >= 45000 && feedback.belowSince && now - feedback.belowSince >= 15000) {
      if (cueCoach("La cadence est sous la cible. Privilégie un rythme confortable ; allège la résistance ou fais une pause si l’effort est trop élevé.", preferences)) { feedback.lastAdviceAt = now; feedback.lastAt = now; }
    } else if (now - feedback.lastAdviceAt >= 90000) {
      if (cueCoach("Garde un rythme régulier et de la réserve pour la suite. Le ressenti cible reste un repère, adapte l’effort à tes sensations.", preferences)) { feedback.lastAdviceAt = now; feedback.lastAt = now; }
    } else if (feedback.lastLevel !== currentTarget && currentTarget !== undefined && now - feedback.lastAt >= 8000) {
      if (cueCoach(`${autoResistanceControl && controlGranted ? "Pilotage automatique" : "Résistance cible"} : niveau ${currentTarget}.`, preferences)) { feedback.lastAt = now; feedback.lastLevel = currentTarget; }
    }
  }, [active, running, sessionStarted, showFinish, segmentIndex, secondsLeft, currentTarget, autoResistanceControl, controlGranted, preferences]);

  const voyageCard = state.voyage ? <VoyagePanel
    route={allClimbs.find(route => route.id === state.voyage?.routeId)} sessions={state.sessions}
    minutes={state.voyage.minutes} interrupted={Boolean(resumeSnapshot)}
    onMinutes={minutes => setState(prev => ({ ...prev, voyage: prev.voyage ? { ...prev.voyage, minutes } : undefined }))}
    onStart={launchVoyage} onChoose={() => { setVoyagePickerOpen(false); setTab("climbs"); }}
    onClear={() => { setState(prev => ({ ...prev, voyage: undefined })); setVoyagePickerOpen(false); setTab("climbs"); }}
  /> : null;

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

  function resumeInterruptedSession() {
    if (pwa.locked()) return;
    if (!resumeSnapshot) return;
    const route = resumeSnapshot.routeId ? allClimbs.find((item) => item.id === resumeSnapshot.routeId) ?? null : null;
    const savedVoyage = resumeSnapshot.routeMode === "voyage" && route && validVoyagePortion(resumeSnapshot.voyage) &&
      resumeSnapshot.voyage.routeDistanceKm === route.distanceKm && resumeSnapshot.voyage.routeXp === route.xp
      ? resumeSnapshot.voyage : null;
    let workout = route
      ? (resumeSnapshot.routeMode === "voyage" ? (savedVoyage ? voyageWorkout(route, savedVoyage) : undefined)
        : resumeSnapshot.routeMode === "segmentAttack" && resumeSnapshot.segmentAttackIndex !== undefined
          ? routeSegmentWorkout(route, resumeSnapshot.segmentAttackIndex)
          : climbToWorkout(route))
      : workouts.find((item) => item.id === resumeSnapshot.workoutId);
    if (!workout) {
      clearActiveSessionSnapshot();
      setResumeSnapshot(null);
      setToast("La séance interrompue ne peut plus être restaurée.");
      return;
    }

    const restoredOffset = Number.isFinite(resumeSnapshot.cadenceOffset) ? Math.max(-25, Math.min(10, Math.round(resumeSnapshot.cadenceOffset! / 5) * 5)) : 0;
    cadenceBase.current = workout;
    workout = withCadenceOffset(workout, restoredOffset);
    setSessionCadenceOffset(restoredOffset);
    calorieTracker.current = undefined; setCalorieAttempt(undefined); setManualChallengeCalories(""); setCalorieSource("manual"); setCalorieLevel(undefined);
    const restored = restoreSessionSnapshot(resumeSnapshot, workout);
    pwa.setBusy(true);
    setForegroundNotice(false);
    void prepareCueAudio(preferences);
    if (!restored.showFinish) cueSegment(workout.segments[restored.segmentIndex], { ...preferences, resistanceOffset: preferences.resistanceOffset + restored.sessionResistanceDelta });
    setActive(workout);
    setActiveClimb(route);
    setRouteMode(restored.routeMode);
    setActiveVoyage(savedVoyage);
    setSegmentAttackIndex(restored.segmentAttackIndex ?? null);
    setActiveChallenge(restored.challengeId ? routeChallenges.find((challenge) => challenge.id === restored.challengeId) ?? null : null);
    setSegmentIndex(restored.segmentIndex);
    setSecondsLeft(restored.secondsLeft);
    setRunning(restored.running);
    setSessionStarted(restored.sessionStarted);
    setShowFinish(restored.showFinish);
    setTimeAttackElapsedSeconds(restored.timeAttackElapsedSeconds);
    setTimeAttackSplits(restored.timeAttackSplits);
    setPauseCount(restored.pauseCount);
    setSessionResistanceDelta(restored.sessionResistanceDelta);
    setClimbStartDistanceM(null);
    setTelemetrySamples(restored.telemetrySamples ?? []);
    setCadenceScore({ ...(restored.cadenceScore ?? emptyCadenceScore()), comboSeconds: 0 });
    setCadenceSettingsKey(restored.cadenceSettingsKey);
    setCadenceSettingsChanged(restored.cadenceSettingsChanged ?? true);
    timeAttackStartedAtRef.current = (restored.routeMode === "timeAttack" || restored.routeMode === "segmentAttack") && restored.running
      ? Date.now() - restored.timeAttackElapsedSeconds * 1000
      : 0;
    segmentDeadlineRef.current = Date.now() + restored.secondsLeft * 1000;
    setResumeSnapshot(null);
    if (restored.hadBikeConnection) setToast("Séance restaurée. Reconnecte le vélo pour reprendre la télémétrie FTMS.");
    else setToast("Séance restaurée.");
  }

  function discardInterruptedSession() {
    clearActiveSessionSnapshot();
    setResumeSnapshot(null);
    setToast("Séance interrompue abandonnée.");
  }

  function parkActiveSession() {
    if (activeSnapshotRef.current) {
      const snapshot = { ...activeSnapshotRef.current, savedAt: Date.now() };
      if (!writeActiveSessionSnapshot(snapshot)) { setToast("La reprise n’a pas pu être enregistrée. Garde le lecteur ouvert et libère du stockage avant une mise à jour."); return; }
      setResumeSnapshot(snapshot);
    }
    calorieTracker.current = undefined;
    setActive(null);
    setActiveClimb(null);
    setActiveChallenge(null);
    setSegmentAttackRoute(null);
    setRunning(false);
    setSessionStarted(false);
  }

  function openManualLog() {
    const freeRide = workouts.find((workout) => workout.id === "free-ride");
    if (!freeRide) return;
    launch(freeRide);
    setSessionStarted(true);
    setShowFinish(true);
  }

  function launch(workout: WorkoutTemplate, climb: ClimbChallenge | null = null, mode: RouteMode = "training", resistanceDelta = 0) {
    if (pwa.locked()) { setToast("Mise à jour en cours : attends le rechargement."); return; }
    pwa.setBusy(true);
    setActiveVoyage(null);
    calorieTracker.current = undefined; setCalorieAttempt(undefined); setManualChallengeCalories(""); setCalorieLevel(undefined);
    cadenceBase.current = workout;
    const offset = preferences.cadenceOffset ?? -15;
    setSessionCadenceOffset(offset);
    setActive(withCadenceOffset(workout, offset));
    setActiveClimb(climb);
    setRouteMode(climb ? mode : "training");
    setSessionResistanceDelta(Math.max(-1, Math.min(1, resistanceDelta)));
    setPauseCount(0);
    setActiveChallenge(null);
    if (mode !== "segmentAttack") setSegmentAttackIndex(null);
    setTimeAttackElapsedSeconds(0);
    setTimeAttackSplits([]);
    timeAttackStartedAtRef.current = 0;
    setSegmentIndex(0);
    setSecondsLeft(Math.round(workout.segments[0].minutes * 60));
    setRunning(false);
    setSessionStarted(false);
    setShowFinish(false);
    setTelemetrySamples([]);
    setCadenceScore(emptyCadenceScore());
    setCadenceSettingsKey(undefined);
    setCadenceSettingsChanged(false);
    lastSampleAt.current = 0;
    setClimbStartDistanceM(climb ? telemetry.distanceM ?? null : null);
  }

  function launchSegmentAttack(route: ClimbChallenge, index: number) {
    setSegmentAttackIndex(index);
    setSegmentAttackRoute(null);
    launch(routeSegmentWorkout(route, index), route, "segmentAttack");
  }

  function launchVoyage() {
    if (!state.voyage || resumeSnapshot) return;
    const route = allClimbs.find(item => item.id === state.voyage?.routeId);
    if (!route) return;
    const portion = voyagePlan(route, state.sessions, state.voyage.minutes);
    if (!portion) return;
    const workout = voyageWorkout(route, portion);
    if (!workout.segments.length) { setToast("Le profil de ce parcours ne permet pas de préparer cette portion."); return; }
    launch(workout, route, "voyage");
    setActiveVoyage(portion);
    setVoyagePickerOpen(false);
  }

  function finishActive(form: FormData) {
    if (!active || !finishReviewed) return;
    const loggedAt = String(form.get("loggedAt") ?? "").trim();
    const date = loggedAt ? localDateToIso(loggedAt) : new Date().toISOString();
    if (!date) { setToast("Date ou heure de séance invalide."); return; }
    const manualUsed = ["distance", "calories", "avgCadence", "avgPower", "avgHeartRate", "rpe", "note"]
      .some((key) => String(form.get(key) ?? "").trim().length > 0);
    const hasFtms = telemetrySamples.length > 0;
    const isTimeAttack = routeMode === "timeAttack" && Boolean(activeClimb);
    const isSegmentAttack = routeMode === "segmentAttack" && Boolean(activeClimb) && segmentAttackIndex !== null;
    const isRaceMode = isTimeAttack || isSegmentAttack;
    const isVoyage = routeMode === "voyage" && Boolean(activeVoyage);
    const completedPortion = isVoyage && sessionStarted && sessionElapsedSeconds >= totalSessionSeconds - .01;
    const elapsedSeconds = isRaceMode
      ? (n(form, "elapsedSeconds") ?? timeAttackElapsedSeconds)
      : undefined;
    const duration = calorieMode ? sessionElapsedSeconds / 60 : isVoyage ? sessionElapsedSeconds / 60 : isRaceMode && elapsedSeconds !== undefined
      ? elapsedSeconds / 60
      : (n(form, "duration") ?? active.duration);
    const previousBest = isTimeAttack && activeClimb
      ? personalBest(state.sessions, activeClimb.id)
      : isSegmentAttack && activeClimb && segmentAttackIndex !== null
        ? segmentPersonalBest(state.sessions, activeClimb.id, segmentAttackIndex)
        : undefined;
    const candidatePersonalBest = Boolean(
      isRaceMode &&
      elapsedSeconds !== undefined &&
      (!previousBest?.metrics?.elapsedSeconds || elapsedSeconds < previousBest.metrics.elapsedSeconds)
    );
    const completedRoute = activeClimb
      ? (isSegmentAttack || isVoyage
          ? false
          : bike && telemetry.distanceM !== undefined && climbStartDistanceM !== null
            ? currentRouteKm >= activeClimb.distanceKm * 0.98
            : sessionProgressPercent >= 98 || (isTimeAttack && timeAttackSplits.some((split) => split.km >= activeClimb.distanceKm * .98)))
      : true;
    const completedSegment = isSegmentAttack && activeSegmentBounds
      ? (bike && telemetry.distanceM !== undefined && climbStartDistanceM !== null
          ? raceCurrentKm >= activeSegmentBounds.distanceKm * .98
          : sessionProgressPercent >= 98)
      : undefined;
    const isPersonalBest = candidatePersonalBest && (isSegmentAttack ? completedSegment : completedRoute) && (elapsedSeconds ?? 0) > 0;
    const formCadence = n(form, "avgCadence");
    const challengeResult = activeChallenge && activeClimb
      ? evaluateRouteChallenge(activeChallenge, {
          route: activeClimb,
          completedRoute,
          pauseCount,
          avgCadenceRpm: formCadence ?? autoMetrics.avgCadenceRpm,
          elapsedSeconds,
          pbBeforeSeconds: previousBest?.metrics?.elapsedSeconds,
          checkpointSplits: timeAttackSplits
        })
      : undefined;
    const awardedXp = active.xp + (isPersonalBest ? 50 : 0) + (challengeResult?.xpBonus ?? 0);

    const session: CompletedSession = {
          id: uid(),
          templateId: active.id,
          routeId: activeClimb?.id,
          date,
          duration,
          points: isVoyage && !completedPortion ? 0 : active.points,
          xp: awardedXp,
          intensity: active.intensity,
          kind: active.kind,
          bonus: Boolean(active.bonus),
          rpe: n(form, "rpe"),
          note: String(form.get("note") ?? "").trim() || undefined,
          metrics: {
            voyage: isVoyage && activeVoyage ? { ...activeVoyage, completedPortion } : undefined,
            source: hasFtms && manualUsed ? "mixed" : hasFtms ? "ftms" : "manual",
            completedWorkout: activeClimb ? undefined : sessionStarted ? sessionProgressPercent >= 98 : true,
            elapsedSeconds,
            timeAttack: isTimeAttack || undefined,
            segmentAttackIndex: isSegmentAttack && segmentAttackIndex !== null ? segmentAttackIndex : undefined,
            checkpointSplits: isTimeAttack ? timeAttackSplits : undefined,
            challenge: challengeResult,
            completedRoute: activeClimb ? completedRoute : undefined,
            completedSegment,
            distanceKm: n(form, "distance") ?? autoMetrics.distanceKm ?? (isVoyage ? undefined : activeClimb ? (isSegmentAttack ? raceCurrentKm : currentRouteKm) : undefined),
            calories: calorieMode ? calorieResult?.kcal : n(form, "calories") ?? autoMetrics.calories,
            calorieChallenge: calorieResult,
            avgSpeedKmh: n(form, "avgSpeed") ?? autoMetrics.avgSpeedKmh,
            avgCadenceRpm: n(form, "avgCadence") ?? autoMetrics.avgCadenceRpm,
            maxCadenceRpm: autoMetrics.maxCadenceRpm,
            avgPowerW: n(form, "avgPower") ?? autoMetrics.avgPowerW,
            maxPowerW: autoMetrics.maxPowerW,
            avgHeartRate: n(form, "avgHeartRate") ?? autoMetrics.avgHeartRate,
            maxHeartRate: autoMetrics.maxHeartRate,
            avgResistance: autoMetrics.avgResistance,
            cadenceScore: calorieMode ? undefined : cadenceScore,
            cadenceSettingsKey: calorieMode ? undefined : comparisonKey,
            cadenceRecordEligible: !calorieMode && cadenceRecordEligible,
            samples: hasFtms && preferences.keepTelemetryTrace ? compactTelemetry(telemetrySamples) : undefined
          }
        };
    const nextSessions = [...state.sessions, session];
    const voyageXpEarned = isVoyage ? totalXp({ ...state, sessions: nextSessions }) - totalXp(state) : 0;
    const voyageComplete = isVoyage && activeClimb ? voyageProgress(activeClimb, nextSessions).complete : false;
    setState(prev => ({ ...prev, sessions: [...prev.sessions, session] }));
    calorieTracker.current = undefined;
    setActive(null);
    setActiveClimb(null);
    setRunning(false);
    setShowFinish(false);
    setTelemetrySamples([]);
    setCadenceScore(emptyCadenceScore());
    setCadenceSettingsKey(undefined);
    setCadenceSettingsChanged(false);
    clearActiveSessionSnapshot();
    setResumeSnapshot(null);
    activeSnapshotRef.current = null;
    setTimeAttackElapsedSeconds(0);
    setTimeAttackSplits([]);
    timeAttackStartedAtRef.current = 0;
    setPauseCount(0);
    setActiveChallenge(null);
    setSegmentAttackIndex(null);
    setActiveVoyage(null);
    setToast(isVoyage ? (completedPortion ? `${voyageComplete ? "Voyage achevé" : "Portion enregistrée · la suite t’attend dans Quête"}${voyageXpEarned ? ` · +${voyageXpEarned} XP` : ""}` : "Séance enregistrée. Portion inachevée : aucun kilomètre validé dans le Voyage.") : challengeResult
      ? (challengeResult.success ? `Défi réussi · +${awardedXp} XP` : `Défi manqué · ${challengeResult.summary}`)
      : isPersonalBest
        ? `${isSegmentAttack ? "Nouveau record de secteur" : "Nouveau record personnel"} · +${awardedXp} XP`
        : `Quête validée · +${awardedXp} XP`);
  }

  function beginSession() {
    if (!active) return;
    void prepareCueAudio(preferences);
    upcomingCueRef.current = "";
    setForegroundNotice(false);
    if (isCalorieWorkout(active.id)) {
      calorieTracker.current = startCalories(Date.now(), active.duration * 60, bike ? calorieReading.current : undefined, bike?.deviceName);
      setCalorieAttempt(calorieTracker.current); setCalorieSource(calorieTracker.current.baseline !== undefined ? "ftms" : "manual");
    }
    coachFeedback.current = { belowSince: 0, lastAt: Date.now(), lastAdviceAt: Date.now(), lastLevel: currentTarget };
    setSessionStarted(true);
    setCadenceSettingsKey(currentSettingsKey);
    setCadenceSettingsChanged(false);
    if (activeClimb) setClimbStartDistanceM(telemetry.distanceM ?? null);
    if (routeMode === "timeAttack" || routeMode === "segmentAttack") {
      setTimeAttackElapsedSeconds(0);
      setTimeAttackSplits([]);
      timeAttackStartedAtRef.current = Date.now();
    }
    setRunning(true);
    const seconds = Math.round(active.segments[segmentIndex].minutes * 60);
    setSecondsLeft(seconds);
    segmentDeadlineRef.current = Date.now() + seconds * 1000;
    cueSegment(active.segments[segmentIndex], cuePreferencesRef.current);
  }

  function changeEffort(delta: number) {
    if (calorieMode) {
      const previous = calorieLevel ?? telemetry.resistance ?? 1;
      const next = Math.max(1, Math.min(32, Math.round(previous + delta)));
      setCalorieLevel(next); return next !== previous;
    }
    const next = Math.max(-4, Math.min(4, sessionResistanceDelta + delta));
    setSessionResistanceDelta(next); return next !== sessionResistanceDelta;
  }

  function togglePause() {
    if (!active || isCalorieWorkout(active.id) || !sessionStarted || routeMode === "timeAttack" || routeMode === "segmentAttack") return;
    if (running) {
      setPauseCount((count) => count + 1);
      setRunning(false);
      return;
    }
    segmentDeadlineRef.current = Date.now() + secondsLeft * 1000;
    void prepareCueAudio(preferences);
    setRunning(true);
  }

  function goToSegment(index: number) {
    if (!active || routeMode === "voyage") return;
    if (sessionStarted) setCadenceSettingsChanged(true);
    const next = Math.max(0, Math.min(active.segments.length - 1, index));
    setSegmentIndex(next);
    const seconds = Math.round(active.segments[next].minutes * 60);
    setSecondsLeft(seconds);
    segmentDeadlineRef.current = Date.now() + seconds * 1000;
    upcomingCueRef.current = "";
    if (sessionStarted) { void prepareCueAudio(preferences); cueSegment(active.segments[next], cuePreferencesRef.current); }
  }

  function launchChallenge(route: ClimbChallenge, challenge: RouteChallenge) {
    setChallengeRoute(null);
    launch(climbToWorkout(route), route, challenge.baseMode);
    setActiveChallenge(challenge);
  }

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
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
    const measuredOn = String(form.get("measuredOn") ?? "").trim();
    const date = measuredOn ? localDateToIso(measuredOn, true) : new Date().toISOString();
    if (!date) { setToast("Date de mesure invalide."); return; }
    const m: Measurement = {
      id: uid(),
      date,
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
        startDate: String(form.get("startDate") || localInputDate()),
        startWeight: n(form, "startWeight"),
        targetWeight: n(form, "targetWeight"),
        startWaist: n(form, "startWaist"),
        targetWaist: n(form, "targetWaist")
      }
    }));
    setShowSetup(false);
  }

  function reviewGuidance() {
    setState((previous) => ({ ...previous, guidance: { ...(previous.guidance ?? initialGuidance()), status: "setup", step: 0 } }));
  }

  function finishGuidance(start: boolean) {
    setState((previous) => ({ ...previous, guidance: { ...(previous.guidance ?? initialGuidance()), status: "active", step: 3 } }));
    setAvailableMinutes(state.guidance?.sessionMinutes ?? 15);
    setEnergy("normal");
    setTab("dashboard");
    if (start && !resumeSnapshot) launch(firstGuidedWorkout(workouts));
  }

  function leaveGuidance() {
    setState((previous) => ({ ...previous, guidance: { ...(previous.guidance ?? initialGuidance()), status: "dismissed" } }));
    setTab("dashboard");
  }

  function exploreGentleRides() {
    setRouteDuration("all");
    setRouteSearch("");
    setRouteThemeId("");
    setRouteCategoryFilter("scenic");
    setRouteDifficultyFilter(1);
    setRouteFavoritesOnly(false);
    setTab("climbs");
  }

  function exportData() {
    const backup = createBackup(state, customClimbs);
    setBackupExport(backup);
    // Keep a visible fallback even if the browser silently ignores downloads.
    try { downloadText(`veloquest-${localInputDate()}.json`, JSON.stringify(backup, null, 2), "application/json"); }
    catch { /* Copy, manual selection and sharing remain available. */ }
  }

  function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function exportCsv() {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const sessions = [
      ["date","seance","duree_min","distance_km","calories","vitesse_moy","rpm_moy","watts_moy","fc_moy","rpe","source","voyage_debut_km","voyage_fin_km","voyage_portion_achevee","voyage_position","score_coach_pct","note_coach","couverture_pct","points_combo","meilleur_combo_s"],
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
          session.metrics?.source,
          session.metrics?.voyage?.startKm,
          session.metrics?.voyage?.endKm,
          session.metrics?.voyage?.completedPortion,
          session.metrics?.voyage?.positionSource,
          cadenceSummary(session.metrics?.cadenceScore).percent?.toFixed(1),
          session.metrics?.cadenceScore ? cadenceSummary(session.metrics.cadenceScore).grade : undefined,
          session.metrics?.cadenceScore ? cadenceSummary(session.metrics.cadenceScore).coverage.toFixed(1) : undefined,
          session.metrics?.cadenceScore?.points,
          session.metrics?.cadenceScore?.bestComboSeconds
        ];
      })
    ].map((row) => row.map(quote).join(";")).join("\n");

    const measurements = [
      ["date","poids_kg","tour_taille_cm","tour_abdominal_cm"],
      ...state.measurements.map((m) => [m.date,m.weight,m.waist,m.abdomen])
    ].map((row) => row.map(quote).join(";")).join("\n");

    downloadText(`veloquest-seances-${localInputDate()}.csv`, sessions);
    window.setTimeout(() => downloadText(`veloquest-mesures-${localInputDate()}.csv`, measurements), 200);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      setState(parsed.state);
      setCustomClimbs(parsed.customClimbs);
      setAvailableMinutes(parsed.state.guidance?.sessionMinutes ?? 35);
      setShowSetup(false);
      setBackupExport(null);
      setToast(`Sauvegarde importée : ${parsed.state.sessions.length} séance(s), ${parsed.state.measurements.length} mesure(s).`);
    } catch {
      alert("Sauvegarde invalide.");
    }
  }

  function deleteSession(id: string) {
    if (!window.confirm("Supprimer cette séance ? Les XP, campagnes, badges et records seront recalculés.")) return;
    setState((prev) => ({ ...prev, sessions: prev.sessions.filter((session) => session.id !== id) }));
    setSelectedSessionId(null);
    setToast("Séance supprimée et progression recalculée.");
  }

  function deleteMeasurement(id: string) {
    if (!window.confirm("Supprimer cette mesure ?")) return;
    setState((prev) => ({ ...prev, measurements: prev.measurements.filter((measurement) => measurement.id !== id) }));
    setToast("Mesure supprimée.");
  }

  function resetLocalData() {
    if (!window.confirm("Effacer le profil, l’historique, les mesures et les parcours personnels de cet appareil ?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_ROUTES_KEY);
    clearActiveSessionSnapshot();
    setState(emptyState());
    setCustomClimbs([]);
    setSelectedSessionId(null);
    setTab("dashboard");
    setShowSetup(false);
    setResumeSnapshot(null);
    setAvailableMinutes(15);
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
    setState((prev) => ({ ...prev, favoriteRouteIds: (prev.favoriteRouteIds ?? []).filter((routeId) => routeId !== id) }));
  }

  function toggleRouteFavorite(id: string) {
    setState((prev) => {
      const current = prev.favoriteRouteIds ?? [];
      return {
        ...prev,
        favoriteRouteIds: current.includes(id)
          ? current.filter((routeId) => routeId !== id)
          : [...current, id]
      };
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.svg" alt="" width={44} height={44} className="brandMark" priority />
          <div><strong>VeloQuest</strong><span>Ride · Level up · Repeat</span></div>
        </div>
        <div className="topActions">
          <button disabled={diagnosingBike || connectingBike} className={`bikePill ${bike ? "connected" : ""}`} onClick={bike ? () => disconnectBike() : connectBike}>
            <span>{bike ? "●" : "◌"}</span>{bike ? bike.deviceName : connectingBike ? "Connexion…" : "Vélo Bluetooth"}
          </button>
          <div className="levelPill"><span>Niv. {level}</span><strong>{xp} XP</strong></div>
        </div>
      </header>

      <section className={guidedView ? "hero guidedHero" : "hero"}>
        <div>
          <p className="eyebrow">{guidedView ? "TON PARCOURS DE DÉMARRAGE" : `SEMAINE ${week} / 12`}</p>
          <h1>{state.profile.name ? `${state.profile.name}, ta quête continue.` : "Ta quête continue."}</h1>
          <p>{guidedView ? "Une prochaine action claire. Le programme se précise avec tes séances et ton ressenti." : "Choisis selon ton temps et ton énergie. VeloQuest récompense la régularité, la variété et la progression."}</p>
          <div className="heroLevelProgress"><span><strong>{currentLevelTitle}</strong><small>{levelXp}/500 XP vers le niveau {level + 1}</small></span><i><b style={{ width: `${Math.round((levelXp / 500) * 100)}%` }} /></i></div>
        </div>
        <div className="heroRune"><span>{level}</span><small>NIVEAU</small><em>{currentLevelTitle}</em></div>
      </section>

      {tab === "dashboard" && (
        <>
          {resumeSnapshot && (
            <section className="card resumeSessionCard">
              <div className="resumeIcon">↻</div>
              <div>
                <p className="eyebrow">SÉANCE INTERROMPUE</p>
                <h2>Reprendre là où tu t’es arrêté ?</h2>
                <p>{resumeSnapshot.routeId ? "Parcours" : "Séance"} · segment {resumeSnapshot.segmentIndex + 1} · {formatClock(resumeSnapshot.secondsLeft)} restant sur le segment{resumeSnapshot.routeMode === "timeAttack" ? ` · chrono ${formatRaceTime(resumeSnapshot.timeAttackElapsedSeconds)}` : ""}.</p>
              </div>
              <div className="resumeActions"><button className="primary" onClick={resumeInterruptedSession}>Reprendre</button><button className="secondary dangerButton" onClick={discardInterruptedSession}>Abandonner</button></div>
            </section>
          )}

          {guidedView && <GettingStartedCard state={state} workout={guidedRecommendation} reasons={adaptiveCoach.reasons} weeklySessions={guidedWeekCount}
            availableMinutes={availableMinutes} energy={energy} onMinutes={setAvailableMinutes} onEnergy={setEnergy}
            onLaunch={() => launch(guidedRecommendation, null, "training", discoveryCount ? adaptiveCoach.suggestedResistanceDelta : 0)}
            onExplore={exploreGentleRides} onReview={reviewGuidance} onFree={leaveGuidance} />}

          {voyageCard}
          <AdaptiveProgram state={state} week={week} workouts={workouts} onChange={setState} onLaunch={workout => launch(workout)} />

          <details className={guidedView ? "guidedAdvanced" : "legacyDashboard"} open={guidedView ? undefined : true}>
            <summary hidden={!guidedView}>Voir le programme de douze semaines et les outils avancés</summary>
            <div>
          <section className="grid statsGrid">
            <Stat label="Points" value={stats.points} target={target.points} suffix=" pts" />
            <Stat label="Minutes" value={stats.minutes} target={target.minutes} suffix=" min" />
            <Stat label="Séances" value={stats.sessions} target={target.sessions} />
            <Stat label="Variété" value={stats.variety} target={target.variety} />
          </section>

          <section className="card weeklyMission">
            <div className="sectionHead"><div><p className="eyebrow">MISSION SEMAINE {week}</p><h2>Ce qu’il reste à conquérir</h2></div><strong>{perfectWeek ? "✓ complète" : `${quantity(Math.max(0, target.points - stats.points))} pts restants`}</strong></div>
            <p className="weeklyGoalHint">Objectif : {target.sessions} séances · {target.minutes} min au total. <button className="secondary miniButton" onClick={() => { setTab("more"); window.setTimeout(() => document.getElementById("weekly-goals")?.scrollIntoView({ block: "start" }), 0); }}>Régler mes objectifs</button></p>
            <div className="missionItems">
              <MissionItem label="Charge" value={stats.points} target={target.points} suffix=" pts" />
              <MissionItem label="Volume" value={stats.minutes} target={target.minutes} suffix=" min" />
              <MissionItem label="Séances" value={stats.sessions} target={target.sessions} />
              <MissionItem label="Variété" value={stats.variety} target={target.variety} />
              <div className={stats.hard <= target.maxHard ? "missionItem done" : "missionItem warning"}><span>{stats.hard <= target.maxHard ? "✓" : "!"}</span><div><strong>Intensité</strong><small>{stats.hard}/{target.maxHard} séances dures max</small></div></div>
            </div>
          </section>

          <section className="grid achievementGrid">
            <article className={`card achievement ${perfectWeek ? "success" : ""}`}><span>👑</span><div><small>Semaine</small><strong>{perfectWeek ? "Parfaite" : "En cours"}</strong><em>{quantity(stats.points)}/{target.points} pts · {stats.hard}/{target.maxHard} séances dures</em></div></article>
            <article className="card achievement"><span>🔥</span><div><small>Série</small><strong>{currentStreak} semaine{currentStreak > 1 ? "s" : ""}</strong><em>parfaite{currentStreak > 1 ? "s" : ""} d’affilée</em></div></article>
            <article className="card achievement"><span>🛣️</span><div><small>Distance totale</small><strong>{totalDistance.toFixed(1)} km</strong><em>enregistrés</em></div></article>
            <article className="card achievement"><span>📉</span><div><small>Transformation</small><strong>{weightLost > 0 ? `-${weightLost.toFixed(1)} kg` : "—"}</strong><em>{waistLost > 0 ? `-${waistLost.toFixed(1)} cm de taille` : "mesures à compléter"}</em></div></article>
          </section>

          <section className={`card bikeConsole ${bike ? "online" : ""}`}>
            <div className="sectionHead">
              <div><p className="eyebrow">VÉLO · MODE CONNECTÉ BETA</p><h2>{bike ? bike.deviceName : "Console Bluetooth"}</h2></div>
              <span className="connectionState">{bike ? "LIVE" : "OFFLINE"}</span>
            </div>
            {bike ? (
              <div className="consoleMetrics">
                <ConsoleMetric label="RPM" value={telemetry.cadenceRpm?.toFixed(0) ?? "—"} />
                <ConsoleMetric label="KM/H" value={telemetry.speedKmh?.toFixed(1) ?? "—"} />
                <ConsoleMetric label="WATTS" value={telemetry.powerW?.toFixed(0) ?? "—"} />
                <ConsoleMetric label="LEVEL" value={telemetry.resistance?.toFixed(1) ?? "—"} />
                <ConsoleMetric label="BPM" value={telemetry.heartRate?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="KM VÉLO" value={telemetry.distanceM !== undefined ? (telemetry.distanceM / 1000).toFixed(2) : "—"} />
                <ConsoleMetric label="KCAL VÉLO" value={telemetry.totalEnergyKcal?.toFixed(0) ?? "—"} />
              </div>
            ) : (
              <p>{webBluetoothHint() === "ios"
                ? "Sur iPhone/iPad, la PWA reste en mode guidé. Les données affichées par le vélo pourront être saisies en quelques secondes à la fin de la séance."
                : "Connecte un vélo FTMS compatible pour enregistrer automatiquement les données diffusées."}</p>
            )}
            {bike && (
              <div className="capabilityStrip">
                <span className={bike.capabilities.indoorBikeData ? "ok" : ""}>Télémétrie</span>
                <span className={bike.requestControl ? "ok" : ""}>Control Point {bike.requestControl ? "disponible" : "indisponible"}</span>
                <span className={bike.setResistance ? "ok" : ""}>Résistance {bike.setResistance ? "pilotable" : "manuelle"}</span>
                {bike.capabilities.resistanceRange && <span className="ok">Plage {bike.capabilities.resistanceRange.min}–{bike.capabilities.resistanceRange.max}</span>}
              </div>
            )}
            {!bike && <button className="secondary" onClick={connectBike} disabled={connectingBike || diagnosingBike}>{connectingBike ? "Recherche du vélo…" : "Connecter le vélo"}</button>}
            {bluetoothError && <p className="errorText">{bluetoothError}</p>}
          </section>

          <section className="card coachCard">
            <div className="sectionHead">
              <div><p className="eyebrow">COACH EXPRESS</p><h2>Combien de temps et quelle énergie ?</h2></div>
              <span className={`coachStatus ${adaptiveCoach.load}`}>{adaptiveCoach.load === "recovery" ? "🌿 récupération" : adaptiveCoach.load === "push" ? "🔥 fenêtre d’effort" : "⚡ charge équilibrée"}</span>
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
                <div className="chips"><span>{recommendation.duration} min</span><span>{quantity(recommendation.points)} pt{recommendation.points > 1 ? "s" : ""}</span><span>{recommendation.xp} XP</span><span>{recommendation.intensity === "hard" ? "intense" : recommendation.intensity === "moderate" ? "soutenu" : "facile"}</span><span>{adaptiveCoach.personalization === "personalized" ? "coach personnalisé" : adaptiveCoach.personalization === "learning" ? "coach en apprentissage" : "profil initial"}</span></div>
                <div className="coachReasons">{adaptiveCoach.reasons.slice(0,3).map((reason) => <span key={reason}>• {reason}</span>)}</div>
                {adaptiveCoach.suggestedResistanceDelta !== 0 && <div className="coachTune">Ajustement proposé pour cette séance : <strong>{adaptiveCoach.suggestedResistanceDelta > 0 ? "+" : ""}{adaptiveCoach.suggestedResistanceDelta} niveau</strong> d’après tes RPE précédents.</div>}
              </div>
              <button className="primary" onClick={() => launch(recommendation, null, "training", adaptiveCoach.suggestedResistanceDelta)}>Préparer la séance</button>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">BONUS</p><h2>Une petite marge ?</h2></div><span className="spark">+20 XP</span></div>
            <p>Ajoute 15 minutes faciles. Elles comptent dans ton volume et ta régularité, mais pas dans les points principaux. Les bonus XP sont plafonnés à 60 par semaine.</p>
            <div className="bonusChoices">
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-10")!)}>10 min</button>
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-soft-12")!)}>12 min souples</button>
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-15")!)}>15 min</button>
              <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-20")!)}>20 min</button>
            </div>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">GARDE-FOU</p><h2>Charge intense</h2></div><strong>{stats.hard}/{target.maxHard}</strong></div>
            <p>{stats.hard > target.maxHard ? "Tu as dépassé le plafond conseillé : privilégie l'endurance ou le décrassage." : "Une semaine parfaite respecte aussi le plafond de séances intenses."}</p>
          </section>
            </div>
          </details>
        </>
      )}

      {tab === "sessions" && (
        <section>
          <div className="pageHead pageHeadActions"><div><p className="eyebrow">CATALOGUE</p><h1>Choisis ta quête</h1><p>Du décrassage au HIIT. Le ressenti reste prioritaire sur le numéro de résistance.</p></div><button className="secondary" onClick={openManualLog}>+ Enregistrer une séance déjà faite</button></div>
          <p className="finePrint">Les formats express de moins de 10 min rapportent 0,5 point : des compléments à tes séances principales. Les bonus récupération restent à 0 point. Les points des séances déjà enregistrées sont conservés.</p>
          <MasteryPanel sessions={state.sessions} />
          <WorkoutProgramsPanel sessions={state.sessions} workouts={workouts} onLaunch={(workout) => launch(workout)} />
          <div className="workoutFilters">
            <button type="button" className="secondary" aria-pressed={expressOnly} onClick={() => setExpressOnly(value => !value)}>Express · moins de 10 min</button>
            <button type="button" className="secondary" aria-pressed={caloriesOnly} onClick={() => { setCaloriesOnly(value => !value); setExpressOnly(false); setSessionIntensityFilter("all"); }}>Défis calories</button>
            <label>Intensité des séances<select value={sessionIntensityFilter} onChange={event => setSessionIntensityFilter(event.target.value)}><option value="all">Toutes</option><option value="easy">Facile</option><option value="moderate">Soutenue</option><option value="hard">Dure</option></select></label>
          </div>
          <div className="grid workoutGrid">
            {workouts.filter(w => (!expressOnly || w.duration < 10) && (!caloriesOnly || isCalorieWorkout(w.id)) && (sessionIntensityFilter === "all" || w.intensity === sessionIntensityFilter)).map((w) => {
              const key = effortSettingsKey(w.id, withCadenceOffset(w, preferences.cadenceOffset ?? -15).segments, preferences.resistanceOffset, "training");
              const best = bestCadenceAttempt(state.sessions, key);
              const score = cadenceSummary(best?.metrics?.cadenceScore);
              const kcalBike = bestCalorieAttempt(state.sessions, w.id, "ftms", bike?.deviceName)?.metrics?.calorieChallenge;
              const kcalManual = bestCalorieAttempt(state.sessions, w.id, "manual")?.metrics?.calorieChallenge;
              return (
              <article className={`card workoutCard ${w.bonus ? "bonusCard" : ""}`} key={w.id}>
                <div className="sectionHead"><span className={`intensity ${w.intensity}`}>{w.intensity === "easy" ? "FACILE" : w.intensity === "moderate" ? "SOUTENU" : "DUR"}</span><strong>{w.duration} min</strong></div>
                <h2>{w.name}</h2><p>{w.tagline}</p>
                <p className="workoutBest"><strong>{isCalorieWorkout(w.id) ? `Record vélo : ${kcalBike ? kcalBike.kcal.toFixed(0) + " kcal · " + kcalBike.deviceName : "à établir"}` : best ? `Record coach : ${score.grade} · ${score.percent?.toFixed(1)} %` : "Record coach : à établir"}</strong><small>{isCalorieWorkout(w.id) ? `Record déclaré : ${kcalManual ? kcalManual.kcal.toFixed(0) + " kcal" : "à établir"} · ${w.duration} min complètes` : "À tes réglages actuels · séance complète"}</small></p>
                <div className="chips"><span>{quantity(w.points)} pt{w.points > 1 ? "s" : ""}</span><span>{w.xp} XP</span><span>{w.segments.length} segments</span></div>
                <button className="secondary" onClick={() => launch(w)}>Voir / démarrer</button>
              </article>
            ); })}
          </div>
        </section>
      )}

      {tab === "climbs" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PARCOURS</p><h1>Cols, étapes & balades.</h1><p>Une sortie douce, une étape vallonnée, une montée mythique ou ton propre GPX. La carte interactive complète s’ouvre pendant la séance.</p></div>

          <section className="card scenicIntro">
            <div><p className="eyebrow">BALADES · 1/5</p><h2>La France, à ton rythme.</h2><p>Des traces officielles, des paysages d’eau, de patrimoine et du littoral azuréen. Relief lissé, effort doux, pauses libres : découvre sans objectif de chrono. Vérifie la durée estimée, même sur terrain facile.</p></div>
            <div className="scenicActions"><button className="primary" onClick={() => {
              setRouteDuration("all");
              setRouteSearch(""); setRouteThemeId(""); setRouteCategoryFilter("scenic"); setRouteDifficultyFilter(1); setRouteFavoritesOnly(false);
              document.getElementById("route-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>Explorer les {climbs.filter((route) => routeCategory(route) === "scenic").length} balades</button>
            <button className="secondary" onClick={() => {
              setRouteSearch(""); setRouteThemeId(""); setRouteCategoryFilter("scenic"); setRouteDifficultyFilter(1); setRouteFavoritesOnly(false); setRouteDuration("30");
              document.getElementById("route-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>Une balade en 30 minutes</button></div>
          </section>

          <PersonalJourneys state={state} routes={allClimbs}
            onSave={journey => setState(previous => ({ ...previous, journeys: [...(previous.journeys ?? []), journey] }))}
            onDelete={id => setState(previous => ({ ...previous, journeys: (previous.journeys ?? []).filter(j => j.id !== id) }))}
            onContinue={route => { setState(previous => ({ ...previous, voyage: { routeId: route.id, minutes: previous.voyage?.minutes ?? 30 } })); setVoyagePickerOpen(true); }} />
          <RouteThemesPanel sessions={state.sessions} selectedId={routeThemeId} onSelect={(id) => {
            setRouteDuration("all");
            setRouteThemeId(id); setRouteSearch(""); setRouteCategoryFilter("all"); setRouteDifficultyFilter(0); setRouteFavoritesOnly(false);
            document.getElementById("route-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }} />

          <CampaignsPanel
            sessions={state.sessions}
            routes={allClimbs}
            onLaunch={(route) => launch(climbToWorkout(route), route, "training")}
          />

          <section className="card routeLibraryToolbar" id="route-library">
            <div className="routeSearchBox">
              <label htmlFor="route-search">Rechercher</label>
              <input id="route-search" value={routeSearch} onChange={(event) => setRouteSearch(event.target.value)} placeholder="Èze, Menton, Verdon, Alsace…" />
            </div>
            <div className="routeThemeSelect"><label htmlFor="route-theme">Thème</label>
              <select id="route-theme" value={routeThemeId} onChange={(event) => setRouteThemeId(event.target.value)}>
                <option value="">Tous les paysages</option>
                {routeThemes.map((theme) => <option key={theme.id} value={theme.id}>{theme.title}</option>)}
              </select>
            </div>
            <div className="routeThemeSelect"><label htmlFor="route-duration">Durée simulée</label>
              <select id="route-duration" value={routeDuration} onChange={(event) => setRouteDuration(event.target.value as typeof routeDuration)}>
                <option value="all">Toutes les durées</option><option value="30">30 min ou moins</option><option value="60">Plus de 30 à 60 min</option><option value="long">Plus de 60 min</option>
              </select>
            </div>
            <div className="routeFilterGroup">
              <small>Catégorie</small>
              <div className="choiceRow">
                {([
                  ["all", "Tout"],
                  ["climb", "Cols"],
                  ["stage", "Étapes"],
                  ["scenic", "Balades"],
                  ["imported", "Mes GPX"]
                ] as const).map(([value,label]) => (
                  <button key={value} className={routeCategoryFilter === value ? "choice active" : "choice"} onClick={() => setRouteCategoryFilter(value)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="routeFilterGroup">
              <small>Difficulté</small>
              <div className="choiceRow">
                <button className={routeDifficultyFilter === 0 ? "choice active" : "choice"} onClick={() => setRouteDifficultyFilter(0)}>Toutes</button>
                {[1,2,3,4,5].map((level) => <button key={level} className={routeDifficultyFilter === level ? "choice active" : "choice"} onClick={() => setRouteDifficultyFilter(level as 1|2|3|4|5)}>{level}★</button>)}
              </div>
            </div>
            <div className="routeToolbarBottom">
              <button className={routeFavoritesOnly ? "secondary favoriteFilter active" : "secondary favoriteFilter"} onClick={() => setRouteFavoritesOnly((value) => !value)}>♥ Favoris {favoriteRouteIds.length ? `(${favoriteRouteIds.length})` : ""}</button>
              <label>Trier
                <select value={routeSort} onChange={(event) => setRouteSort(event.target.value as typeof routeSort)}>
                  <option value="featured">Sélection VeloQuest</option>
                  <option value="difficulty">Difficulté</option>
                  <option value="distance">Distance</option>
                  <option value="elevation">Dénivelé</option>
                  <option value="pb">Meilleurs chronos</option>
                </select>
              </label>
              <span>{visibleRoutes.length} parcours</span>
            </div>
          </section>

          <section className="card gpxImport">
            <div>
              <p className="eyebrow">IMPORT GPX</p>
              <h2>Une route réelle devient une quête.</h2>
              <p>VeloQuest calcule la distance, le D+, les pentes lissées, le profil altimétrique et les niveaux guidés 1–32. Le fichier reste sur ton appareil.</p>
            </div>
            <label className="primary gpxButton">Choisir un fichier GPX<input type="file" accept=".gpx,application/gpx+xml" onChange={(e) => importGpx(e.target.files?.[0])} /></label>
            {gpxError && <p className="errorText">{gpxError}</p>}
          </section>

          {visibleRoutes.length ? (
            <div className="routeLibraryGrid">
              {visibleRoutes.map((climb) => {
                const difficulty = routeDifficulty(climb);
                const terrain = routeTerrain(climb);
                const category = routeCategory(climb);
                const pb = personalBest(state.sessions, climb.id);
                const attempts = routeAttempts(state.sessions, climb.id).length;
                const favorite = favoriteRouteIds.includes(climb.id);

                return (
                  <article className={`card routeLibraryCard ${climb.featured ? "featured" : ""} ${category === "scenic" ? "scenicCard" : ""}`} key={climb.id}>
                    <div className="routeCardTop">
                      <div>
                        <div className="routeBadges">
                          <span>{category === "scenic" ? "BALADE" : category === "stage" ? "ÉTAPE" : category === "imported" ? "GPX" : "COL"}</span>
                          {climb.featured && <span className="featuredTag">SÉLECTION</span>}
                          {climb.parentRouteId && <span>FORMAT COURT</span>}
                        </div>
                        <p className="eyebrow">{climb.region.toUpperCase()}</p>
                        <h2>{climb.name}</h2>
                        <p>{climb.subtitle}</p>
                      </div>
                      <button className={favorite ? "favoriteButton active" : "favoriteButton"} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => toggleRouteFavorite(climb.id)}>{favorite ? "♥" : "♡"}</button>
                    </div>

                    <div className="routeDifficulty"><span>{"★".repeat(difficulty)}{"☆".repeat(5-difficulty)}</span><small>Difficulté {difficulty}/5</small></div>
                    {category === "scenic" && <div className="scenicPace"><span>🌿 RPE 2–4 · pauses libres</span><span>≈ {climbToWorkout(climb).duration} min simulées</span></div>}

                    <div className="climbStats compactStats">
                      <span><strong>{climb.distanceKm.toFixed(1)}</strong> km</span>
                      <span><strong>{climb.elevationGainM}</strong> m D+</span>
                      <span><strong>{terrain.ascentKm.toFixed(1)}</strong> km ↑</span>
                      <span><strong>{terrain.descentKm.toFixed(1)}</strong> km ↓</span>
                    </div>

                    <ClimbProfile climb={climb} />

                    <div className="routeTags">
                      {(climb.tags ?? []).slice(0,5).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>

                    {climb.scenery && <details className="sceneryDetails"><summary>Découvrir le paysage</summary><p>{climb.scenery}</p><div className="routeTags">{climb.highlights?.map((highlight) => <span key={highlight}>{highlight}</span>)}</div></details>}
                    <RoutePlaces route={climb} />
                    {preferences.showRoutePhotos && <RoutePhotos key={climb.id} route={climb} />}

                    <div className="timeAttackSummary">
                      <span><small>RECORD</small><strong>{pb?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(pb.metrics.elapsedSeconds) : "—"}</strong></span>
                      <span><small>TENTATIVES</small><strong>{attempts}</strong></span>
                      <span><small>DÉFIS RÉUSSIS</small><strong>{state.sessions.filter((session) => session.routeId === climb.id && session.metrics?.challenge?.success).length}</strong></span>
                    </div>

                    <p className="routeNote">{climb.note}</p>
                    {climb.sourceUrl && <a className="routeSource" href={climb.sourceUrl} target="_blank" rel="noreferrer">Source : {climb.sourceLabel ?? "fiche officielle"} ↗</a>}

                    <div className="climbActions">
                      <button className="primary" onClick={() => launch(climbToWorkout(climb), climb, "training")}>{category === "scenic" ? "Partir en balade" : "Entraînement"}</button>
                      <button className="secondary timeAttackButton" onClick={() => launch(climbToWorkout(climb), climb, "timeAttack")}><span className="actionIcon">⏱</span>{" "}<span>Time Attack</span></button>
                      <button className="secondary segmentAttackButton" onClick={() => setSegmentAttackRoute(climb)}><span className="actionIcon">⚡</span>{" "}<span>Segments</span></button>
                      <button className="secondary challengeButton" onClick={() => setChallengeRoute(climb)}><span className="actionIcon">◆</span>{" "}<span>Défis</span></button>
                      <button className="secondary" onClick={() => { setState(prev => ({ ...prev, voyage: { routeId: climb.id, minutes: prev.voyage?.minutes ?? 30 } })); setVoyagePickerOpen(true); }}>🧳 Voyage en plusieurs séances</button>
                      {climb.id.startsWith("gpx-") && <button className="secondary dangerButton" onClick={() => deleteCustomClimb(climb.id)}>Supprimer</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="card routeEmpty"><span>⌕</span><h2>Aucun parcours ne correspond.</h2><p>Modifie les filtres ou importe un GPX personnel.</p><button className="secondary" onClick={() => { setRouteDuration("all"); setRouteSearch(""); setRouteThemeId(""); setRouteCategoryFilter("all"); setRouteDifficultyFilter(0); setRouteFavoritesOnly(false); }}>Réinitialiser les filtres</button></section>
          )}
        </section>
      )}

      {tab === "progress" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PROGRESSION</p><h1>Mesures & journal</h1></div>
          <div className="grid twoCols">
            <section className="card">
              <h2>Nouvelle mesure</h2>
              <form action={addMeasurement} className="form">
                <label>Date de mesure<input name="measuredOn" type="date" defaultValue={localInputDate()} required /></label>
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

          <WeeklyReview state={state} week={week} workouts={workouts} onHabits={entry => setState(previous => ({ ...previous, habits: [...(previous.habits ?? []).filter(h => h.date !== entry.date), entry] }))} />
          <PerformanceRecords sessions={state.sessions} />

          <section className="card journalCard">
            <h2>Journal des séances</h2>
            <div className="sessionHistory">
              {[...state.sessions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,20).map((session) => {
                const template = workouts.find((w) => w.id === session.templateId);
                const route = allClimbs.find((c) => c.id === session.routeId);
                return (
                  <button className="sessionHistoryRow" key={session.id} onClick={() => setSelectedSessionId(session.id)}>
                    <span className="historyDate">{dateLabel(session.date)}</span>
                    <span className="historySummary"><strong>{route?.name ?? template?.name ?? session.templateId}</strong><small>{session.duration.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} min · {session.metrics?.voyage ? `Voyage · ${session.metrics.voyage.completedPortion ? "portion achevée" : "portion inachevée"}` : session.metrics?.source === "mixed" ? "Vélo + saisie" : session.metrics?.source === "ftms" ? "Vélo connecté" : "Saisie manuelle"}</small></span>
                    <span className="historyMetrics">
                      {session.metrics?.distanceKm !== undefined && <span>{session.metrics.distanceKm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km</span>}
                      {session.metrics?.avgPowerW !== undefined && <span>{session.metrics.avgPowerW.toFixed(0)} W</span>}
                      {session.metrics?.avgHeartRate !== undefined && <span>{session.metrics.avgHeartRate.toFixed(0)} bpm</span>}
                      {session.rpe !== undefined && <span>RPE {session.rpe}</span>}
                    </span>
                    <span className="historyDetails" aria-hidden="true">Voir <span>›</span></span>
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
                <div key={m.id}><span>{dateLabel(m.date)}</span><strong>{m.weight ? `${m.weight} kg` : "—"}</strong><span>{m.waist ? `${m.waist} cm taille` : "—"}</span><button className="iconDanger" aria-label={`Supprimer la mesure du ${dateLabel(m.date)}`} onClick={() => deleteMeasurement(m.id)}>×</button></div>
              ))}
              {!state.measurements.length && <p>Aucune mesure pour l'instant.</p>}
            </div>
          </section>
        </section>
      )}

      {tab === "more" && (
        <section className="morePage">
          <div className="pageHead"><p className="eyebrow">PLUS · VERSION {process.env.NEXT_PUBLIC_BUILD_COMMIT?.slice(0, 7)}</p><h1>Réglages, badges & données</h1><p>Tout ce qui personnalise VeloQuest sans encombrer la navigation principale.</p></div>

          <InstallCard />
          <PwaStatusCard />

          <section className="card quickGuide">
            <div className="sectionHead"><div><p className="eyebrow">GUIDE RAPIDE</p><h2>Une routine simple</h2></div><span className="spark">4 étapes</span></div>
            <div className="guideSteps">
              <div><span>1</span><p><strong>Choisis selon ton temps.</strong><small>Le Coach Express adapte la séance au créneau et à ton énergie.</small></p></div>
              <div><span>2</span><p><strong>Respecte surtout le RPE.</strong><small>Le niveau guidé 1–32 est un repère ; utilise la calibration globale s’il est trop facile ou trop dur.</small></p></div>
              <div><span>3</span><p><strong>Enregistre la séance.</strong><small>Bluetooth si disponible, sinon recopie simplement les chiffres utiles du vélo.</small></p></div>
              <div><span>4</span><p><strong>Suis les tendances.</strong><small>Poids, tour de taille, régularité et volume comptent davantage qu’une valeur isolée.</small></p></div>
            </div>
          </section>

          <WeeklyGoalsForm key={`${week}-${target.sessions}-${target.minutes}`} target={target} onSave={(sessions, minutes) => { setState(previous => changeWeeklyGoals(previous, week, sessions, minutes)); setToast("Objectifs enregistrés pour cette semaine et les suivantes."); }} />

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">CONFORT DE SÉANCE</p><h2>Ton cockpit</h2></div><span className="spark">personnalisable</span></div>
            <ReaderViewChoice preferences={preferences} onChange={updatePreference} />
            <SessionComfort preferences={preferences} onChange={updatePreference} />
            <CadenceCalibration sessions={state.sessions} offset={preferences.cadenceOffset ?? -15} onChange={offset => updatePreference("cadenceOffset", offset)} />
            <div className="toggleList">
              <Toggle label="Retour haptique" description="Vibration si le navigateur et l’appareil le permettent." checked={preferences.haptics} onChange={(v) => updatePreference("haptics", v)} />
              <Toggle label="Garder l’écran éveillé" description="Demande le maintien pendant l’effort ; le lecteur affiche l’état accordé ou refusé." checked={preferences.keepScreenAwake} onChange={(v) => updatePreference("keepScreenAwake", v)} />
              <Toggle label="Conserver la trace Bluetooth" description="Garde une trace compacte de la télémétrie pour l’historique." checked={preferences.keepTelemetryTrace} onChange={(v) => updatePreference("keepTelemetryTrace", v)} />
              <div className="resistanceCalibration">
                <div><strong>Calibration résistance 1–32</strong><small>Ajuste tous les niveaux guidés et automatiques sans modifier les séances.</small></div>
                <span>{preferences.resistanceOffset > 0 ? `+${preferences.resistanceOffset}` : preferences.resistanceOffset}</span>
                <input type="range" min="-4" max="4" step="1" value={preferences.resistanceOffset} onChange={(event) => updateResistanceOffset(Number(event.target.value))} />
                <div className="calibrationLabels"><small>plus facile</small><button className="secondary miniButton" onClick={() => updateResistanceOffset(0)}>neutre</button><small>plus dur</small></div>
              </div>
            </div>
          </section>

          <BleDiagnosticPanel disabled={pwa.locked() || Boolean(bike) || connectingBike || Boolean(active)} onBusyChange={setDiagnosingBike} />

          <section className="card" aria-label="Laboratoire FTMS">
            <div className="sectionHead"><div><p className="eyebrow">BLUETOOTH LAB</p><h2>{bike ? bike.deviceName : "Diagnostic FTMS"}</h2></div><span className={bike ? "connectionState onlineText" : "connectionState"}>{bike ? "CONNECTÉ" : "OFFLINE"}</span></div>
            {bike ? (
              <>
                <div className="consoleMetrics compact">
                  <ConsoleMetric label="RPM" value={telemetry.cadenceRpm?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="WATTS" value={telemetry.powerW?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="LEVEL" value={telemetry.resistance?.toFixed(1) ?? "—"} />
                  <ConsoleMetric label="BPM" value={telemetry.heartRate?.toFixed(0) ?? "—"} />
                  <ConsoleMetric label="KM/H" value={telemetry.speedKmh?.toFixed(1) ?? "—"} />
                  <ConsoleMetric label="KM VÉLO" value={telemetry.distanceM !== undefined ? (telemetry.distanceM / 1000).toFixed(2) : "—"} />
                <ConsoleMetric label="KCAL VÉLO" value={telemetry.totalEnergyKcal?.toFixed(0) ?? "—"} />
                </div>
                <p className="finePrint">{lastTelemetryAt === null ? "En attente du premier paquet du vélo. Pédale doucement pour réveiller les mesures." : `Dernier paquet reçu à ${new Date(lastTelemetryAt).toLocaleTimeString("fr-FR")}. Vérifie que les chiffres évoluent en pédalant puis à l’arrêt.`}</p>
                <div className="diagnosticGrid">
                  <span><small>FTMS</small><strong>{bike.capabilities.ftms ? "OK" : "—"}</strong></span>
                  <span><small>Control Point</small><strong>{bike.requestControl ? "prêt à demander" : bike.capabilities.controlPoint ? "présent, inutilisable" : bike.capabilities.controlPointStatus === "unavailable" ? "inaccessible" : "non trouvé"}</strong></span>
                  <span><small>Résistance cible</small><strong>{bike.capabilities.supportsResistanceTarget ? "annoncée" : bike.capabilities.featureStatus === "read" ? "non annoncée" : "inconnue"}</strong></span>
                  <span><small>Plage</small><strong>{bike.capabilities.resistanceRange ? `${bike.capabilities.resistanceRange.min}–${bike.capabilities.resistanceRange.max}` : bike.capabilities.rangeStatus === "invalid" ? "invalide" : "inconnue"}</strong></span>
                </div>
                {bike.capabilities.featureStatus === "not-found" && <p className="finePrint">FTMS Feature (2ACC) non trouvée : les commandes de résistance prises en charge restent inconnues.</p>}
                {bike.capabilities.controlPointStatus === "unsupported-properties" && <p className="finePrint">Le point de contrôle n’expose pas les propriétés d’écriture avec réponse et d’indication nécessaires au contrôle FTMS standard. Utilise les réglages de résistance de la console pendant la réception des mesures.</p>}
                {bike.capabilities.controlPointStatus === "unavailable" && <p className="finePrint">Le canal d’acquittement du point de contrôle est inaccessible. Le contrôle de résistance reste indisponible pour cette connexion.</p>}
                <p className="finePrint">Les capacités annoncées ne prouvent pas le changement physique de résistance. Les tests manuels utilisent les unités FTMS annoncées ; vérifie leur correspondance avec l’écran du vélo.</p>
                {bike.capabilities.supportsResistanceTarget && bike.requestControl && bike.setResistance && (
                  <div className="controlLab">
                    <div className="sectionHead"><div><small>LABORATOIRE DE CONTRÔLE</small><strong>{controlGranted ? "Contrôle accordé" : "Contrôle non demandé"}</strong></div><span className={controlGranted ? "labState ok" : "labState"}>{controlGranted ? "ARMÉ" : "VERROUILLÉ"}</span></div>
                    {active && <p>Ferme le lecteur avant les commandes manuelles de test.</p>}
                    {controlBusy && <p role="status">Commande FTMS en cours…</p>}
                    {!controlGranted ? (
                      <button className="secondary" disabled={controlBusy || Boolean(active)} onClick={requestBikeControl}>Demander le contrôle FTMS</button>
                    ) : (
                      <>
                        <label>Résistance FTMS de test <strong>{testResistanceLevel}</strong><input type="range" min={bike.capabilities.resistanceRange?.min} max={bike.capabilities.resistanceRange?.max} step={bike.capabilities.resistanceRange?.increment} disabled={controlBusy || Boolean(active)} value={testResistanceLevel} onChange={(e) => setTestResistanceLevel(Number(e.target.value))} /></label>
                        <button className="secondary" disabled={controlBusy || Boolean(active)} onClick={() => void sendTestResistance(Boolean(active))}>Envoyer ce niveau au vélo</button>
                        <div className="modalActions">
                          <button className="secondary" disabled={controlBusy || Boolean(active)} onClick={() => setTestResistanceLevel(bike.capabilities.resistanceRange!.min)}>Choisir le minimum</button>
                          <button className="secondary" disabled={controlBusy || Boolean(active)} onClick={() => { const range = bike.capabilities.resistanceRange!; setTestResistanceLevel(Math.min(range.max, Math.round((range.min + range.increment) * 10) / 10)); }}>Choisir un pas au-dessus</button>
                        </div>
                        <p className="finePrint">Choisir prépare la consigne. Seul « Envoyer ce niveau au vélo » l’applique. Un acquittement ne confirme pas l’effet physique.</p>
                        {bike.capabilities.resistanceRange?.min === 1 && bike.capabilities.resistanceRange.max === 32 && bike.capabilities.resistanceRange.increment === 1 ? <>
                          <Toggle label="Correspondance physique 1–32 vérifiée pour cette connexion" description="À cocher seulement après avoir comparé les commandes manuelles avec l’écran et la résistance effective du vélo." checked={resistanceMappingVerified} onChange={setResistanceMappingVerified} />
                          {resistanceMappingVerified && <Toggle label="Auto-résistance pour cette connexion" description="À chaque changement de segment, VeloQuest envoie le niveau cible au vélo. Désactivé automatiquement en cas d’erreur." checked={autoResistanceControl} onChange={setAutoResistanceControl} />}
                        </> : <p>Auto-résistance indisponible : la plage annoncée ne correspond pas aux consignes 1–32. Aucune conversion matérielle n’est supposée.</p>}
                      </>
                    )}
                  </div>
                )}
                <button className="secondary" onClick={() => disconnectBike(true)}>Déconnecter le vélo après le test</button>
              </>
            ) : (
              <>
                <p>{webBluetoothHint() === "ios" ? "iOS n’expose pas Web Bluetooth aux PWA. VeloQuest reste utilisable en mode guidé et saisie manuelle." : "Connecte le vélo pour inspecter précisément les caractéristiques FTMS qu’il expose."}</p>
                <button className="secondary" onClick={connectBike} disabled={connectingBike || diagnosingBike}>{connectingBike ? "Recherche…" : "Connecter pour la télémétrie FTMS"}</button>
              </>
            )}
          </section>

          {bluetoothError && <p className="errorText" role="alert">{bluetoothError}</p>}

          <ProgressionPalmares sessions={state.sessions} routes={allClimbs} />

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
            <button className="secondary" onClick={reviewGuidance}>Revoir le guide de démarrage</button>
            <div className="storageMeter"><span>Empreinte locale</span><strong>{localBytes < 1024 * 1024 ? `${Math.max(1, Math.round(localBytes / 1024))} Ko` : `${(localBytes / 1024 / 1024).toFixed(2)} Mo`}</strong></div>
            <button className="secondary" onClick={exportData}>Exporter une sauvegarde JSON v3</button>
            {backupExport && <BackupTransfer backup={backupExport} filename={`veloquest-${localInputDate()}.json`} onClose={() => setBackupExport(null)} />}
            <button className="secondary" onClick={exportCsv}>Exporter séances + mesures en CSV</button>
            <label className="secondary fileButton">Importer une sauvegarde<input type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} /></label>
            <BackupPaste onImport={importData} />
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

      {segmentAttackRoute && (
        <div className="modalBackdrop" onClick={() => setSegmentAttackRoute(null)}>
          <section className="sessionModal segmentAttackPicker" onClick={(event) => event.stopPropagation()}>
            <button className="close" aria-label="Fermer les secteurs" onClick={() => setSegmentAttackRoute(null)}>×</button>
            <p className="eyebrow">SEGMENT ATTACK · {segmentAttackRoute.name.toUpperCase()}</p>
            <h2>Choisis ton secteur.</h2>
            <p className="challengeLead">Chaque quart possède son propre record. Avec FTMS, la distance réelle déclenche l’arrivée ; sinon VeloQuest simule le secteur à partir du profil.</p>
            <div className="segmentAttackList">
              {[0,1,2,3].map((index) => {
                const bounds = segmentBounds(segmentAttackRoute.distanceKm, index);
                const best = segmentPersonalBest(state.sessions, segmentAttackRoute.id, index);
                const attempts = segmentAttempts(state.sessions, segmentAttackRoute.id, index).length;
                return (
                  <button key={index} className="segmentAttackChoice" onClick={() => launchSegmentAttack(segmentAttackRoute, index)}>
                    <span className="segmentAttackNumber">{index + 1}</span>
                    <div>
                      <strong>Secteur {index + 1} · {bounds.startKm.toFixed(1)} → {bounds.endKm.toFixed(1)} km</strong>
                      <p>{bounds.distanceKm.toFixed(1)} km · {attempts} tentative{attempts > 1 ? "s" : ""}</p>
                    </div>
                    <em>{best?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(best.metrics.elapsedSeconds) : "Nouveau"}</em>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {challengeRoute && (
        <div className="modalBackdrop" onClick={() => setChallengeRoute(null)}>
          <section className="sessionModal challengePicker" onClick={(event) => event.stopPropagation()}>
            <button className="close" aria-label="Fermer les défis" onClick={() => setChallengeRoute(null)}>×</button>
            <p className="eyebrow">DÉFIS · {challengeRoute.name.toUpperCase()}</p>
            <h2>Choisis une contrainte.</h2>
            <p className="challengeLead">Les défis donnent un bonus XP uniquement s’ils sont réellement validés à l’arrivée. Les règles utilisant cadence ou chrono s’appuient sur FTMS quand il est disponible, sinon sur les valeurs saisies.</p>
            <div className="challengeList">
              {challengesForRoute(challengeRoute, Boolean(personalBest(state.sessions, challengeRoute.id))).map((challenge) => (
                <button key={challenge.id} className="challengeChoice" onClick={() => launchChallenge(challengeRoute, challenge)}>
                  <span>{challenge.icon}</span>
                  <div><strong>{challenge.title}</strong><p>{challenge.description}</p><small>{challenge.baseMode === "timeAttack" ? "Time Attack" : "Entraînement"} · +{challenge.xpBonus} XP{challenge.requiresCadence ? " · cadence requise" : ""}</small></div>
                  <em>›</em>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {voyagePickerOpen && !active && <div className="modalBackdrop"><section className="sessionModal voyagePicker" role="dialog" aria-label="Préparer mon voyage"><button className="close" aria-label="Fermer le voyage" onClick={() => setVoyagePickerOpen(false)}>×</button>{voyageCard}</section></div>}

      {active && (
        <div className="modalBackdrop">
          <div ref={readerRef} className={`sessionModal ${activeClimb ? "climbSession" : ""} ${activeVoyage ? "voyageSession" : ""} ${sessionStarted && !showFinish && preferences.readerView === "essential" ? "essentialSession" : ""}`}>
            <button className="close" aria-label="Mettre la séance de côté" onClick={parkActiveSession}>×</button>

            {showFinish ? (
              <form action={finishActive} className="finishForm" onKeyDown={event => {
                if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); event.target.blur(); }
              }}>
                <p className="eyebrow">JOURNAL DE SÉANCE</p>
                <h2>Enregistre ta performance</h2>
                <p>Vérifie les mesures ci-dessous, puis confirme l’enregistrement. Les champs vides restent facultatifs.</p>
                {calorieMode ? <CalorieResult result={calorieResult} previous={caloriePrevious?.metrics?.calorieChallenge} /> : <><CadenceResult score={cadenceScore} /><CoachComparison score={cadenceScore} previous={previousCadenceBest?.metrics?.cadenceScore} eligible={cadenceRecordEligible} /></>}
                {activeVoyage && <p className="voyageNext">{sessionElapsedSeconds >= totalSessionSeconds - .01 ? `Portion achevée : ${activeVoyage.startKm.toFixed(2)} → ${activeVoyage.endKm.toFixed(2)} km. Enregistre-la pour avancer dans ton voyage.` : "Portion inachevée : la séance reste dans ton journal, mais ce passage sera à refaire. Tu peux aussi fermer pour conserver la séance et la reprendre."} La distance du Voyage est simulée ; les champs ci-dessous décrivent les mesures du vélo.</p>}
                {activeVoyage && sessionElapsedSeconds < totalSessionSeconds - .01 && <button type="button" className="secondary" onClick={() => setShowFinish(false)}>Continuer cette portion</button>}
                {(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb && (
                  <div className="raceFinishBanner">
                    <span><small>CHRONO</small><strong>{formatRaceTime(timeAttackElapsedSeconds)}</strong></span>
                    <span><small>RECORD AVANT DÉPART</small><strong>{activeRaceBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(activeRaceBest.metrics.elapsedSeconds) : "première tentative"}</strong></span>
                  </div>
                )}
                {telemetrySamples.length > 0 && <p className="connectedNotice">✓ {telemetrySamples.length} échantillons FTMS récupérés. Les champs connus sont préremplis.</p>}
                <div className="form">
                  <label>Date et heure de la séance<input name="loggedAt" type="datetime-local" defaultValue={localInputDateTime()} required /></label>
                  <div className="formRow">
                    {(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb
                      ? <label>Chrono final (secondes)<input name="elapsedSeconds" type="number" step="1" defaultValue={timeAttackElapsedSeconds || undefined} /></label>
                      : <label>Durée (min)<input name="duration" type="number" step="0.01" readOnly={Boolean(activeVoyage) || calorieMode} defaultValue={calorieMode ? Number((sessionElapsedSeconds / 60).toFixed(2)) : activeVoyage ? Number((sessionElapsedSeconds / 60).toFixed(2)) : active.duration} /></label>}
                    <label>RPE ressenti /10<input name="rpe" type="number" min="1" max="10" step="0.5" /></label>
                  </div>
                  {calorieMode && <label>Origine des calories<select value={calorieSource} onChange={event => setCalorieSource(event.target.value as "ftms" | "manual")}><option value="manual">Saisie déclarée · record séparé</option><option value="ftms" disabled={calorieAttempt?.kcal === undefined}>Compteur du vélo sur cette épreuve</option></select></label>}
                  <div className="formRow">
                    <label>Distance (km)<input name="distance" type="number" step="0.01" defaultValue={autoMetrics.distanceKm?.toFixed(2)} /></label>
                    <label>Calories affichées{calorieMode ? <input name="calories" type="number" min="0" step="1" readOnly={calorieSource === "ftms"} value={calorieSource === "ftms" ? calorieAttempt?.kcal ?? "" : manualChallengeCalories} onChange={event => setManualChallengeCalories(event.target.value)} /> : <input name="calories" type="number" step="1" defaultValue={autoMetrics.calories?.toFixed(0)} />}</label>
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
                  <label className="finishReview"><input type="checkbox" checked={finishReviewed} onChange={event => setFinishReviewed(event.target.checked)} />J’ai vérifié le bilan et les champs facultatifs.</label>
                  <button className="primary" type="submit" disabled={!finishReviewed}>{activeVoyage ? "Enregistrer ma portion" : `Valider la quête · +${active.xp} XP`}</button>
                </div>
              </form>
            ) : !sessionStarted ? (
              <div className="sessionPreview">
                <p className="eyebrow">{activeVoyage ? "VOYAGE · PORTION" : activeClimb ? (routeMode === "timeAttack" ? "TIME ATTACK" : routeMode === "segmentAttack" ? "SEGMENT ATTACK" : routeCategory(activeClimb) === "scenic" ? "BALADE · 1/5" : "PARCOURS") : "PRÉPARATION"}</p>
                <h2>{active.name}</h2>
                {previousCadenceBest && <p className="cadenceBest">Meilleur suivi à ces réglages : {cadenceSummary(previousCadenceBest.metrics?.cadenceScore).grade} · {cadenceSummary(previousCadenceBest.metrics?.cadenceScore).percent?.toFixed(1)} %</p>}
                <p className="previewDescription">{activeVoyage ? `${active.tagline} · ≈ ${active.duration.toFixed(1)} min. Position simulée à 15 km/h, pauses libres. Les mesures FTMS sont enregistrées séparément et ne pilotent pas ce mode.` : scenicSession ? "RPE 2–4, résistance douce et pauses libres. Parcours entier, sans objectif de chrono : choisis selon la durée estimée et ton énergie." : activeClimb?.subtitle ?? active.description}</p>
                {activeClimb?.scenery && <details className="sceneryDetails"><summary>Découvrir le paysage et son profil</summary><p>{activeClimb.scenery}</p><small>{activeClimb.note}</small></details>}
                {activeClimb && <RoutePlaces route={activeClimb} />}
                {activeClimb && preferences.showRoutePhotos && <RoutePhotos key={activeClimb.id} route={activeClimb} currentKm={activeVoyage?.startKm} />}
                <div className="previewStats">
                  <span><small>{(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb ? "Record" : "Durée"}</small><strong>{(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb ? (activeRaceBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(activeRaceBest.metrics.elapsedSeconds) : "à établir") : `${activeVoyage ? active.duration.toFixed(1) : active.duration} min`}</strong></span>
                  <span><small>Intensité</small><strong>{active.intensity === "hard" ? "dure" : active.intensity === "moderate" ? "soutenue" : "facile"}</strong></span>
                  <span><small>Récompense</small><strong>{activeVoyage ? `${activeClimb?.xp} XP au bout du voyage` : `+${active.xp} XP`}</strong></span>
                  <span><small>Segments</small><strong>{active.segments.length}</strong></span>
                </div>
                {bike && <div className="connectedNotice">✓ {bike.deviceName} connecté · {autoResistanceControl && controlGranted ? "résistance automatique activée" : "télémétrie active · résistance manuelle"}
                  {resistanceMappingVerified && !autoResistanceControl && <button type="button" className="secondary" disabled={controlBusy} onClick={() => controlGranted ? setAutoResistanceControl(true) : void requestBikeControl()}>Activer le pilotage automatique</button>}
                  {bluetoothError && <p role="status">{bluetoothError}</p>}
                </div>}
                {!calorieMode && <label>Rythme de pédalage<select value={sessionCadenceOffset} onChange={event => {
                  const offset = Number(event.target.value);
                  const baseline = withCadenceOffset(cadenceBase.current ?? active, offset);
                  setActive(baseline); setSessionCadenceOffset(offset); updatePreference("cadenceOffset", offset);
                }}>{![-15, 0, 10].includes(sessionCadenceOffset) && <option value={sessionCadenceOffset}>Personnel · {sessionCadenceOffset > 0 ? "+" : ""}{sessionCadenceOffset} tr/min</option>}<option value={-15}>Doux · −15 tr/min</option><option value={0}>Classique</option><option value={10}>Soutenu · +10 tr/min</option></select></label>}
                <p className="finePrint">{calorieMode ? "Épreuve à rythme libre. Les records du vélo et les saisies déclarées sont séparés ; le compteur du vélo doit être disponible dès le départ pour un record mesuré." : "Les cibles affichées et le score suivent ce réglage. Le RPE est un effort visé, pas une mesure : ton ressenti prime."}</p>
                {activeChallenge && (
                  <div className="activeChallengeBanner">
                    <span>{activeChallenge.icon}</span>
                    <div><small>DÉFI ACTIF</small><strong>{activeChallenge.title}</strong><p>{activeChallenge.description} · Bonus +{activeChallenge.xpBonus} XP</p></div>
                  </div>
                )}
                {(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb && (
                  <div className="timeAttackIntro">
                    <strong>{routeMode === "segmentAttack" ? `Secteur ${(segmentAttackIndex ?? 0) + 1} · ${raceDistanceKm.toFixed(1)} km` : bike ? "Mode FTMS précis" : "Mode simulation"}</strong>
                    <p>{bike
                      ? "La distance réelle pilote la position, les pentes, les splits et le ghost. Le chrono ne se met pas en pause."
                      : "Sans distance Bluetooth, le profil avance sur le scénario temporel. Tu pourras saisir le chrono réel du vélo à l’arrivée."}</p>
                  </div>
                )}
                <ReaderViewChoice preferences={preferences} onChange={updatePreference} />
                <SessionComfort preferences={preferences} onChange={updatePreference} />
                <details className="segmentPlanDisclosure" open={!scenicSession}>
                  <summary>Voir les {active.segments.length} segments et les niveaux</summary>
                  <div className="segmentPlan">
                  {active.segments.map((segment, index) => (
                    <button key={index} type="button" disabled={Boolean(activeVoyage)} onClick={() => goToSegment(index)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{segment.label}</strong><small>{activeVoyage ? segment.minutes.toFixed(1) : segment.minutes} min · niveau {adjustedResistance(segment.resistance, preferences.resistanceOffset + sessionResistanceDelta)} · RPE {segment.rpe}</small></div>
                    </button>
                  ))}
                  </div>
                </details>
                <div className="previewFooter">
                  <span>{screenWakeLabel(screenWake.status, preferences.keepScreenAwake)} · {preferences.voiceCues ? "voix activée" : preferences.soundCues ? "bips activés" : "silencieux"}{sessionResistanceDelta ? ` · coach ${sessionResistanceDelta > 0 ? "+" : ""}${sessionResistanceDelta}` : ""}</span>
                  <button className="primary bigStart" onClick={beginSession}>{(routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb ? "Lancer le chrono" : "Démarrer la séance"}</button>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">{activeVoyage ? "VOYAGE · PORTION" : activeClimb ? routeCategory(activeClimb) === "scenic" ? "BALADE · RYTHME DOUX" : routeCategory(activeClimb) === "stage" ? "ÉTAPE" : "COL DE LÉGENDE" : active.name.toUpperCase()}</p>
                <ReaderViewChoice preferences={preferences} onChange={updatePreference} />
                <div className="sessionScreenStatus"><span role="status">{sessionStarted && !running && preferences.keepScreenAwake ? "Maintien de l’écran en pause" : screenWakeLabel(screenWake.status, preferences.keepScreenAwake)}</span>{preferences.keepScreenAwake && ["refused", "released"].includes(screenWake.status) && <button type="button" className="secondary miniButton" onClick={screenWake.retry}>Réessayer le maintien</button>}</div>
                {foregroundNotice && <div className="foregroundNotice" role="status"><p>De retour dans VéloQuest. Vérifie la consigne actuelle et la connexion du vélo : les alertes peuvent avoir été interrompues en arrière-plan.</p><button type="button" className="secondary miniButton" onClick={() => setForegroundNotice(false)}>Compris</button></div>}
                <h2>{active.segments[segmentIndex].label}</h2>

                {activeClimb && (
                  <>
                    <div className="climbLiveTitle"><strong>{activeClimb.name}</strong><span>{routeMode === "segmentAttack" ? `${raceCurrentKm.toFixed(1)} / ${raceDistanceKm.toFixed(1)} km` : `${currentRouteKm.toFixed(1)} / ${activeClimb.distanceKm.toFixed(1)} km`}</span></div>
                    {activeVoyage && <p className="voyageNext">Voyage · position simulée · portion {activeVoyage.startKm.toFixed(2)} → {activeVoyage.endKm.toFixed(2)} km</p>}
                    {(routeMode === "timeAttack" || routeMode === "segmentAttack") && (
                      <div className="timeAttackHud">
                        <span><small>CHRONO</small><strong>{formatRaceTime(timeAttackElapsedSeconds)}</strong></span>
                        <span className={ghostDelta === undefined ? "" : ghostDelta <= 0 ? "ahead" : "behind"}><small>VS PB</small><strong>{ghostDelta === undefined ? "—" : `${ghostDelta > 0 ? "+" : "−"}${formatRaceTime(Math.abs(ghostDelta))}`}</strong></span>
                        <span><small>PB</small><strong>{activeRaceBest?.metrics?.elapsedSeconds !== undefined ? formatRaceTime(activeRaceBest.metrics.elapsedSeconds) : "—"}</strong></span>
                      </div>
                    )}
                    {preferences.readerView !== "essential" && <ClimbProfile climb={activeClimb} progress={climbProgress} ghostProgress={ghostProgress} />}
                    {preferences.readerView !== "essential" && <RouteMap climb={activeClimb} progress={climbProgress} ghostProgress={ghostProgress} />}
                    <RoutePlaces route={activeClimb} currentKm={currentRouteKm} />
                    {preferences.readerView !== "essential" && activeClimb.scenery && routeMode === "training" && <details className="sceneryDetails"><summary>Ton carnet de paysage</summary><p>{activeClimb.scenery}</p><div className="routeTags">{activeClimb.highlights?.map((highlight) => <span key={highlight}>{highlight}</span>)}</div><small>Pauses libres. La progression affichée reste virtuelle sans distance FTMS.</small></details>}
                    {preferences.readerView !== "essential" && routeMode === "timeAttack" && (
                      <div className="checkpointStrip">
                        {routeCheckpoints.map((km, index) => {
                          const split = timeAttackSplits.find((item) => item.km === km);
                          return <span key={km} className={split ? "passed" : ""}><small>{index < 3 ? `${(index + 1) * 25}%` : "ARRIVÉE"}</small><strong>{split ? formatRaceTime(split.elapsedSeconds) : `${km.toFixed(1)} km`}</strong></span>;
                        })}
                      </div>
                    )}
                  </>
                )}

                {calorieMode && <div className="calorieLive" role="status"><strong>{calorieAttempt?.kcal === undefined ? "—" : calorieAttempt.kcal.toFixed(0)} kcal</strong><span>Sur cette épreuve · estimation du vélo</span><small>{caloriePrevious ? `Record comparable : ${caloriePrevious.metrics!.calorieChallenge!.kcal.toFixed(0)} kcal` : "Premier record à établir"}</small><p>Chrono continu · cadence et résistance libres</p></div>}
                {!calorieMode && <EffortProfile workout={active} elapsed={sessionElapsedSeconds} offset={preferences.resistanceOffset + sessionResistanceDelta} />}
                <div className="sessionEssentials"><div className="resistance">
                  <small>RÉSISTANCE CIBLE</small>
                  <strong>{currentTarget ?? "Libre"}</strong>
                  <span>{resistanceDirection} · plage {adjustedResistance(active.segments[segmentIndex].resistance, preferences.resistanceOffset + sessionResistanceDelta)}</span>
                </div>
                <div className="timer" aria-live="off"><small>RESTE DANS CE SEGMENT</small>{" "}<strong>{formatClock(secondsLeft)}</strong></div></div>
                <div className="actualResistance"><span>Résistance reçue du vélo</span><strong>{bike ? telemetry.resistance?.toFixed(0) ?? "—" : "—"}</strong><small>{autoResistanceControl && controlGranted ? "Pilotage auto · réponse du vélo différée" : "Réglage manuel · suis la cible"}</small></div>
                <VoiceCommands onCommand={command => {
                  if (command === "lighter" || command === "harder") {
                    const delta = command === "lighter" ? -1 : 1;
                    const changed = changeEffort(delta);
                    return !changed ? "Limite de réglage atteinte." : `${delta < 0 ? "Cible allégée" : "Cible renforcée"} d’un niveau.${autoResistanceControl && controlGranted ? " Pilotage automatique actif." : " À régler sur le vélo en mode manuel."}`;
                  }
                  if (calorieMode || routeMode === "timeAttack" || routeMode === "segmentAttack") return "Le chrono de cette épreuve ne peut pas être mis en pause.";
                  if ((command === "pause" && running) || (command === "resume" && !running)) togglePause();
                  return command === "pause" ? "Séance en pause." : "Séance reprise.";
                }} />
                <div className="effortAdjustments" role="group" aria-label="Adapter l’effort">
                  <button type="button" className="secondary" disabled={calorieMode ? (calorieLevel ?? telemetry.resistance ?? 1) <= 1 : sessionResistanceDelta <= -4} onClick={() => changeEffort(-1)}>Alléger −1</button>
                  <button type="button" className="secondary" disabled={calorieMode ? (calorieLevel ?? telemetry.resistance ?? 1) >= 32 : sessionResistanceDelta >= 4} onClick={() => changeEffort(1)}>Renforcer +1</button>
                </div>
                {bike && !autoResistanceControl && <p className="finePrint">Résistance manuelle : {bluetoothError ?? "pilotage automatique non activé pour cette connexion."}{resistanceMappingVerified && <button type="button" className="secondary" disabled={controlBusy} onClick={() => controlGranted ? setAutoResistanceControl(true) : void requestBikeControl()}>Activer le pilotage automatique</button>}</p>}
                {!calorieMode && cadenceLive.percent !== undefined && <p className="liveCadenceScore">Suivi cadence : {cadenceLive.percent.toFixed(1)} % · {cadenceLive.grade} · combo {Math.floor(cadenceScore.comboSeconds)} s ×{Math.min(4, 1 + Math.floor(cadenceScore.comboSeconds / 10))} · {Math.floor(cadenceScore.points)} pts</p>}
                <div className="sessionOverall">
                  <div><span>Segment {segmentIndex + 1}/{active.segments.length}</span><strong>{sessionProgressPercent}%</strong></div>
                  <i><b style={{ width: `${sessionProgressPercent}%` }} /></i>
                  {autoResistanceControl && controlGranted && <small>AUTO LEVEL ACTIF</small>}
                </div>
                {!calorieMode && <div className="segmentMeta"><span>Effort visé {active.segments[segmentIndex].rpe}/10</span>{active.segments[segmentIndex].cadence && <span>Cible {active.segments[segmentIndex].cadence} tr/min</span>}</div>}
                {activeClimb && preferences.showRoutePhotos && preferences.readerView !== "essential" && <RoutePhotos key={activeClimb.id} route={activeClimb} currentKm={currentRouteKm} />}
                {bike && (
                  <div className="liveStrip">
                    <span><small>RPM</small><strong>{telemetry.cadenceRpm?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>W</small><strong>{telemetry.powerW?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>KM/H</small><strong>{telemetry.speedKmh?.toFixed(1) ?? "—"}</strong></span>
                    <span><small>BPM</small><strong>{telemetry.heartRate?.toFixed(0) ?? "—"}</strong></span>
                  </div>
                )}
                {active.segments[segmentIndex + 1] && (
                  <div className="nextSegment"><small>ENSUITE</small><strong>{active.segments[segmentIndex + 1].label}</strong><span>niveau {adjustedResistance(active.segments[segmentIndex + 1].resistance, preferences.resistanceOffset + sessionResistanceDelta)}</span></div>
                )}
                {active.segments.length <= 30 && <div className="segmentProgress">{active.segments.map((_, i) => <i key={i} className={i <= segmentIndex ? "done" : ""} />)}</div>}
                <SessionComfort preferences={preferences} onChange={updatePreference} />
                <div className="readerControls"><div className="modalActions three">
                  <button className="secondary" disabled={Boolean(activeVoyage) || segmentIndex === 0} onClick={() => goToSegment(segmentIndex - 1)}>← Précédent</button>
                  {calorieMode || ((routeMode === "timeAttack" || routeMode === "segmentAttack") && activeClimb)
                    ? <button className="primary" disabled>Chrono actif</button>
                    : <button className="primary" onClick={togglePause}>{running ? "Pause" : "Reprendre"}</button>}
                  <button className="secondary" disabled={Boolean(activeVoyage) || segmentIndex >= active.segments.length - 1} onClick={() => goToSegment(segmentIndex + 1)}>Suivant →</button>
                </div>
                <button className="finish" onClick={() => { if (calorieTracker.current) calorieTracker.current = { ...calorieTracker.current, end: Math.min(calorieTracker.current.end, Date.now()) }; setRunning(false); setShowFinish(true); }}>Terminer et enregistrer</button>
                </div>
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
            {selectedSession.metrics?.voyage && <p className="voyageNext">Voyage · {selectedSession.metrics.voyage.startKm.toFixed(2)} → {selectedSession.metrics.voyage.endKm.toFixed(2)} km · {selectedSession.metrics.voyage.completedPortion ? "portion achevée" : "portion inachevée"} · position simulée. Cette séance seule ne valide pas un parcours entier.</p>}
            <SessionDebrief state={state} workouts={workouts} sessionId={selectedSession.id} />
            <p className="detailDate">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(selectedSession.date))}</p>
            {selectedSession.metrics?.calorieChallenge && <CalorieResult result={selectedSession.metrics.calorieChallenge} previous={bestCalorieAttempt(state.sessions.filter(s => s.date < selectedSession.date), selectedSession.templateId, selectedSession.metrics.calorieChallenge.source, selectedSession.metrics.calorieChallenge.deviceName)?.metrics?.calorieChallenge} />}
            {!isCalorieWorkout(selectedSession.templateId) && <CadenceResult score={selectedSession.metrics?.cadenceScore} />}
            <CoachComparison score={selectedSession.metrics?.cadenceScore} previous={bestCadenceAttempt(state.sessions.filter(session => session.date < selectedSession.date), selectedSession.metrics?.cadenceSettingsKey)?.metrics?.cadenceScore} eligible={Boolean(selectedSession.metrics?.cadenceRecordEligible)} />
            <div className="detailMetrics">
              <DetailMetric label={selectedSession.metrics?.segmentAttackIndex !== undefined ? `Segment Attack S${selectedSession.metrics.segmentAttackIndex + 1}` : selectedSession.metrics?.timeAttack ? "Time Attack" : "Durée"} value={selectedSession.metrics?.elapsedSeconds !== undefined ? formatRaceTime(selectedSession.metrics.elapsedSeconds) : `${selectedSession.duration.toFixed(1)} min`} />
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
            {selectedRoute && selectedSession.metrics?.timeAttack && (
              <SectorAnalysis
                session={selectedSession}
                route={selectedRoute}
                reference={personalBest(state.sessions, selectedRoute.id)}
              />
            )}
            {selectedSession.metrics?.challenge && (
              <div className={selectedSession.metrics.challenge.success ? "challengeResult success" : "challengeResult failure"}>
                <span>{selectedSession.metrics.challenge.success ? "✓" : "×"}</span>
                <div><small>DÉFI</small><strong>{selectedSession.metrics.challenge.success ? "Réussi" : "Manqué"}</strong><p>{selectedSession.metrics.challenge.summary}</p></div>
                <em>{selectedSession.metrics.challenge.success ? `+${selectedSession.metrics.challenge.xpBonus} XP` : "0 XP"}</em>
              </div>
            )}
            {selectedSession.metrics?.timeAttack && selectedSession.metrics.checkpointSplits?.length ? (
              <div className="detailSplits">{selectedSession.metrics.checkpointSplits.map((split) => <span key={split.km}><small>{split.km.toFixed(1)} km</small><strong>{formatRaceTime(split.elapsedSeconds)}</strong></span>)}</div>
            ) : null}
            <button className="secondary dangerButton fullWidth" onClick={() => deleteSession(selectedSession.id)}>Supprimer cette séance</button>
            {selectedSession.note && <div className="sessionNote"><small>NOTE</small><p>{selectedSession.note}</p></div>}
            {selectedSession.metrics?.samples?.length ? <p className="finePrint">{selectedSession.metrics.samples.length} points de télémétrie compactés sont conservés avec cette séance.</p> : null}
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      {showSetup && (
        <div className="modalBackdrop">
          <form action={saveProfile} className="sessionModal setupModal">
            <button type="button" className="close" aria-label="Fermer le profil" onClick={() => setShowSetup(false)}>×</button>
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
      {hydrated && state.guidance?.status === "setup" && !active && <OnboardingWizard
        guide={state.guidance} profile={state.profile} preferences={preferences} firstWorkout={firstGuidedWorkout(workouts)}
        hasInterruptedSession={Boolean(resumeSnapshot)}
        onChange={(guide) => setState((previous) => ({ ...previous, guidance: guide }))}
        onProfile={(profile) => setState((previous) => ({ ...previous, profile }))}
        onPreferences={(prefs) => setState((previous) => ({ ...previous, preferences: prefs }))}
        onFinish={finishGuidance} onSkip={leaveGuidance} onImport={importData} />}
    </main>
  );
}

function MissionItem({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  const done = value >= target;
  return <div className={done ? "missionItem done" : "missionItem"}><span>{done ? "✓" : "•"}</span><div><strong>{label}</strong><small>{quantity(value)}{suffix} / {target}{suffix}</small></div></div>;
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return <span><small>{label}</small><strong>{value}</strong></span>;
}

function ConsoleMetric({ label, value }: { label: string; value: string }) {
  return <div className="consoleMetric"><small>{label}</small><strong>{value}</strong></div>;
}

function Stat({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  return <article className="card stat"><span>{label}</span><strong>{quantity(value)}{suffix}</strong><small>objectif {target}{suffix}</small><div className="bar"><i style={{ width: `${pct(value, target)}%` }} /></div></article>;
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
