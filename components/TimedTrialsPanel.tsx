"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bestTrial, declareTrial, sampleTrial, startTrial, stopTrial, tickTrial, timedTrials, trialSession, trialValue, TRIAL_SNAPSHOT_KEY, type Trial, type TrialResult, type TrialRun } from "@/lib/timed-trials";
import type { CompletedSession } from "@/lib/types";
import { safeLocalStorageWrite } from "@/lib/storage";
import { screenWakeLabel, useScreenWakeLock } from "./useScreenWakeLock";
import { useSessionDialog } from "./useSessionDialog";
import type { BikeLiveMetrics } from "@/lib/bike-live-metrics";
import { TrialLiveMetrics } from "./TrialLiveMetrics";

export function TrialSummary({ result }: { result: TrialResult }) {
  const average = result.elapsedSeconds > 0 && Number.isFinite(result.elapsedSeconds) && result.distanceM >= 0 && Number.isFinite(result.distanceM) ? result.distanceM * 3.6 / result.elapsedSeconds : undefined;
  return <section className="cadenceResult" aria-label="Résultat du défi chrono"><strong>{trialValue(result)} · {result.source === "ftms" ? `Mesuré · ${result.deviceName}` : "Déclaré"}</strong><p>{result.eligible ? "Performance admissible au record de cette épreuve." : result.reason ?? "Hors record : épreuve incomplète."}</p><p>{(result.distanceM / 1000).toFixed(3)} km · {result.elapsedSeconds.toFixed(1)} s.{average !== undefined && ` Vitesse moyenne calculée : ${average.toFixed(1).replace(".", ",")} km/h.`} Résistance libre ; comparaison sur le même vélo, sans équivalence de puissance entre appareils.</p></section>;
}

type Props = {
  sessions: CompletedSession[]; deviceName?: string; connected: boolean;
  reading?: { distanceM: number; at: number }; connect: () => void;
  liveMetrics: BikeLiveMetrics;
  onBusy: (busy: boolean) => void; onSave: (session: CompletedSession) => boolean;
  disabled: boolean; locked: () => boolean; keepScreenAwake: boolean; bikeError: string | null; connecting: boolean;
};
export function TimedTrialsPanel({ sessions, deviceName, connected, reading, liveMetrics, connect, onBusy, onSave, disabled, locked, keepScreenAwake, bikeError, connecting }: Props) {
  const [selected, setSelected] = useState<Trial>();
  const [source, setSource] = useState<"ftms" | "manual">("manual");
  const [run, setRun] = useState<TrialRun>();
  const [now, setNow] = useState(0);
  const [distance, setDistance] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState("");
  const [snapshotError, setSnapshotError] = useState(false);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const saved = useRef(false);
  const wake = useScreenWakeLock(Boolean(run && run.phase !== "review") && keepScreenAwake);
  useSessionDialog(dialog, Boolean(selected), run?.phase ?? "prepare");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIAL_SNAPSHOT_KEY);
      if (raw) {
        const candidate = JSON.parse(raw) as TrialRun;
        const trial = timedTrials.find(t => t.id === candidate.trialId);
        if (trial && candidate.version === 1 && typeof candidate.id === "string" && Number.isFinite(candidate.elapsedSeconds) && candidate.elapsedSeconds >= 0 && Number.isFinite(candidate.distanceM) && candidate.distanceM >= 0 && ["manual", "ftms"].includes(candidate.source)) {
          if (!sessions.some(s => s.id === candidate.id)) {
            setSelected(trial); setSource(candidate.source);
            // A reloaded timed event never silently resumes or qualifies a record.
            setRun(stopTrial(candidate, "Épreuve interrompue par une fermeture ou un rechargement : hors record."));
          } else localStorage.removeItem(TRIAL_SNAPSHOT_KEY);
        }
      }
    } catch { setSnapshotError(true); }
    setReady(true);
    // Read recovery once, after the parent has hydrated its history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { onBusy(Boolean(selected)); return () => onBusy(false); }, [selected, onBusy]);
  useEffect(() => {
    if (!run || run.phase === "review") return;
    const timer = window.setInterval(() => { const at = Date.now(); setNow(at); setRun(value => value ? tickTrial(value, at) : value); }, 100);
    return () => window.clearInterval(timer);
  }, [Boolean(run), run?.phase]);
  useEffect(() => {
    if (!reading) return;
    setRun(value => value ? sampleTrial(value, reading.distanceM, reading.at) : value);
  }, [reading]);
  useEffect(() => {
    if (!connected) setRun(value => value?.source === "ftms" && value.phase !== "review" ? stopTrial(value, "Vélo déconnecté : hors record.") : value);
  }, [connected]);
  const second = Math.floor(run?.elapsedSeconds ?? 0);
  const latestRun = useRef(run); latestRun.current = run;
  useEffect(() => {
    if (latestRun.current && ready) setSnapshotError(!safeLocalStorageWrite(TRIAL_SNAPSHOT_KEY, latestRun.current));
  }, [run?.phase, second, ready]);
  const records = useMemo(() => timedTrials.map(t => ({
    measured: connected ? bestTrial(sessions, t.id, "ftms", deviceName) : undefined,
    declared: bestTrial(sessions, t.id, "manual")
  })), [sessions, connected, deviceName]);
  const trial = selected;
  const result = run && (run.source === "manual" ? declareTrial(run, selected?.kind === "distance" ? selected.target : Number(distance.replace(",", ".")) * 1000) : run);
  const previous = trial && bestTrial(sessions, trial.id, source, source === "ftms" ? deviceName : undefined);
  const newRecord = result?.eligible && (!previous || (trial?.kind === "time" ? result.distanceM > previous.distanceM : result.elapsedSeconds < previous.elapsedSeconds));
  function close() {
    try { localStorage.removeItem(TRIAL_SNAPSHOT_KEY); } catch { if (!saved.current) { setError("Impossible de supprimer la reprise. Garde cette fenêtre ouverte et réessaie."); return; } }
    setSelected(undefined); setRun(undefined); setError(""); setReviewed(false); saved.current = false;
  }
  function save() {
    if (!run || !result || !reviewed || saved.current) return;
    if (run.source === "manual" && selected?.kind === "time" && (!Number.isFinite(Number(distance)) || Number(distance) <= 0)) { setError("Renseigne une distance supérieure à zéro, lue sur ta console."); return; }
    if (!onSave(trialSession(run, result))) { setError("Enregistrement refusé. Le bilan reste ouvert : libère de l’espace et réessaie."); return; }
    saved.current = true;
    close();
  }
  return <section className="card timedTrials" aria-label="Défis chrono">
    <p className="eyebrow">DÉFIS CHRONO · DÉPART LANCÉ</p><h2>Jusqu’où ? À quelle vitesse ?</h2>
    <p>Va le plus loin en temps limité, ou couvre la distance au meilleur temps. Lance-toi pendant les cinq secondes du compte à rebours : l’élan ne compte pas dans le résultat.</p>
    <div className="trialGrid">{timedTrials.map((t, index) => {
      const { measured, declared } = records[index];
      return <article className="trialCard" key={t.id}><h3>{t.name}</h3><p>{t.kind === "time" ? `Distance maximale en ${t.target / 60} min` : `${t.target / 1000} km au meilleur temps`}</p><small>Record vélo : {measured ? trialValue(measured) : "à établir"}{connected ? ` · ${deviceName}` : " · connecte ton vélo"}<br />Record déclaré : {declared ? trialValue(declared) : "à établir"}</small><button className="secondary" disabled={disabled || !ready} onClick={() => { if (locked()) return; setSelected(t); setSource(connected ? "ftms" : "manual"); setDistance(""); setError(""); setReviewed(false); }}>Préparer · {t.name}</button></article>;
    })}</div>
    <p className="finePrint">Échauffe-toi avant l’épreuve. Ces défis comptent comme séances intenses. Distance issue de la console, jamais simulée ; rythme et résistance libres. Les notes et points du coach restent réservés aux séances guidées.</p>
    {selected && createPortal(<div className="modalBackdrop trialBackdrop"><div ref={dialog} className="sessionModal trialModal" role="dialog" aria-modal="true" aria-label={selected.name} tabIndex={-1}>
      <h2>{selected.name}</h2>
      {error && <p role="alert">{error}</p>}
      {snapshotError && <p role="alert">La sauvegarde de reprise est indisponible : garde cette fenêtre ouverte.</p>}
      {bikeError && <p role="alert">{bikeError}</p>}
      {!run ? <>
        <p>Pédale pendant <strong>5, 4, 3, 2, 1</strong> pour un départ lancé. Aucun mètre de ce compte à rebours ne sera retenu.</p>
        <p>{selected.kind === "time" ? `Parcours le maximum de distance en ${selected.target / 60} minutes.` : `Parcours ${selected.target / 1000} km le plus vite possible.`} Le chrono reste continu, même si tu ralentis.</p>
        <label>Origine du résultat<select value={source} onChange={e => setSource(e.target.value as "manual" | "ftms")}><option value="manual">Console lue à la main · record déclaré</option><option value="ftms" disabled={!connected}>Vélo connecté · mesure automatique</option></select></label>
        {source === "ftms" ? <p>Au terme du compte à rebours, le premier relevé du vélo déclenche le chrono et fixe le zéro. Garde cette fenêtre visible. Une coupure ou un rechargement invalide le record. Le relevé final des épreuves minutées peut précéder le signal de deux secondes au maximum.</p> : <p>Au signal « Partez », relève le compteur de ta console. {selected.kind === "time" ? "À la fin, saisis uniquement la distance parcourue depuis ce signal." : `Clique sur « Distance atteinte » dès que tu as parcouru ${selected.target / 1000} km depuis le signal.`} Ce résultat restera explicitement déclaré.</p>}
        {!connected && <button className="secondary" disabled={connecting} onClick={connect}>{connecting ? "Connexion…" : "Connecter mon vélo"}</button>}
        {source === "ftms" && (!reading || Date.now() - reading.at > 5000) && <p role="status">Aucun compteur de distance récent. Pédale pour recevoir une mesure ou choisis le mode déclaré.</p>}
        {previous && <p>Record comparable : {trialValue(previous)}</p>}
        <div className="trialActions"><button className="primary" disabled={source === "ftms" && (!connected || !reading || Date.now() - reading.at > 5000)} onClick={() => { if (locked()) return; const at = Date.now(); setNow(at); setRun(startTrial(selected, at, source, deviceName)); }}>Lancer le compte à rebours</button><button className="secondary closeTrial close" onClick={close}>Fermer</button></div>
      </> : run.phase !== "review" ? <>
        <div className="trialLive">
        <div className="trialClock" role="status" aria-live={run.phase === "running" ? "off" : "polite"}><strong>{run.phase === "countdown" ? Math.max(1, Math.ceil((run.countdownEnd - now) / 1000)) : run.phase === "armed" ? "Prêt…" : run.elapsedSeconds < 1 ? "Partez !" : `${run.elapsedSeconds.toFixed(1)} s`}</strong><span>{run.phase === "countdown" ? "Prends ton élan · distance non comptée" : run.phase === "armed" ? "En attente du premier relevé de distance" : "Chrono continu · départ lancé"}</span></div>
        {run.source === "ftms" ? <TrialLiveMetrics metrics={liveMetrics} now={now} connected={connected} /> : <p className="finePrint">Lis la vitesse et la cadence sur ta console. Ce défi reste déclaré.</p>}
        </div>
        <p>{screenWakeLabel(wake.status, keepScreenAwake)}{["released", "refused"].includes(wake.status) && <button className="secondary" onClick={wake.retry}>Réessayer le maintien de l’écran</button>}</p>
        <p className="trialDistance">{run.source === "ftms" ? `${(run.distanceM / 1000).toFixed(3)} km` : "Distance à relever sur la console"}{selected.kind === "distance" ? ` / ${selected.target / 1000} km` : ` · objectif ${selected.target / 60} min`}</p>
        {run.source === "manual" && run.phase === "running" && selected.kind === "distance" && <button className="primary" onClick={() => setRun(v => v ? { ...v, elapsedSeconds: (Date.now() - v.start!) / 1000, phase: "review", completed: true } : v)}>Distance atteinte</button>}
        <button className="secondary close" onClick={() => setRun(v => v ? stopTrial(tickTrial(v, Date.now())) : v)}>Arrêter l’épreuve</button>
      </> : <>
        <h3>Bilan du défi</h3>
        {run.source === "manual" && selected.kind === "time" && <label>Distance parcourue depuis le départ (km)<input type="number" min="0" step="0.001" value={distance} onChange={e => setDistance(e.target.value)} /></label>}
        {result && <TrialSummary result={result} />}
        <p role="status">{newRecord ? previous ? "Nouveau record !" : "Premier record de cette épreuve" : "Hors record ou record précédent conservé"}{previous ? ` · précédent : ${trialValue(previous)}` : ""}</p>
        <label className="check"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> J’ai vérifié le résultat du défi.</label>
        <div className="trialActions"><button className="primary" disabled={!reviewed} onClick={save}>Enregistrer le défi</button><button className="secondary close" onClick={close}>Abandonner sans enregistrer</button></div>
      </>}
    </div></div>, document.body)}
  </section>;
}
