"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Measurement, Preferences, TelemetrySample, WorkoutTemplate } from "@/lib/types";
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
  defaultPreferences
} from "@/lib/data";
import { compactTelemetry, cueSegment, formatClock, requestScreenWakeLock } from "@/lib/session";

type Tab = "dashboard" | "sessions" | "climbs" | "progress" | "more";
type Energy = "easy" | "normal" | "hard";
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
  const [bike, setBike] = useState<BikeConnection | null>(null);
  const [telemetry, setTelemetry] = useState<BikeTelemetry>({});
  const [telemetrySamples, setTelemetrySamples] = useState<TelemetrySample[]>([]);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [connectingBike, setConnectingBike] = useState(false);
  const [climbStartDistanceM, setClimbStartDistanceM] = useState<number | null>(null);
  const [customClimbs, setCustomClimbs] = useState<ClimbChallenge[]>([]);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const lastSampleAt = useRef(0);
  const segmentDeadlineRef = useRef(0);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setState({ ...parsed, preferences: { ...defaultPreferences, ...(parsed.preferences ?? {}) } });
      } catch { /* ignore corrupted backup */ }
    } else {
      setShowSetup(true);
    }
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
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(customClimbs));
  }, [customClimbs, hydrated]);

  useEffect(() => {
    if (!running || !active || !sessionStarted) return;
    segmentDeadlineRef.current = Date.now() + secondsLeft * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((segmentDeadlineRef.current - Date.now()) / 1000));
      if (remaining > 0) {
        setSecondsLeft(remaining);
        return;
      }

      const next = segmentIndex + 1;
      if (next >= active.segments.length) {
        setSecondsLeft(0);
        setRunning(false);
        setShowFinish(true);
        setToast("Séance terminée — enregistre ta performance.");
        return;
      }

      setSegmentIndex(next);
      const nextSeconds = Math.round(active.segments[next].minutes * 60);
      setSecondsLeft(nextSeconds);
      segmentDeadlineRef.current = Date.now() + nextSeconds * 1000;
      cueSegment(active.segments[next], { ...defaultPreferences, ...(state.preferences ?? {}) });
    }, 250);

    return () => window.clearInterval(timer);
  }, [running, active, segmentIndex, sessionStarted]);

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
  const allBadges = badges(state);
  const sortedMeasurements = [...state.measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latestMeasurement = sortedMeasurements.at(-1);
  const allClimbs = useMemo(() => [...climbs, ...customClimbs], [customClimbs]);
  const currentStreak = streak(state);
  const perfectWeek = isPerfectWeek(state, week);
  const totalDistance = state.sessions.reduce((sum, session) => sum + (session.metrics?.distanceKm ?? 0), 0);
  const weightLost = state.profile.startWeight && latestMeasurement?.weight !== undefined ? state.profile.startWeight - latestMeasurement.weight : 0;
  const waistLost = state.profile.startWaist && latestMeasurement?.waist !== undefined ? state.profile.startWaist - latestMeasurement.waist : 0;
  const weightPoints = sortedMeasurements.filter((m) => m.weight !== undefined).map((m) => ({ label: dateLabel(m.date), value: m.weight! }));
  const waistPoints = sortedMeasurements.filter((m) => m.waist !== undefined).map((m) => ({ label: dateLabel(m.date), value: m.waist! }));

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

  const climbProgress = useMemo(() => {
    if (!activeClimb || !active) return 0;
    if (bike && telemetry.distanceM !== undefined && climbStartDistanceM !== null) {
      return Math.max(0, Math.min(1, (telemetry.distanceM - climbStartDistanceM) / (activeClimb.distanceKm * 1000)));
    }
    const segmentFraction = active.segments.length ? segmentIndex / active.segments.length : 0;
    return Math.max(0, Math.min(1, segmentFraction));
  }, [activeClimb, active, bike, telemetry.distanceM, climbStartDistanceM, segmentIndex]);

  if (!hydrated) return null;

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
        }
      );
      setBike(connection);
      const range = connection.capabilities.resistanceRange;
      setToast(range ? `${connection.deviceName} connecté · résistance ${range.min}–${range.max}` : `${connection.deviceName} connecté`);
    } catch (error) {
      setBluetoothError(error instanceof Error ? error.message : "Connexion Bluetooth impossible.");
    } finally {
      setConnectingBike(false);
    }
  }

  function launch(workout: WorkoutTemplate, climb: ClimbChallenge | null = null) {
    setActive(workout);
    setActiveClimb(climb);
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
    const duration = n(form, "duration") ?? active.duration;

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
          xp: active.xp,
          intensity: active.intensity,
          kind: active.kind,
          bonus: Boolean(active.bonus),
          rpe: n(form, "rpe"),
          note: String(form.get("note") ?? "").trim() || undefined,
          metrics: {
            source: hasFtms && manualUsed ? "mixed" : hasFtms ? "ftms" : "manual",
            distanceKm: n(form, "distance") ?? autoMetrics.distanceKm,
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
    setToast(`Quête validée · +${active.xp} XP`);
  }

  function beginSession() {
    if (!active) return;
    setSessionStarted(true);
    setRunning(true);
    const seconds = Math.round(active.segments[segmentIndex].minutes * 60);
    setSecondsLeft(seconds);
    segmentDeadlineRef.current = Date.now() + seconds * 1000;
    cueSegment(active.segments[segmentIndex], preferences);
  }

  function togglePause() {
    if (!active || !sessionStarted) return;
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

  function updatePreference(key: keyof Preferences, value: boolean) {
    setState((prev) => ({
      ...prev,
      preferences: { ...defaultPreferences, ...(prev.preferences ?? {}), [key]: value }
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
    const backup = { format: "veloquest-backup-v2", state, customClimbs };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veloquest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.format === "veloquest-backup-v2" && parsed.state) {
        setState(parsed.state);
        setCustomClimbs(Array.isArray(parsed.customClimbs) ? parsed.customClimbs : []);
      } else {
        setState(parsed);
      }
    } catch {
      alert("Sauvegarde invalide.");
    }
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
          <img src="/logo.svg" alt="" className="brandMark" />
          <div><strong>VeloQuest</strong><span>Ride · Level up · Repeat</span></div>
        </div>
        <div className="topActions">
          <button className={`bikePill ${bike ? "connected" : ""}`} onClick={bike ? () => { bike.disconnect(); setBike(null); setTelemetry({}); } : connectBike}>
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
        </div>
        <div className="heroRune"><span>{level}</span><small>NIVEAU</small></div>
      </section>

      {tab === "dashboard" && (
        <>
          <section className="grid statsGrid">
            <Stat label="Points" value={stats.points} target={target.points} suffix=" pts" />
            <Stat label="Minutes" value={stats.minutes} target={target.minutes} suffix=" min" />
            <Stat label="Séances" value={stats.sessions} target={target.sessions} />
            <Stat label="Variété" value={stats.variety} target={target.variety} />
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
            {!bike && <button className="secondary" onClick={connectBike} disabled={connectingBike}>{connectingBike ? "Recherche du vélo…" : "Connecter le vélo"}</button>}
            {bluetoothError && <p className="errorText">{bluetoothError}</p>}
          </section>

          <section className="card questCard">
            <div>
              <p className="eyebrow">QUÊTE RECOMMANDÉE</p>
              <h2>{recommendation.name}</h2>
              <p>{recommendation.tagline}</p>
              <div className="chips"><span>{recommendation.duration} min</span><span>{recommendation.points} pts</span><span>{recommendation.xp} XP</span></div>
            </div>
            <button className="primary" onClick={() => launch(recommendation)}>Commencer</button>
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
          <div className="pageHead"><p className="eyebrow">CATALOGUE</p><h1>Choisis ta quête</h1><p>Du décrassage au HIIT. Le ressenti reste prioritaire sur le numéro de résistance.</p></div>
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
                <div className="climbActions">
                  <button className="primary" onClick={() => launch(climbToWorkout(climb), climb)}>Lancer le parcours</button>
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
                <label>Poids (kg)<input name="weight" type="number" step="0.1" placeholder={latestMeasurement?.weight?.toString() || "ex. 118.4"} /></label>
                <label>Tour de taille (cm)<input name="waist" type="number" step="0.1" placeholder={latestMeasurement?.waist?.toString() || "ex. 112"} /></label>
                <label>Tour abdominal (cm)<input name="abdomen" type="number" step="0.1" placeholder={latestMeasurement?.abdomen?.toString() || "ex. 116"} /></label>
                <button className="primary" type="submit">Enregistrer</button>
              </form>
            </section>
            <section className="card">
              <h2>Objectifs</h2>
              <div className="metricBig"><span>Poids</span><strong>{latestMeasurement?.weight ?? state.profile.startWeight ?? "—"} kg</strong><small>objectif {state.profile.targetWeight ?? "—"} kg</small></div>
              <div className="metricBig"><span>Tour de taille</span><strong>{latestMeasurement?.waist ?? state.profile.startWaist ?? "—"} cm</strong><small>objectif {state.profile.targetWaist ?? "—"} cm</small></div>
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
                  <div key={session.id}>
                    <span>{dateLabel(session.date)}</span>
                    <div><strong>{route?.name ?? template?.name ?? session.templateId}</strong><small>{session.duration} min · {session.metrics?.source ?? "manuel"}</small></div>
                    <div className="historyMetrics">
                      {session.metrics?.distanceKm !== undefined && <span>{session.metrics.distanceKm.toFixed(1)} km</span>}
                      {session.metrics?.avgPowerW !== undefined && <span>{session.metrics.avgPowerW.toFixed(0)} W</span>}
                      {session.metrics?.avgHeartRate !== undefined && <span>{session.metrics.avgHeartRate.toFixed(0)} bpm</span>}
                      {session.rpe !== undefined && <span>RPE {session.rpe}</span>}
                    </div>
                  </div>
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

      {tab === "badges" && (
        <section>
          <div className="pageHead"><p className="eyebrow">GAMIFICATION</p><h1>Badges</h1><p>La constance, la variété et la progression rapportent plus que le surentraînement.</p></div>
          <div className="grid badgeGrid">
            {allBadges.map((b) => (
              <article className={`card badge ${b.unlocked ? "unlocked" : ""}`} key={b.id}>
                <span className="badgeIcon">{b.icon}</span><div><h2>{b.name}</h2><p>{b.description}</p><small>{b.unlocked ? "Débloqué" : b.progress}</small></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "data" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PARAMÈTRES</p><h1>Données locales</h1><p>Aucun compte, aucun serveur : ta progression reste dans ce navigateur.</p></div>
          <section className="card actionStack">
            <button className="secondary" onClick={() => setShowSetup(true)}>Modifier le profil et les objectifs</button>
            <button className="secondary" onClick={exportData}>Exporter une sauvegarde JSON</button>
            <label className="secondary fileButton">Importer une sauvegarde<input type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} /></label>
          </section>
        </section>
      )}

      <nav className="bottomNav">
        <NavButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon="⌂" label="Quête" />
        <NavButton active={tab === "sessions"} onClick={() => setTab("sessions")} icon="⚡" label="Séances" />
        <NavButton active={tab === "climbs"} onClick={() => setTab("climbs")} icon="▲" label="Cols" />
        <NavButton active={tab === "progress"} onClick={() => setTab("progress")} icon="↗" label="Suivi" />
        <NavButton active={tab === "badges"} onClick={() => setTab("badges")} icon="✦" label="Badges" />
        <NavButton active={tab === "data"} onClick={() => setTab("data")} icon="☰" label="Données" />
      </nav>

      {active && (
        <div className="modalBackdrop">
          <div className={`sessionModal ${activeClimb ? "climbSession" : ""}`}>
            <button className="close" onClick={() => { setActive(null); setActiveClimb(null); setRunning(false); }}>×</button>

            {showFinish ? (
              <form action={finishActive} className="finishForm">
                <p className="eyebrow">JOURNAL DE SÉANCE</p>
                <h2>Enregistre ta performance</h2>
                {telemetrySamples.length > 0 && <p className="connectedNotice">✓ {telemetrySamples.length} échantillons FTMS récupérés. Les champs connus sont préremplis.</p>}
                <div className="form">
                  <div className="formRow">
                    <label>Durée (min)<input name="duration" type="number" step="1" defaultValue={active.duration} /></label>
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
            ) : (
              <>
                <p className="eyebrow">{activeClimb ? "COL DE LÉGENDE" : active.name.toUpperCase()}</p>
                <h2>{active.segments[segmentIndex].label}</h2>

                {activeClimb && (
                  <>
                    <div className="climbLiveTitle"><strong>{activeClimb.name}</strong><span>{(climbProgress * activeClimb.distanceKm).toFixed(1)} / {activeClimb.distanceKm.toFixed(1)} km</span></div>
                    <ClimbProfile climb={activeClimb} progress={climbProgress} />
                    <RouteMap climb={activeClimb} progress={climbProgress} />
                  </>
                )}

                <div className="resistance">
                  <small>NIVEAU TEB5</small>
                  <strong>{active.segments[segmentIndex].resistance}</strong>
                </div>
                <div className="timer">{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</div>
                <div className="segmentMeta"><span>RPE {active.segments[segmentIndex].rpe}</span>{active.segments[segmentIndex].cadence && <span>Cible {active.segments[segmentIndex].cadence} tr/min</span>}</div>
                {bike && (
                  <div className="liveStrip">
                    <span><small>RPM</small><strong>{telemetry.cadenceRpm?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>W</small><strong>{telemetry.powerW?.toFixed(0) ?? "—"}</strong></span>
                    <span><small>KM/H</small><strong>{telemetry.speedKmh?.toFixed(1) ?? "—"}</strong></span>
                    <span><small>BPM</small><strong>{telemetry.heartRate?.toFixed(0) ?? "—"}</strong></span>
                  </div>
                )}
                <div className="segmentProgress">{active.segments.map((_, i) => <i key={i} className={i <= segmentIndex ? "done" : ""} />)}</div>
                <div className="modalActions">
                  <button className="primary" onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Démarrer"}</button>
                  <button className="secondary" onClick={() => {
                    const next = Math.min(active.segments.length - 1, segmentIndex + 1);
                    setSegmentIndex(next);
                    setSecondsLeft(Math.round(active.segments[next].minutes * 60));
                  }}>Segment suivant</button>
                </div>
                <button className="finish" onClick={() => { setRunning(false); setShowFinish(true); }}>Terminer et enregistrer</button>
              </>
            )}
          </div>
        </div>
      )}

      {showSetup && (
        <div className="modalBackdrop">
          <form action={saveProfile} className="sessionModal setupModal">
            <img src="/logo.svg" alt="" className="setupLogo" />
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

function ConsoleMetric({ label, value }: { label: string; value: string }) {
  return <div className="consoleMetric"><small>{label}</small><strong>{value}</strong></div>;
}

function Stat({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  return <article className="card stat"><span>{label}</span><strong>{value}{suffix}</strong><small>objectif {target}{suffix}</small><div className="bar"><i style={{ width: `${pct(value, target)}%` }} /></div></article>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
