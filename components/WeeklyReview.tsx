"use client";
import { useState } from 'react';
import type { AppState, WorkoutTemplate } from '@/lib/types';
import { recentFeedback, sessionsInWeek, sessionDebrief, weightTrend, weekDates, type HabitDay } from '@/lib/adaptive-program';
import { cadenceSummary } from '@/lib/effort';
import { localInputDate } from '@/lib/dates';
import { programStartDate } from '@/lib/program-calendar';
export function WeeklyReview({state,week,workouts,onHabits}: {state:AppState;week:number;workouts:WorkoutTemplate[];onHabits:(entry:HabitDay)=>void}) {
  const [reviewWeek,setReviewWeek]=useState(week);
  const [notice,setNotice]=useState('');
  const sessions=sessionsInWeek(state,reviewWeek);
  const reports=sessions.filter(s=>typeof s.rpe==='number' && Number.isFinite(s.rpe));
  const minutes=sessions.reduce((a,s)=>a+s.duration,0);
  const target=state.weeklyGoals?.find(t=>t.week===reviewWeek);
  const score=sessions.map(s=>cadenceSummary(s.metrics?.cadenceScore)).filter(s=>!s.provisional);
  const measured=score.reduce((a,s)=>a+s.measuredSeconds,0);
  const precision=measured?100*score.reduce((a,s)=>a+s.onTargetSeconds,0)/measured:undefined;
  const feedback=recentFeedback(state,workouts);
  const trend=weightTrend(state);
  const today=localInputDate();
  const habit=state.habits?.find(h=>h.date===today);
  const dateKeys=new Set(weekDates(programStartDate(state),reviewWeek).map(d=>localInputDate(d)));
  const habits=(state.habits??[]).filter(h=>dateKeys.has(h.date) && h.date<=today);
  return <section className="card weeklyReview" aria-label="Bilan et habitudes"><p className="eyebrow">PROGRESSER DANS LA DURÉE</p><h2>Mon bilan</h2>
    <label>Semaine du bilan<select value={reviewWeek} onChange={e=>setReviewWeek(Number(e.target.value))}>{Array.from({length:week},(_,i)=>i+1).map(w=><option key={w} value={w}>Semaine {w}{w===week?' · en cours':''}</option>)}</select></label>
    <div className="reviewMetrics"><div><small>Temps à vélo</small><strong>{Math.round(minutes)} / {target?.minutes??'—'} min</strong></div><div><small>Séances réalisées</small><strong>{sessions.length}</strong></div><div><small>Ressenti moyen</small><strong>{reports.length?(reports.reduce((a,s)=>a+s.rpe!,0)/reports.length).toFixed(1):'—'} / 10</strong></div><div><small>Cadence dans la cible</small><strong>{precision===undefined?'—':precision.toFixed(0)+' %'}</strong></div></div>
    <p>{sessions.length ? 'Chaque séance contribue à ta régularité. Les moyennes de cadence excluent les séances insuffisamment mesurées.' : 'Cette semaine n’a pas encore de séance enregistrée.'}</p>
    {reviewWeek===week && <p className="reviewAdvice">{feedback.returnAfterBreak?'Une interruption est normale : prépare une reprise douce.':feedback.difficult?'Ton ressenti récent dépasse les consignes. Le planning proposera une semaine allégée.':'Si ce rythme te convient, consolide-le avant d’augmenter la difficulté.'}</p>}
    <details><summary>Poids et progrès actuels</summary><p>Moyenne sur les 7 derniers jours : <strong>{trend.current.value?.toFixed(1)??'—'} kg</strong> ({trend.current.count} jour(s) mesuré(s)).</p><p>{trend.delta===undefined?'Deux jours de mesures dans chacune des deux dernières semaines sont nécessaires pour comparer les tendances.':`Écart avec les 7 jours précédents : ${trend.delta>0?'+':''}${trend.delta.toFixed(1)} kg.`}</p><p className="finePrint">Le poids fluctue : observe plusieurs semaines avec le tour de taille et ton confort à l’effort. Les calories du vélo sont des estimations et ne prédisent pas une perte de poids. Les objectifs de poids restent facultatifs.</p><p><a href="https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity" target="_blank" rel="noreferrer">Repères : activité et alimentation dans la durée ↗</a></p></details>
    <details><summary>Mes habitudes du jour</summary><p>Un journal facultatif, sans points ni obligation quotidienne. Marche et renforcement restent séparés des minutes à vélo.</p><form className="form" key={today} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);onHabits({date:today,walk:Number(data.get('walk')),strength:Number(data.get('strength')),balancedMeal:data.get('meal')==='on',rest:data.get('rest')==='on'});setNotice('Habitudes du jour enregistrées.');}}>
      <div className="formRow"><label>Marche aujourd’hui (min)<input name="walk" type="number" min="0" max="300" step="1" required defaultValue={habit?.walk??0}/></label><label>Renforcement aujourd’hui (min)<input name="strength" type="number" min="0" max="180" step="1" required defaultValue={habit?.strength??0}/></label></div>
      <label className="habitCheck"><input name="meal" type="checkbox" defaultChecked={habit?.balancedMeal??false}/>J’ai pris le temps d’un repas équilibré</label><label className="habitCheck"><input name="rest" type="checkbox" defaultChecked={habit?.rest??false}/>J’ai respecté mon besoin de récupération</label><button className="secondary" type="submit">Enregistrer mes habitudes</button>
    </form>{notice && <p role="status">{notice}</p>}</details>
    <p className="finePrint">Semaine sélectionnée · marche : {habits.reduce((a,h)=>a+h.walk,0)} min · renforcement : {habits.reduce((a,h)=>a+h.strength,0)} min. Pas de conversion en calories ou en points vélo.</p>
  </section>;
}
export function SessionDebrief({state,workouts,sessionId}:{state:AppState;workouts:WorkoutTemplate[];sessionId:string}) {
  const session=state.sessions.find(s=>s.id===sessionId);
  if (!session) return null;
  const report=sessionDebrief(session,workouts,state.sessions);
  return <section className="sessionDebrief"><h3>Le regard du coach</h3><p>{report.advice}</p>{report.expected!==undefined && session.rpe!==undefined && <p>Ressenti déclaré : {session.rpe}/10 · repère moyen de la séance : {report.expected.toFixed(1)}/10.</p>}{report.previousRpe!==undefined && <p>Précédente séance complète aux mêmes réglages : ressenti {report.previousRpe}/10.</p>}<small>Ces repères décrivent ton effort déclaré ; ils ne constituent pas une mesure physiologique.</small></section>;
}
