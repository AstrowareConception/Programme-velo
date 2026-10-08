"use client";
import { useEffect, useState } from 'react';
import type { AppState, WorkoutTemplate } from '@/lib/types';
import { recentFeedback, type ProgramSettings } from '@/lib/adaptive-program';
import { cycleContext, cycleReport, type NextCycleOptions } from '@/lib/program-cycles';
import { cycleEnded, cycleGoals, programStartDate, type ClosedCycle, type CycleGoal } from '@/lib/program-calendar';
const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
type Props = { state: AppState; workouts: WorkoutTemplate[]; disabled: boolean; onBusy: (busy: boolean) => void; onSave: (options: NextCycleOptions) => string | undefined };
export function CycleReport({ state, workouts, cycle }: { state: AppState; workouts: WorkoutTemplate[]; cycle?: ClosedCycle }) {
  const report = cycleReport(state, cycle);
  const change = (n: number | undefined, unit: string) => n === undefined ? 'Deux jours de mesures nécessaires' : `${n > 0 ? '+' : ''}${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit}`;
  return <div className="cycleReport">
    <div className="reviewMetrics"><div><small>Temps à vélo</small><strong>{Math.round(report.minutes)} min</strong></div><div><small>Séances enregistrées</small><strong>{report.sessions}</strong></div><div><small>Jours actifs</small><strong>{report.activeDays}</strong></div><div><small>Semaines actives</small><strong>{report.activeWeeks}</strong></div></div>
    <p>{report.variety} types de séances · {report.reachedWeeks} objectifs hebdomadaires atteints sur 12 · ressenti moyen {report.meanRpe?.toFixed(1) ?? '—'}/10.</p>
    <details><summary>Semaines et objectifs de ce cycle</summary><ol className="cycleWeekList">{report.weekly.map(w => <li key={w.week}><strong>Semaine {w.week}</strong><span>{Math.round(w.minutes)} min · {w.sessions} séances · {w.reached ? 'Objectif atteint' : 'Objectif non atteint'}</span></li>)}</ol></details>
    <details><summary>Mesures et aisance à l’effort</summary><p>Écart entre les premiers et derniers jours mesurés de la période : poids {change(report.weightDelta, 'kg')} ; tour de taille {change(report.waistDelta, 'cm')}.</p>
      {report.comparisons.length ? <ul>{report.comparisons.map((c, i) => <li key={i}>{workouts.find(w => w.id === c.templateId)?.name ?? 'Séance'} : ressenti {c.before}/10 → {c.after}/10, aux mêmes réglages enregistrés.</li>)}</ul> : <p>Pas encore de comparaison : il faut deux séances complètes à des jours différents, aux mêmes réglages, avec un ressenti renseigné.</p>}
      <p className="finePrint">Les mesures utilisent une moyenne par jour. Le ressenti décrit ton expérience ; il ne mesure pas une évolution physiologique.</p>
    </details>
  </div>;
}
export function ProgramCyclesPanel({ state, workouts, disabled, onBusy, onSave }: Props) {
  const [draft, setDraft] = useState<{ context: string; returning: boolean }>();
  const [settings, setSettings] = useState<ProgramSettings>(state.program ?? { version: 1, days: [1, 3, 5, 0], minutes: 25, goal: 'habit', energy: 'normal' });
  const [goal, setGoal] = useState<CycleGoal>('habit');
  const [reviewed, setReviewed] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { onBusy(!!draft); return () => onBusy(false); }, [!!draft, onBusy]);
  const ended = cycleEnded(state);
  const interrupted = recentFeedback(state, workouts).returnAfterBreak;
  const number = (state.programTimeline?.history.length ?? 0) + 1;
  function prepare(returning: boolean) {
    setSettings(state.program ?? { version: 1, days: [1, 3, 5, 0], minutes: 25, goal: 'habit', energy: 'normal' });
    setGoal(state.programTimeline?.active.goal ?? state.program?.goal ?? 'habit');
    setDraft({ context: cycleContext(state), returning }); setReviewed(false); setNotice('');
  }
  return <section className="card programCycles" aria-labelledby="cycle-title">
    <p className="eyebrow">TON PROGRAMME DANS LA DURÉE</p><h2 id="cycle-title">{ended ? 'Ton cycle de douze semaines est terminé' : `Mon cycle ${number}`}</h2>
    <p>Départ le {new Date(programStartDate(state) + 'T12:00:00').toLocaleDateString('fr-FR')}{state.programTimeline ? ` · ${cycleGoals[state.programTimeline.active.goal].label}` : ''}. {ended ? 'Consulte ton bilan puis choisis la suite. Tu peux continuer à rouler librement.' : 'Des rendez-vous adaptés à tes disponibilités, sans séances à rattraper.'}</p>
    {interrupted && <p className="reviewAdvice">Tu n’as pas enregistré de séance depuis au moins dix jours. Tu peux repartir avec des premières semaines faciles.</p>}
    <details open={ended ? true : undefined}><summary>Bilan du cycle actuel</summary><CycleReport state={state} workouts={workouts} /></details>
    {!draft ? <div className="backupButtons"><button className="primary" disabled={disabled} onClick={() => prepare(false)}>Préparer un nouveau cycle</button><button className="secondary" disabled={disabled} onClick={() => prepare(true)}>Préparer une reprise après pause</button></div> : <form className="form cycleSetup" onSubmit={e => {
      e.preventDefault(); if (disabled || !reviewed || !settings.days.length) return;
      const error = onSave({ id: crypto.randomUUID(), goal, settings, returning: draft.returning, expectedContext: draft.context });
      if (error) { setNotice(error); return; }
      setDraft(undefined); setNotice('Nouveau cycle enregistré. Ton historique et les bilans précédents sont conservés. Prépare maintenant ta première semaine.');
    }}>
      <h3>{draft.returning ? 'Repartir doucement' : 'Préparer le prochain cycle'}</h3>
      <p>Le cycle actuel sera clos à la confirmation, et le suivant commencera aujourd’hui pour douze semaines. Ses objectifs et plannings seront conservés dans son bilan. Aucune séance ni mesure ne sera supprimée.</p>
      <label>Objectif du prochain cycle<select value={goal} onChange={e => { setGoal(e.target.value as CycleGoal); setReviewed(false); }}>{Object.entries(cycleGoals).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><p>{cycleGoals[goal].description}</p>
      <label>Créneau maximum du prochain cycle<select value={settings.minutes} onChange={e => { setSettings({ ...settings, minutes: Number(e.target.value) }); setReviewed(false); }}>{[10, 15, 20, 25, 30, 40, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}</select></label>
      <fieldset className="dayChoices"><legend>Jours disponibles du prochain cycle</legend>{[1, 2, 3, 4, 5, 6, 0].map(d => <label key={d}><input type="checkbox" checked={settings.days.includes(d)} onChange={e => { setSettings({ ...settings, days: e.target.checked ? [...settings.days, d] : settings.days.filter(n => n !== d) }); setReviewed(false); }} />{weekdays[d]}</label>)}</fieldset>
      <p>{settings.days.length} rendez-vous par semaine · {settings.minutes} minutes maximum par séance. Le planning ajustera les objectifs aux séances effectivement proposées. {draft.returning ? 'Les deux premières semaines restent faciles et plus courtes.' : 'Les premières semaines consolident les habitudes ; aucune hausse automatique du volume.'}</p>
      <label className="habitCheck"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />J’ai vérifié le bilan et le départ du nouveau cycle aujourd’hui.</label>
      <div className="backupButtons"><button className="primary" type="submit" disabled={disabled || !reviewed || !settings.days.length}>Confirmer le départ du cycle</button><button className="secondary" type="button" onClick={() => { setDraft(undefined); setNotice('Proposition annulée. Ton programme est conservé.'); }}>Annuler la proposition</button></div>
    </form>}
    {disabled && <p className="finePrint">Termine la séance, règle la reprise interrompue ou attends la fin de la synchronisation avant de changer de cycle.</p>}
    {notice && <p role={notice.startsWith('Nouveau cycle') || notice.startsWith('Proposition annulée') ? 'status' : 'alert'}>{notice}</p>}
    {!!state.programTimeline?.history.length && <details><summary>Mes cycles précédents ({state.programTimeline.history.length})</summary>{[...state.programTimeline.history].reverse().map((cycle, i) => <details key={cycle.id} className="closedCycle"><summary>Cycle {state.programTimeline!.history.length - i} · {cycleGoals[cycle.goal].label} · {new Date(cycle.startDate + 'T12:00:00').toLocaleDateString('fr-FR')} → {new Date(cycle.closedAt).toLocaleDateString('fr-FR')}</summary><p>{cycle.reason === 'restart' ? 'Clos pour repartir après une pause.' : 'Clos au départ du cycle suivant.'}</p><CycleReport state={state} workouts={workouts} cycle={cycle} /></details>)}</details>}
  </section>;
}
