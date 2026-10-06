import { describe, expect, it } from 'vitest';
import { emptyState, workouts, totalXp } from '../lib/data';
import { acceptPlan, buildProgramPlan, normalizeProgram, normalizePlans, normalizeHabits, normalizeJourneys, recentFeedback, weightTrend, comfortableCadence, completedPlannedRide, recalculatePlan } from '../lib/adaptive-program';
import { createBackup, parseBackup } from '../lib/storage';
import { masteryWorkouts } from '../lib/mastery-workouts';
import { workoutPrograms, workoutProgramProgress, workoutProgramBonusXp } from '../lib/workout-programs';
import { masteryProgress } from '../lib/mastery';
import { emptyCadenceScore, addCadenceInterval } from '../lib/effort';
import type { CompletedSession } from '../lib/types';
const now=new Date('2026-10-06T12:00:00Z');
const settings={version:1 as const,days:[1,3,5],minutes:30,goal:'habit' as const,energy:'normal' as const};
function state() {const s=emptyState();s.profile.startDate='2026-10-01';return s;}
function session(id='steady-25',rpe=4,date='2026-10-05T12:00:00Z'):CompletedSession {const w=workouts.find(w=>w.id===id)!;return {id,templateId:id,date,duration:w.duration,points:w.points,xp:w.xp,intensity:w.intensity,kind:w.kind,bonus:false,rpe,metrics:{source:'ftms',completedWorkout:true,avgCadenceRpm:65}};}
describe('personal programme',()=>{
 it('builds availability-aligned plans whose goals match actual sessions without repricing history',()=>{
  const s=state();s.sessions=[session()]; const p=buildProgramPlan(s,settings,1,workouts,now);
  expect(p.rides).toHaveLength(3);expect(p.rides.every(r=>settings.days.includes(new Date(r.date+'T12:00:00').getDay()))).toBe(true);
  const templates=p.rides.map(r=>workouts.find(w=>w.id===r.workoutId)!);
  expect(templates.every(w=>w.intensity==='easy' && w.duration<=30)).toBe(true);
  expect(p.target.minutes).toBe(templates.reduce((a,w)=>a+w.duration,0));
  const adopted=acceptPlan(s,p,settings);expect(adopted.sessions).toBe(s.sessions);expect(adopted.weeklyGoals?.[1]).toEqual(s.weeklyGoals?.[1]);expect(totalXp(adopted)).toBe(totalXp(s));
 });
 it('uses recovery weeks and an interruption without inventing catch-up debt',()=>{
  const s=state(); const p=buildProgramPlan(s,settings,4,workouts,now);expect(p.phase).toBe('Consolidation douce');expect(p.target.minutes).toBeLessThanOrEqual(75);
  s.sessions=[session('steady-25',3,'2026-09-01T12:00:00Z')];const resumed=buildProgramPlan(s,settings,3,workouts,now);expect(resumed.phase).toBe('Retour en selle');expect(resumed.rides).toHaveLength(3);
 });
 it('accounts for effort above target, including bonuses, but ignores future sessions',()=>{
  const s=state();s.sessions=[session('return-10',6),session('return-20',6)];expect(recentFeedback(s,workouts,now).difficult).toBe(true);
  const p=buildProgramPlan(s,settings,3,workouts,now);expect(p.phase).toBe('Consolidation douce');
  s.sessions=[session('return-10',10,'2099-01-01')];expect(recentFeedback(s,workouts,now).difficult).toBe(false);
 });
 it('recalculates a shorter replacement and only checks completed rides on their actual day',()=>{
  const s=state();const p=buildProgramPlan(s,settings,1,workouts,now);const smaller=recalculatePlan({...p,rides:p.rides.map((r,i)=>i===0?{...r,workoutId:'return-10'}:r)},workouts);expect(smaller.target.minutes).toBeLessThan(p.target.minutes);
  expect(completedPlannedRide({date:'2026-10-05',workoutId:'steady-25'},[session()],now)).toBe(true);
  expect(completedPlannedRide({date:'2026-10-06',workoutId:'steady-25'},[session()],now)).toBe(false);
 });
 it('round-trips plans, fractional points, habits and missing GPX references',()=>{
  const s=acceptPlan(state(),buildProgramPlan(state(),settings,1,workouts,now),settings);s.habits=[{date:'2026-10-06',walk:15,strength:10,rest:true,balancedMeal:false}];s.journeys=[{id:'j',name:'Ma route',routeIds:['unknown-gpx','ventoux']}];s.sessions=[session('precision-6')];
  const restored=parseBackup(JSON.stringify(createBackup(s,[]))).state;expect(restored.program).toEqual({...settings,days:[1,3,5]});expect(restored.programPlans).toEqual(s.programPlans);expect(restored.habits).toEqual(s.habits);expect(restored.journeys).toEqual(s.journeys);expect(restored.sessions[0].points).toBe(.5);
 });
 it('rejects malformed imported optional data and bounds the remaining values',()=>{
  expect(normalizeProgram({version:1,days:[]})).toBeUndefined();expect(normalizePlans([{version:1,week:1,rides:[],target:{}}])).toEqual([]);
  expect(normalizeHabits([{date:'2026-02-30',walk:20}])).toEqual([]);
  expect(normalizeJourneys([{id:'a',name:'Route',routeIds:['x','x',5]}])[0].routeIds).toEqual(['x']);
 });
 it('compares weight by daily means and requires sufficient measurement days',()=>{
  const s=state();s.measurements=[{id:'a',date:'2026-10-05T10:00:00Z',weight:100},{id:'b',date:'2026-10-05T11:00:00Z',weight:102},{id:'c',date:'2026-10-04T10:00:00Z',weight:99},{id:'d',date:'2026-09-28T10:00:00Z',weight:103},{id:'e',date:'2026-09-27T10:00:00Z',weight:103}];expect(weightTrend(s,now).delta).toBe(-3);s.measurements=s.measurements.slice(0,2);expect(weightTrend(s,now).delta).toBeUndefined();
 });
 it('requires three comfortable measured sessions before suggesting cadence',()=>{const s=session();expect(comfortableCadence([s,s],now)).toBeUndefined();expect(comfortableCadence([s,s,s],now)).toMatchObject({rpm:65,offset:-15});expect(comfortableCadence([{...s,rpe:8},s,s],now)).toBeUndefined();});
 it('keeps new content coherent, micro points limited and trophies unique',()=>{
  expect(masteryWorkouts).toHaveLength(10);expect(masteryWorkouts.every(w=>w.duration===w.segments.reduce((a,s)=>a+s.minutes,0))).toBe(true);
  const p=workoutPrograms.find(p=>p.id==='return-in-comfort')!;const done=p.workoutIds.map(id=>session(id));expect(workoutProgramProgress(p,done,now).complete).toBe(true);const xp=workoutProgramBonusXp(done);expect(workoutProgramBonusXp([...done,...done])).toBe(xp);
 });
 it('does not award mastery from incomplete or sparse telemetry',()=>{
  const s=session('manage-20');let score=addCadenceInterval(emptyCadenceScore(),1,'70–80',180,75);score=addCadenceInterval(score,2,'70–80',180,75);s.metrics={...s.metrics!,cadenceRecordEligible:true,cadenceScore:score};expect(masteryProgress([s],now)).toMatchObject({managed:true,precise:1});expect(masteryProgress([{...s,metrics:{...s.metrics!,completedWorkout:false}}],now).managed).toBe(false);
 });
});
