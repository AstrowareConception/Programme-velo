import type { AppState, WeekTarget } from './types';
import type { ProgramPlan, ProgramSettings } from './adaptive-program';
import { localCalendarDay } from './dates';

export type CycleGoal = 'habit' | 'endurance' | 'progress' | 'maintain' | 'weight';
export type ProgramCycle = { id: string; startDate: string; startedAt: string; goal: CycleGoal; returning: boolean };
export type ClosedCycle = ProgramCycle & { closedAt: string; reason: 'renewal' | 'restart'; goals: WeekTarget[]; plans: ProgramPlan[]; settings?: ProgramSettings };
export type ProgramTimeline = { version: 1; active: ProgramCycle; history: ClosedCycle[] };
export const cycleGoals: Record<CycleGoal, { label: string; description: string }> = {
  habit: { label: 'Régularité', description: 'Installer des rendez-vous tenables, avec des séances faciles et variées.' },
  endurance: { label: 'Endurance', description: 'Privilégier les séances régulières, dans le temps dont tu disposes.' },
  progress: { label: 'Progression', description: 'Varier les séances faciles et modérées, sans augmenter automatiquement la charge.' },
  maintain: { label: 'Maintien', description: 'Conserver ta routine avec un planning facile, sans escalade de difficulté.' },
  weight: { label: 'Accompagnement du poids', description: 'Soutenir une pratique régulière, sans objectif de perte imposé.' }
};
export function programStartDate(state: AppState) { return state.programTimeline?.active.startDate ?? state.profile.startDate; }
export function programStartedAt(state: AppState) {
  if (state.programTimeline) return state.programTimeline.active.startedAt;
  const date = new Date(state.profile.startDate + 'T00:00:00');
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}
export function cycleElapsedDays(state: AppState, now = new Date()) {
  return Math.max(0, localCalendarDay(now) - localCalendarDay(new Date(programStartDate(state) + 'T12:00:00')));
}
export function cycleEnded(state: AppState, now = new Date()) { return cycleElapsedDays(state, now) >= 84; }
export function archivedCycleState(state: AppState, cycle: ClosedCycle): AppState {
  return { ...state, programTimeline: undefined, profile: { ...state.profile, startDate: cycle.startDate },
    program: cycle.settings, weeklyGoals: cycle.goals, programPlans: cycle.plans,
    sessions: state.sessions.filter(s => Date.parse(s.date) >= Date.parse(cycle.startedAt) && Date.parse(s.date) < Date.parse(cycle.closedAt)) };
}
export function cycleStates(state: AppState) { return [...(state.programTimeline?.history ?? []).map(c => archivedCycleState(state, c)), state]; }
