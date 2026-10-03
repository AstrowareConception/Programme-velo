"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, Measurement, WorkoutTemplate } from "@/lib/types";
import {
  STORAGE_KEY,
  badges,
  currentProgramWeek,
  emptyState,
  levelForXp,
  totalXp,
  weekTargets,
  weeklyStats,
  workouts
} from "@/lib/data";

type Tab = "dashboard" | "sessions" | "progress" | "badges" | "data";

function pct(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function uid() {
  return crypto.randomUUID();
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function VeloQuestApp() {
  const [state, setState] = useState<AppState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [active, setActive] = useState<WorkoutTemplate | null>(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setState(JSON.parse(raw)); } catch { /* ignore corrupted backup */ }
    } else {
      setShowSetup(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!running || !active) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds > 1) return seconds - 1;
        const next = segmentIndex + 1;
        if (next >= active.segments.length) {
          setRunning(false);
          return 0;
        }
        setSegmentIndex(next);
        return Math.round(active.segments[next].minutes * 60);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, active, segmentIndex]);

  const week = currentProgramWeek(state.profile.startDate);
  const target = weekTargets[week - 1];
  const stats = weeklyStats(state, week);
  const xp = totalXp(state);
  const level = levelForXp(xp);
  const allBadges = badges(state);
  const latestMeasurement = [...state.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];

  const recommendation = useMemo(() => {
    const recentHard = [...state.sessions]
      .filter((s) => s.intensity === "hard")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (recentHard && Date.now() - new Date(recentHard.date).getTime() < 30 * 3600 * 1000) {
      return workouts.find((w) => w.id === "endurance-45")!;
    }
    if (stats.hard < target.maxHard && stats.points < target.points) {
      return workouts.find((w) => w.id === "progressive-35")!;
    }
    return workouts.find((w) => w.id === "endurance-70")!;
  }, [state.sessions, stats.hard, stats.points, target.maxHard, target.points]);

  if (!hydrated) return null;

  function launch(workout: WorkoutTemplate) {
    setActive(workout);
    setSegmentIndex(0);
    setSecondsLeft(Math.round(workout.segments[0].minutes * 60));
    setRunning(false);
  }

  function finishActive() {
    if (!active) return;
    setState((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          id: uid(),
          templateId: active.id,
          date: new Date().toISOString(),
          duration: active.duration,
          points: active.points,
          xp: active.xp,
          intensity: active.intensity,
          kind: active.kind,
          bonus: Boolean(active.bonus)
        }
      ]
    }));
    setActive(null);
    setRunning(false);
  }

  function addMeasurement(form: FormData) {
    const m: Measurement = {
      id: uid(),
      date: new Date().toISOString(),
      weight: Number(form.get("weight")) || undefined,
      waist: Number(form.get("waist")) || undefined,
      abdomen: Number(form.get("abdomen")) || undefined
    };
    setState((prev) => ({ ...prev, measurements: [...prev.measurements, m] }));
  }

  function saveProfile(form: FormData) {
    setState((prev) => ({
      ...prev,
      profile: {
        name: String(form.get("name") || ""),
        startDate: String(form.get("startDate") || new Date().toISOString().slice(0, 10)),
        startWeight: Number(form.get("startWeight")) || undefined,
        targetWeight: Number(form.get("targetWeight")) || undefined,
        startWaist: Number(form.get("startWaist")) || undefined,
        targetWaist: Number(form.get("targetWaist")) || undefined
      }
    }));
    setShowSetup(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
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
      setState(parsed);
    } catch {
      alert("Sauvegarde invalide.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="" className="brandMark" />
          <div><strong>VeloQuest</strong><span>Ride · Level up · Repeat</span></div>
        </div>
        <div className="levelPill"><span>Niv. {level}</span><strong>{xp} XP</strong></div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">SEMAINE {week} / 12</p>
          <h1>{state.profile.name ? `${state.profile.name}, ta quête continue.` : "Ta quête continue."}</h1>
          <p>Choisis selon ton temps et ton énergie. L'application protège la variété et la récupération, pas un calendrier rigide.</p>
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

          <section className="card questCard">
            <div>
              <p className="eyebrow">QUÊTE RECOMMANDÉE</p>
              <h2>{recommendation.name}</h2>
              <p>{recommendation.tagline}</p>
              <div className="chips">
                <span>{recommendation.duration} min</span><span>{recommendation.points} pts</span><span>{recommendation.xp} XP</span>
              </div>
            </div>
            <button className="primary" onClick={() => launch(recommendation)}>Commencer</button>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">BONUS</p><h2>Une petite marge ?</h2></div><span className="spark">+20 XP</span></div>
            <p>Ajoute 15 minutes faciles. Elles comptent dans ton volume et ta régularité, mais pas dans les points principaux. Les bonus XP sont plafonnés à 60 par semaine.</p>
            <button className="secondary" onClick={() => launch(workouts.find((w) => w.id === "bonus-15")!)}>Micro bonus 15 min</button>
          </section>

          <section className="card">
            <div className="sectionHead"><div><p className="eyebrow">GARDE-FOU</p><h2>Charge intense</h2></div><strong>{stats.hard}/{target.maxHard}</strong></div>
            <p>{stats.hard > target.maxHard ? "Tu as dépassé le plafond conseillé : privilégie l'endurance ou le décrassage." : "Les séances dures rapportent beaucoup, mais une semaine parfaite respecte aussi le plafond d'intensité."}</p>
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

      {tab === "progress" && (
        <section>
          <div className="pageHead"><p className="eyebrow">PROGRESSION</p><h1>Mesures & historique</h1></div>
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
          <div className="pageHead"><p className="eyebrow">GAMIFICATION</p><h1>Badges</h1><p>Récompense la constance, la variété et la progression — pas le surentraînement.</p></div>
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
        <NavButton active={tab === "progress"} onClick={() => setTab("progress")} icon="↗" label="Progression" />
        <NavButton active={tab === "badges"} onClick={() => setTab("badges")} icon="✦" label="Badges" />
        <NavButton active={tab === "data"} onClick={() => setTab("data")} icon="☰" label="Données" />
      </nav>

      {active && (
        <div className="modalBackdrop">
          <div className="sessionModal">
            <button className="close" onClick={() => setActive(null)}>×</button>
            <p className="eyebrow">{active.name.toUpperCase()}</p>
            <h2>{active.segments[segmentIndex].label}</h2>
            <div className="resistance">
              <small>NIVEAU TEB5</small>
              <strong>{active.segments[segmentIndex].resistance}</strong>
            </div>
            <div className="timer">{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</div>
            <div className="segmentMeta"><span>RPE {active.segments[segmentIndex].rpe}</span>{active.segments[segmentIndex].cadence && <span>{active.segments[segmentIndex].cadence} tr/min</span>}</div>
            <div className="segmentProgress">{active.segments.map((_, i) => <i key={i} className={i <= segmentIndex ? "done" : ""} />)}</div>
            <div className="modalActions">
              <button className="primary" onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Démarrer"}</button>
              <button className="secondary" onClick={() => {
                const next = Math.min(active.segments.length - 1, segmentIndex + 1);
                setSegmentIndex(next);
                setSecondsLeft(Math.round(active.segments[next].minutes * 60));
              }}>Segment suivant</button>
            </div>
            <button className="finish" onClick={finishActive}>Terminer et valider la séance</button>
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

function Stat({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  return <article className="card stat"><span>{label}</span><strong>{value}{suffix}</strong><small>objectif {target}{suffix}</small><div className="bar"><i style={{ width: `${pct(value, target)}%` }} /></div></article>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
