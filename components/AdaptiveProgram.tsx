"use client";
import { useState } from 'react';
import type { AppState, WorkoutTemplate } from '@/lib/types';
import { acceptPlan, buildProgramPlan, completedPlannedRide, recalculatePlan, sessionsInWeek, weekDates, type ProgramPlan, type ProgramSettings } from '@/lib/adaptive-program';
import { localInputDate } from '@/lib/dates';
import { cycleEnded, programStartDate } from '@/lib/program-calendar';
const weekdays = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
type Props = { state: AppState; week: number; workouts: WorkoutTemplate[]; onChange: (update: (state: AppState) => AppState) => void; onLaunch: (w: WorkoutTemplate) => void };
export function AdaptiveProgram({state,week,workouts,onChange,onLaunch}:Props) {
  const [settings,setSettings]=useState<ProgramSettings>(state.program??{version:1,days:[1,3,5,0],minutes:25,goal:'habit',energy:'normal'});
  const [selectedWeek,setWeek]=useState(week);
  const [draft,setDraft]=useState<ProgramPlan>();
  const [notice,setNotice]=useState('');
  const plan=draft??state.programPlans?.find(p=>p.week===selectedWeek);
  if (cycleEnded(state)) return null;
  const today=localInputDate();
  function preview() { try { setDraft(buildProgramPlan(state,settings,selectedWeek,workouts));setNotice('Proposition prête : tes objectifs ne changent qu’après confirmation.'); } catch(e) {setNotice(e instanceof Error?e.message:'Impossible de préparer la semaine.');} }
  function edit(index:number, patch:Partial<ProgramPlan['rides'][number]>) {
    if (!plan) return;
    setDraft(recalculatePlan({...plan,rides:plan.rides.map((r,i)=>i===index?{...r,...patch}:r)},workouts));
    setNotice('Modification préparée. Confirme cette semaine pour l’enregistrer.');
  }
  return <section className="card adaptiveProgram" aria-label="Ma semaine adaptée">
    <p className="eyebrow">PROGRAMME PERSONNEL · 12 SEMAINES</p><h2>Ma semaine adaptée</h2>
    <p>Un planning souple, des séances à ta portée. Les jours manqués ne sont pas reportés automatiquement.</p>
    <details open={!state.program}><summary>Mes disponibilités et mon objectif</summary>
      <div className="formRow"><label>Mon objectif<select value={settings.goal} onChange={e=>{setSettings({...settings,goal:e.target.value as ProgramSettings['goal']});setDraft(undefined);}}><option value="habit">Installer une routine</option><option value="endurance">Être à l’aise plus longtemps</option><option value="weight">Accompagner la perte de poids</option></select></label><label>Mon créneau maximum<select value={settings.minutes} onChange={e=>{setSettings({...settings,minutes:Number(e.target.value)});setDraft(undefined);}}>{[10,15,20,25,30,40,45,60].map(m=><option key={m} value={m}>{m} minutes</option>)}</select></label></div>
      <fieldset className="dayChoices"><legend>Mes jours disponibles</legend>{[1,2,3,4,5,6,0].map(d=><label key={d}><input type="checkbox" checked={settings.days.includes(d)} onChange={e=>{setSettings({...settings,days:e.target.checked?[...settings.days,d]:settings.days.filter(v=>v!==d)});setDraft(undefined);}} />{weekdays[d]}</label>)}</fieldset>
      <label>Mon énergie pour cette semaine<select value={settings.energy} onChange={e=>{setSettings({...settings,energy:e.target.value as ProgramSettings['energy']});setDraft(undefined);}}><option value="normal">Habituelle</option><option value="easy">Besoin de douceur</option></select></label>
      <p className="finePrint">Les semaines 4, 8 et 12 sont allégées. Le programme ne prescrit aucune séance maximale. Le mode perte de poids privilégie une routine tenable, sans promesse de kilos perdus.</p>
    </details>
    <div className="programToolbar"><label>Semaine à préparer<select value={selectedWeek} onChange={e=>{setWeek(Number(e.target.value));setDraft(undefined);setNotice('');}}>{Array.from({length:13-week},(_,i)=>week+i).map(w=><option key={w} value={w}>Semaine {w}{w===week?' · actuelle':''}</option>)}</select></label><button className="secondary" disabled={!settings.days.length} onClick={preview}>{plan?'Actualiser la proposition':'Proposer ma semaine'}</button></div>
    {plan && <><div className="planSummary"><strong>{plan.phase}</strong><span>{plan.target.sessions} séances · {plan.target.minutes} min · {plan.target.points.toLocaleString('fr-FR')} points</span><p>{plan.reason}</p></div>
      <ol className="plannedRides">{plan.rides.map((ride,i)=>{
        const workout=workouts.find(w=>w.id===ride.workoutId);
        const done=completedPlannedRide(ride,state.sessions);
        const past=ride.date<today;
        return <li key={ride.date}><div className="plannedHeading"><strong>{new Date(ride.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'})}</strong><span>{done?'✓ Réalisée':past?'Jour passé · sans rattrapage':'À ton rythme'}</span></div><h3>{workout?.name??'Séance indisponible'}</h3><p>{workout?.duration} min · {workout?.intensity==='easy'?'facile':'modérée'}</p>
          {!done && workout && <div className="planActions"><button className="primary" onClick={()=>onLaunch(workout)}>Ouvrir la séance</button><details><summary>Déplacer ou raccourcir</summary><label>Autre jour<select value={ride.date} onChange={e=>edit(i,{date:e.target.value})}>{weekDates(programStartDate(state),selectedWeek).filter(d=>localInputDate(d)===ride.date || (!plan.rides.some(r=>r.date===localInputDate(d)) && localInputDate(d)>=today)).map(d=><option key={localInputDate(d)} value={localInputDate(d)}>{d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric'})}</option>)}</select></label><label>Séance de remplacement<select value={ride.workoutId} onChange={e=>edit(i,{workoutId:e.target.value})}>{workouts.filter(w=>w.id===ride.workoutId || (!w.bonus && !w.id.startsWith('calories-') && w.duration>=10 && w.duration<=workout.duration && w.intensity==='easy')).map(w=><option key={w.id} value={w.id}>{w.name} · {w.duration} min</option>)}</select></label></details></div>}
        </li>;
      })}</ol>
      {draft && <button className="primary" onClick={()=>{onChange(previous=>acceptPlan(previous,draft,settings));setDraft(undefined);setNotice('Semaine enregistrée et objectifs ajustés. Les autres semaines et ton historique sont conservés.');}}>Confirmer cette semaine</button>}
      {sessionsInWeek(state,selectedWeek).length>0 && <p className="finePrint">Toutes tes séances de la semaine comptent dans le bilan, même réalisées hors planning. La coche du planning correspond à une séance complète enregistrée au jour prévu.</p>}
    </>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
