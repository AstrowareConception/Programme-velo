import type { AppState, CompletedSession, Measurement } from './types';
import { normalizePlans, normalizeProgram, type ProgramSettings } from './adaptive-program';
import { normalizeWeeklyGoals, personalWeekTarget, isPerfectWeek, weekTargets, weeklyStats } from './data';
import { localInputDate, localDateToIso, localCalendarDay } from './dates';
import { archivedCycleState, cycleGoals, cycleEnded, programStartDate, programStartedAt, type ClosedCycle, type CycleGoal, type ProgramCycle, type ProgramTimeline } from './program-calendar';

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function normalizeCycle(value: unknown): ProgramCycle | undefined {
  if (!object(value) || typeof value.id !== 'string' || !value.id || value.id.length > 100 || typeof value.startDate !== 'string' || !localDateToIso(value.startDate, true)
    || typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt)) || typeof value.goal !== 'string' || !Object.hasOwn(cycleGoals, value.goal)) return;
  return { id: value.id, startDate: value.startDate, startedAt: new Date(value.startedAt).toISOString(), goal: value.goal as CycleGoal, returning: value.returning === true };
}
export function normalizeTimeline(value: unknown): ProgramTimeline | undefined {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.history)) return;
  const active = normalizeCycle(value.active);
  if (!active) return;
  const history: ClosedCycle[] = [];
  const ids = new Set([active.id]);
  for (const raw of value.history) {
    const cycle = normalizeCycle(raw);
    if (!cycle || !object(raw) || typeof raw.closedAt !== 'string' || !Number.isFinite(Date.parse(raw.closedAt)) || Date.parse(raw.closedAt) < Date.parse(cycle.startedAt)
      || ids.has(cycle.id) || !Array.isArray(raw.goals) || raw.goals.length !== 12 || !['renewal', 'restart'].includes(String(raw.reason))) return;
    const goals = normalizeWeeklyGoals(raw.goals, 1);
    // Reject damaged historical targets instead of silently changing their rewards.
    if (raw.goals.some((g, i) => !object(g) || Object.keys(goals[i]).some(k => g[k] !== goals[i][k as keyof typeof goals[number]]))) return;
    ids.add(cycle.id);
    history.push({ ...cycle, closedAt: new Date(raw.closedAt).toISOString(), reason: raw.reason as ClosedCycle['reason'], goals, plans: normalizePlans(raw.plans), settings: normalizeProgram(raw.settings) });
  }
  history.sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  if (history.some((c, i) => c.closedAt !== (history[i + 1]?.startedAt ?? active.startedAt))) return;
  return { version: 1, active, history };
}
export type NextCycleOptions = { id: string; goal: CycleGoal; settings: ProgramSettings; returning: boolean; expectedContext: string };
export function cycleContext(state: AppState) {
  return JSON.stringify([state.programTimeline, state.profile.startDate, state.program, state.programPlans, state.weeklyGoals]);
}
export function startNextCycle(state: AppState, options: NextCycleOptions, now = new Date()): AppState {
  if (options.expectedContext !== cycleContext(state)) throw new Error('Le programme a changé. Ferme cette proposition puis prépare-la à nouveau.');
  const settings = normalizeProgram(options.settings);
  if (!settings || !Object.hasOwn(cycleGoals, options.goal) || !options.id || options.id.length > 100) throw new Error('Choisis au moins un jour et un objectif valides.');
  const previous = state.programTimeline?.active ?? { id: `initial-${state.profile.startDate}`, startDate: state.profile.startDate, startedAt: programStartedAt(state), goal: state.program?.goal ?? 'habit', returning: false };
  if (!Number.isFinite(Date.parse(previous.startedAt)) || now.getTime() <= Date.parse(previous.startedAt) || options.id === previous.id || state.programTimeline?.history.some(c => c.id === options.id)) throw new Error('Ce départ de cycle est invalide. Vérifie la date de départ du profil.');
  const closedAt = now.toISOString();
  const closed: ClosedCycle = { ...previous, closedAt, reason: options.returning ? 'restart' : 'renewal',
    goals: normalizeWeeklyGoals(state.weeklyGoals, 12), plans: state.programPlans ?? [], settings: state.program };
  const nextSettings: ProgramSettings = { ...settings, goal: options.goal === 'weight' ? 'weight' : options.goal === 'endurance' || options.goal === 'progress' ? 'endurance' : 'habit' };
  return { ...state, programTimeline: { version: 1, active: { id: options.id, startDate: localInputDate(now), startedAt: closedAt, goal: options.goal, returning: options.returning }, history: [...(state.programTimeline?.history ?? []), closed] },
    program: nextSettings, programPlans: [], weeklyGoals: weekTargets.map(t => ({ ...personalWeekTarget(t.week, settings.days.length, settings.minutes),
      ...((options.returning && t.week <= 2) || options.goal === 'maintain' ? { maxHard: 0 } : {}) })) };
}
function delta(measurements: Measurement[], key: 'weight' | 'waist') {
  // Daily means avoid allowing repeated measurements on one day to dominate an endpoint.
  const days = new Map<string, number[]>();
  for (const m of measurements) if (typeof m[key] === 'number' && Number.isFinite(m[key]) && m[key]! > 0) {
    const day = localInputDate(new Date(m.date)); days.set(day, [...(days.get(day) ?? []), m[key]!]);
  }
  const values = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v.reduce((a, b) => a + b, 0) / v.length);
  return values.length >= 2 ? values.at(-1)! - values[0] : undefined;
}
export function cycleReport(state: AppState, cycle?: ClosedCycle, now = new Date()) {
  const selected = cycle ? archivedCycleState(state, cycle) : state;
  const from = Date.parse(cycle?.startedAt ?? programStartedAt(state));
  const until = cycle ? Date.parse(cycle.closedAt) : now.getTime() + 1;
  const sessions = state.sessions.filter(s => Date.parse(s.date) >= from && Date.parse(s.date) < until && Date.parse(s.date) <= now.getTime());
  const measurements = state.measurements.filter(m => Date.parse(m.date) >= from && Date.parse(m.date) < until && Date.parse(m.date) <= now.getTime());
  const view = { ...selected, sessions };
  const reports = sessions.filter(s => typeof s.rpe === 'number' && Number.isFinite(s.rpe));
  const activeDays = new Set(sessions.map(s => localInputDate(new Date(s.date))));
  const activeWeeks = new Set(sessions.map(s => Math.floor((localCalendarDay(new Date(s.date)) - localCalendarDay(new Date(programStartDate(view) + 'T12:00:00'))) / 7)));
  const reachedWeeks = weekTargets.filter(t => isPerfectWeek(view, t.week)).length;
  // A paired comparison requires the same stored settings key, completed workouts and two declared RPEs.
  const groups = new Map<string, CompletedSession[]>();
  for (const s of sessions) if (s.metrics?.completedWorkout && s.metrics.cadenceSettingsKey && typeof s.rpe === 'number' && Number.isFinite(s.rpe)) {
    const key = `${s.templateId}:${s.metrics.cadenceSettingsKey}`; groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const comparisons = [...groups.values()].filter(g => new Set(g.map(s => localInputDate(new Date(s.date)))).size >= 2).map(g => {
    g.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)); return { templateId: g[0].templateId, before: g[0].rpe!, after: g.at(-1)!.rpe! };
  });
  return { sessions: sessions.length, minutes: sessions.reduce((n, s) => n + s.duration, 0), activeDays: activeDays.size, activeWeeks: activeWeeks.size,
    variety: new Set(sessions.map(s => s.kind)).size, reachedWeeks, meanRpe: reports.length ? reports.reduce((n, s) => n + s.rpe!, 0) / reports.length : undefined,
    weightDelta: delta(measurements, 'weight'), waistDelta: delta(measurements, 'waist'), comparisons,
    ended: !!cycle || cycleEnded(state, now), weekly: weekTargets.map(t => ({ week: t.week, ...weeklyStats(view, t.week), reached: isPerfectWeek(view, t.week) })) };
}
