import type { AppState, CompletedSession, WeekTarget, WorkoutTemplate } from './types';
import { localInputDate, localCalendarDay } from './dates';
import { numericRange, cadenceSummary } from './effort';

export type ProgramSettings = { version: 1; days: number[]; minutes: number; goal: 'habit' | 'endurance' | 'weight'; energy: 'easy' | 'normal'; };
export type PlannedRide = { date: string; workoutId: string };
export type ProgramPlan = { version: 1; week: number; createdAt: string; phase: string; reason: string; rides: PlannedRide[]; target: WeekTarget };
export type HabitDay = { date: string; walk: number; strength: number; balancedMeal: boolean; rest: boolean };
export type PersonalJourney = { id: string; name: string; routeIds: string[] };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const dateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && localInputDate(new Date(v + 'T12:00:00')) === v;
export function normalizeProgram(value: unknown): ProgramSettings | undefined {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.days)) return undefined;
  const days = [...new Set(value.days.filter((d): d is number => finite(d) && Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  if (!days.length) return undefined;
  return { version: 1, days, minutes: finite(value.minutes) ? Math.max(10, Math.min(60, Math.round(value.minutes / 5) * 5)) : 25,
    goal: value.goal === 'weight' || value.goal === 'endurance' ? value.goal : 'habit', energy: value.energy === 'easy' ? 'easy' : 'normal' };
}
export function normalizePlans(value: unknown): ProgramPlan[] {
  if (!Array.isArray(value)) return [];
  const plans = new Map<number, ProgramPlan>();
  for (const p of value) {
    if (!object(p) || p.version !== 1 || !finite(p.week) || !Number.isInteger(p.week) || p.week < 1 || p.week > 12 || !object(p.target) || !Array.isArray(p.rides)) continue;
    const target = p.target;
    const rides = p.rides.filter((r): r is PlannedRide => object(r) && dateKey(r.date) && typeof r.workoutId === 'string' && r.workoutId.length > 0).slice(0,7);
    if (!rides.length || new Set(rides.map(r => r.date)).size !== rides.length || !['minutes','points','sessions','variety','maxHard'].every(k => finite(target[k]) && target[k] >= 0)) continue;
    if (p.target.sessions !== rides.length || Number(p.target.minutes) > 420 || Number(p.target.variety) > rides.length || Number(p.target.maxHard) > rides.length) continue;
    plans.set(p.week, { version: 1, week: p.week, createdAt: typeof p.createdAt === 'string' ? p.createdAt : '', phase: typeof p.phase === 'string' ? p.phase : 'Consolidation', reason: typeof p.reason === 'string' ? p.reason : '', rides,
      target: { week:p.week, minutes:Number(p.target.minutes), points:Number(p.target.points), sessions:rides.length, variety:Number(p.target.variety), maxHard:Number(p.target.maxHard) } });
  }
  return [...plans.values()].sort((a,b) => a.week-b.week);
}
export function normalizeHabits(value: unknown): HabitDay[] {
  if (!Array.isArray(value)) return [];
  const days = new Map<string, HabitDay>();
  for (const h of value) if (object(h) && dateKey(h.date)) days.set(h.date, { date:h.date, walk:finite(h.walk) ? Math.max(0, Math.min(300, h.walk)) : 0, strength:finite(h.strength) ? Math.max(0, Math.min(180,h.strength)) : 0, balancedMeal:h.balancedMeal === true, rest:h.rest === true });
  return [...days.values()].sort((a,b) => a.date.localeCompare(b.date));
}
export function normalizeJourneys(value: unknown): PersonalJourney[] {
  if (!Array.isArray(value)) return [];
  const journeys = new Map<string, PersonalJourney>();
  for (const j of value) if (object(j) && typeof j.id === 'string' && typeof j.name === 'string' && Array.isArray(j.routeIds)) {
    const routeIds = [...new Set(j.routeIds.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length < 150))].slice(0,20);
    if (routeIds.length) journeys.set(j.id, { id:j.id.slice(0,100), name:j.name.trim().slice(0,80) || 'Mon voyage', routeIds });
  }
  return [...journeys.values()].slice(0,20);
}
export function weekDates(startDate: string, week: number) {
  return Array.from({length:7}, (_,i) => { const d = new Date(startDate + 'T12:00:00'); d.setDate(d.getDate() + (week-1)*7+i); return d; });
}
export function sessionsInWeek(state: AppState, week: number, now = new Date()) {
  const dates = new Set(weekDates(state.profile.startDate,week).map(d => localInputDate(d)));
  return state.sessions.filter(s => Number.isFinite(Date.parse(s.date)) && Date.parse(s.date) <= now.getTime() && dates.has(localInputDate(new Date(s.date))));
}
export function targetRpe(workout?: WorkoutTemplate) {
  const segments = workout?.segments.flatMap(s => { const r = numericRange(s.rpe); return r ? [{ minutes:s.minutes, rpe:(r[0]+r[1])/2 }] : []; }) ?? [];
  const minutes = segments.reduce((a,s) => a+s.minutes,0);
  return minutes ? segments.reduce((a,s) => a+s.rpe*s.minutes,0)/minutes : undefined;
}
export function recentFeedback(state: AppState, workouts: WorkoutTemplate[], now = new Date()) {
  const all = state.sessions.filter(s => Date.parse(s.date) <= now.getTime() && Number.isFinite(Date.parse(s.date))).sort((a,b) => Date.parse(b.date)-Date.parse(a.date));
  // Include bonuses: a short hard effort still contributes to fatigue.
  const recent = all.filter(s => now.getTime()-Date.parse(s.date) <= 7*86400000);
  const reports = recent.flatMap(s => { const expected = targetRpe(workouts.find(w=> w.id === s.templateId)); return finite(s.rpe) && expected !== undefined ? [{ observed:s.rpe, gap:s.rpe-expected }] : []; });
  const averageGap = reports.length ? reports.reduce((a,r)=>a+r.gap,0)/reports.length : undefined;
  const recentHard = recent.some(s => s.intensity === 'hard' && now.getTime()-Date.parse(s.date) <= 48*3600000);
  return { recent, reports:reports.length, averageGap, difficult:reports.some(r=>r.observed>=8) || (reports.length>=2 && (averageGap ?? 0)>=1.5),
    returnAfterBreak:all.length>0 && now.getTime()-Date.parse(all[0].date)>=10*86400000, recentHard };
}
export function buildProgramPlan(state: AppState, settings: ProgramSettings, week: number, workouts: WorkoutTemplate[], now = new Date()): ProgramPlan {
  const feedback = recentFeedback(state, workouts, now);
  const recovery = week % 4 === 0 || feedback.difficult || feedback.returnAfterBreak || settings.energy === 'easy';
  const phase = feedback.returnAfterBreak ? 'Retour en selle' : recovery ? 'Consolidation douce' : week <= 2 ? 'Installer l’habitude' : week <= 7 ? 'Développer l’aisance' : 'Renforcer la régularité';
  const reason = feedback.returnAfterBreak ? 'Après une interruption, des séances faciles pour retrouver tes repères.' : feedback.difficult ? 'Ton ressenti dépasse les consignes récentes : durée et difficulté allégées.' : week%4===0 ? 'Une semaine plus légère pour consolider. Aucune dette à rattraper.' : settings.energy==='easy' ? 'Tu as choisi une semaine tranquille.' : 'La durée respecte tes disponibilités. La progression passe par la variété, sans hausse automatique du volume.';
  const duration = Math.max(10, settings.minutes - (recovery ? 5 : 0));
  const dates = weekDates(state.profile.startDate,week).filter(d => settings.days.includes(d.getDay()));
  const pool = workouts.filter(w => !w.bonus && !w.id.startsWith('calories-') && w.duration >= 10 && w.duration <= duration && w.intensity !== 'hard' && w.id !== 'free-ride');
  const used = new Set<string>();
  const usedKinds = new Set<string>();
  const rides = dates.map((date,i) => {
    const easy = recovery || week<=2 || feedback.recentHard || i%2===0;
    const eligible = pool.filter(w=>!easy || w.intensity==='easy');
    const chosen = [...eligible].sort((a,b) => {
      const score = (w: WorkoutTemplate) => -Math.abs(duration-w.duration)*3 - (used.has(w.id)?40:0) - (usedKinds.has(w.kind)?8:0) + (settings.goal==='endurance' && w.kind==='endurance'?6:0);
      return score(b)-score(a) || a.id.localeCompare(b.id);
    })[0];
    if (!chosen) throw new Error('Aucune séance adaptée à ce créneau. Choisis au moins dix minutes.');
    used.add(chosen.id); usedKinds.add(chosen.kind);
    return {date:localInputDate(date), workoutId:chosen.id};
  });
  return recalculatePlan({version:1,week,createdAt:now.toISOString(),phase,reason,rides,target:{week,minutes:0,sessions:0,points:0,variety:0,maxHard:0}},workouts);
}
export function recalculatePlan(plan: ProgramPlan, workouts: WorkoutTemplate[]): ProgramPlan {
  const templates = plan.rides.flatMap(r => { const w=workouts.find(w=>w.id===r.workoutId); return w?[w]:[]; });
  return {...plan,target:{ week:plan.week, sessions:plan.rides.length, minutes:templates.reduce((a,w)=>a+w.duration,0), points:templates.reduce((a,w)=>a+w.points,0), variety:new Set(templates.map(w=>w.kind)).size, maxHard:templates.filter(w=>w.intensity==='hard').length }};
}
export function acceptPlan(state: AppState, plan: ProgramPlan, settings: ProgramSettings): AppState {
  return {...state, program:settings, programPlans:[...(state.programPlans??[]).filter(p=>p.week!==plan.week),plan].sort((a,b)=>a.week-b.week),
    weeklyGoals:[...(state.weeklyGoals??[]).filter(t=>t.week!==plan.week),plan.target].sort((a,b)=>a.week-b.week) };
}
export function completedPlannedRide(ride: PlannedRide, sessions: CompletedSession[], now = new Date()) {
  return sessions.some(s=>s.templateId===ride.workoutId && localInputDate(new Date(s.date))===ride.date && Date.parse(s.date)<=now.getTime() && s.metrics?.completedWorkout===true && !s.routeId);
}
export function weightTrend(state: AppState, now = new Date()) {
  // One mean per calendar day prevents repeated same-day weighing from dominating.
  const daily = new Map<number,number[]>();
  for (const m of state.measurements) if (finite(m.weight) && m.weight>0 && Date.parse(m.date)<=now.getTime()) {
    const age=localCalendarDay(now)-localCalendarDay(new Date(m.date));
    if (age>=0 && age<28) daily.set(age,[...(daily.get(age)??[]),m.weight]);
  }
  const avg = (lo:number,hi:number) => { const values=[...daily].filter(([age])=>age>=lo && age<hi).map(([,v])=>v.reduce((a,b)=>a+b,0)/v.length); return {count:values.length, value:values.length ? values.reduce((a,b)=>a+b,0)/values.length : undefined}; };
  const current=avg(0,7), previous=avg(7,14);
  return {current, previous, delta:current.count>=2 && previous.count>=2 ? current.value!-previous.value! : undefined};
}
export function sessionDebrief(session: CompletedSession, workouts: WorkoutTemplate[], history: CompletedSession[]) {
  const expected=targetRpe(workouts.find(w=>w.id===session.templateId));
  const gap=finite(session.rpe) && expected!==undefined ? session.rpe-expected : undefined;
  const score=cadenceSummary(session.metrics?.cadenceScore);
  const comparable=history.filter(s=>s.id!==session.id && s.templateId===session.templateId && s.metrics?.cadenceSettingsKey && s.metrics.cadenceSettingsKey===session.metrics?.cadenceSettingsKey && Date.parse(s.date)<Date.parse(session.date) && finite(s.rpe) && s.metrics.completedWorkout).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0];
  return { expected, gap, score, previousRpe:comparable?.rpe,
    advice:gap!==undefined && gap>=1.5 ? 'L’effort a dépassé la consigne. Privilégie une prochaine séance facile ou allège la résistance.' : session.metrics?.completedWorkout===false ? 'Une séance écourtée reste du mouvement accompli. Reprends selon tes disponibilités, sans rattrapage.' : 'Garde ce rythme si tu te sens bien. La régularité compte autant que les records.' };
}

export function comfortableCadence(sessions:CompletedSession[],now=new Date()) {
  const values=sessions.filter(s=>s.intensity==='easy' && s.metrics?.completedWorkout && finite(s.rpe) && s.rpe<=4 && s.metrics.source!=='manual' && Date.parse(s.date)<=now.getTime() && now.getTime()-Date.parse(s.date)<=28*86400000)
    .map(s=>s.metrics?.avgCadenceRpm).filter((v):v is number=>finite(v) && v>=40 && v<=120).sort((a,b)=>a-b);
  if(values.length<3) return undefined;
  const middle=Math.floor(values.length/2),median=values.length%2?values[middle]:(values[middle-1]+values[middle])/2;
  return {rpm:Math.round(median),count:values.length,offset:Math.max(-25,Math.min(10,Math.round((median-80)/5)*5))};
}
