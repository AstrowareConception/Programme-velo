import { describe, expect, it } from 'vitest';
import { badges, emptyState, totalXp, weeklyStats, workouts } from '../lib/data';
import { cycleContext, cycleReport, normalizeTimeline, startNextCycle } from '../lib/program-cycles';
import { cycleEnded } from '../lib/program-calendar';
import { buildProgramPlan } from '../lib/adaptive-program';
import { cloudData, mergeData } from '../lib/cloud/model';
import { createBackup, parseBackup } from '../lib/storage';
import { recommendAdaptiveWorkout } from '../lib/coach';
import type { AppState, CompletedSession } from '../lib/types';
const now = new Date('2026-10-08T18:00:00Z');
const settings = { version: 1 as const, days: [1, 3, 5], minutes: 30, goal: 'habit' as const, energy: 'normal' as const };
const session = (id: string, date: string, bonus = false): CompletedSession => ({ id, date, templateId: 'recovery-30', duration: 30, points: 2, xp: 35, bonus, kind: 'recovery', intensity: 'easy', rpe: 3, metrics: { source: 'manual', completedWorkout: true } });
function initial() { const s = emptyState(); s.profile.startDate = '2026-07-01'; return s; }
function next(s: AppState, id = 'next', returning = false, at = now) { return startNextCycle(s, { id, goal: 'habit', settings, returning, expectedContext: cycleContext(s) }, at); }
describe('program cycles', () => {
  it('ends after 84 calendar days and preserves legacy data without opting into cycles', () => {
    const s = initial(); expect(cycleEnded(s, new Date('2026-09-22T12:00:00'))).toBe(false); expect(cycleEnded(s, new Date('2026-09-23T12:00:00'))).toBe(true);
    expect(parseBackup(JSON.stringify(createBackup(s, []))).state.programTimeline).toBeUndefined();
  });
  it('archives exact targets, plans and XP while making a fresh week with a timestamp boundary', () => {
    const s = initial(); s.weeklyGoals![0] = { week: 1, sessions: 1, minutes: 30, points: 2, variety: 1, maxHard: 0 }; s.sessions = [session('earned', '2026-07-01T14:00:00Z'), session('bonus', '2026-07-02T14:00:00Z', true), session('today-before', '2026-10-08T17:00:00Z')];
    const xp = totalXp(s), unlocked = badges(s).filter(b => b.unlocked).map(b => b.id); const result = next(s);
    expect(result.sessions).toBe(s.sessions); expect(result.measurements).toBe(s.measurements); expect(result.profile).toBe(s.profile);
    expect(result.programTimeline!.history[0].goals).toEqual(s.weeklyGoals); expect(weeklyStats(result, 1).minutes).toBe(0);
    expect(totalXp(result)).toBe(xp); for (const id of unlocked) expect(badges(result).find(b => b.id === id)?.unlocked).toBe(true);
    result.sessions.push(session('after', '2026-10-08T19:00:00Z')); expect(weeklyStats(result, 1).sessions).toBe(1);
    expect(cycleReport(result, result.programTimeline!.history[0], new Date('2026-10-09')).sessions).toBe(3);
  });
  it('round-trips multiple cycles and body measures without overlapping history', () => {
    let s = next(initial()); s = next(s, 'third', false, new Date('2026-10-09T18:00:00Z'));
    expect(normalizeTimeline(s.programTimeline)).toEqual(s.programTimeline);
    expect(parseBackup(JSON.stringify(createBackup(s, []))).state.programTimeline).toEqual(s.programTimeline);
    const broken = structuredClone(s); broken.programTimeline!.history[0].closedAt = '2026-10-20T00:00:00Z';
    expect(() => parseBackup(JSON.stringify({ format: 'veloquest-backup-v3', state: broken, customClimbs: [] }))).toThrow(/Cycles/);
  });
  it('refuses a stale confirmation, future profile start and duplicate cycle identifier', () => {
    const s = initial(), context = cycleContext(s); s.program = settings;
    expect(() => startNextCycle(s, { id: 'next', goal: 'habit', settings, returning: false, expectedContext: context }, now)).toThrow(/changé/);
    const changed = next(initial()); expect(() => next(changed)).toThrow(/invalide/);
    s.profile.startDate = '2099-01-01'; expect(() => next(s)).toThrow(/date/);
    s.profile.startDate = 'invalid-legacy-date'; expect(() => cycleReport(s)).not.toThrow(); expect(() => next(s)).toThrow(/date/);
  });
  it('builds a gentle restart independent of the original start and recent new activity', () => {
    const s = next(initial(), 'return', true); s.sessions.push(session('just-done', now.toISOString()));
    const plan = buildProgramPlan(s, { ...settings, energy: 'normal' }, 2, workouts, now);
    expect(plan.phase).toBe('Retour en selle'); expect(plan.rides.every(r => r.date >= s.programTimeline!.active.startDate && workouts.find(w => w.id === r.workoutId)!.intensity === 'easy')).toBe(true);
    const coach = recommendAdaptiveWorkout({ state: s, workouts, target: s.weeklyGoals![0], weekly: weeklyStats(s, 1), availableMinutes: 30, energy: 'hard', now }); expect(coach.workout.intensity).toBe('easy'); expect(coach.suggestedResistanceDelta).not.toBe(1);
  });
  it('receives a remote cycle intact while combining independent sessions', () => {
    const s = initial(), b = cloudData(s, []), l = cloudData(next(s), []), r = cloudData(s, []); r.state.sessions.push(session('phone', '2026-10-08T10:00:00Z'));
    const m = mergeData(b, l, r); expect(m.conflicts).toHaveLength(0); expect(m.data.state.programTimeline).toEqual(l.state.programTimeline); expect(m.data.state.sessions).toHaveLength(1);
  });
  it('requires one explicit program choice for competing cycles or old-week edits', () => {
    const s = initial(), b = cloudData(s, []), l = cloudData(next(s, 'tablet'), []), r = cloudData(next(s, 'phone'), []);
    r.state.weeklyGoals![0].minutes = 80;
    expect(mergeData(b, l, r).conflicts.map(c => c.path)).toEqual(['state.programTimeline']);
    const chosen = mergeData(b, l, r, { 'state.programTimeline': 'remote' }); expect(chosen.data.state.programTimeline).toEqual(r.state.programTimeline); expect(chosen.data.state.weeklyGoals).toEqual(r.state.weeklyGoals);
    const old = cloudData(s, []); old.state.weeklyGoals![0].minutes = 70; expect(mergeData(b, l, old).conflicts.map(c => c.path)).toEqual(['state.programTimeline']);
  });
  it('requires confirmation when an older device drops the calendar, keeping independent additions', () => {
    const s = next(initial()), base = cloudData(s, []), remote = cloudData(s, []);
    delete remote.state.programTimeline; remote.state.sessions.push(session('older-device', '2026-10-08T19:00:00Z'));
    const proposed = mergeData(base, base, remote);
    expect(proposed.conflicts.map(c => c.path)).toEqual(['state.programTimeline']);
    const kept = mergeData(base, base, remote, { 'state.programTimeline': 'local' });
    expect(kept.conflicts).toHaveLength(0); expect(kept.data.state.programTimeline).toEqual(s.programTimeline); expect(kept.data.state.sessions).toHaveLength(1);
  });
  it('reports only the selected cycle, excludes future dates and requires paired effort settings', () => {
    const s = next(initial()); s.sessions = [session('old', '2026-07-02T00:00:00Z'), session('a', '2026-10-08T19:00:00Z'), session('b', '2026-10-09T19:00:00Z'), session('future', '2026-10-11T12:00:00Z')];
    s.sessions[1].metrics!.cadenceSettingsKey = 'same'; s.sessions[2].metrics!.cadenceSettingsKey = 'same'; s.sessions[2].rpe = 2;
    s.measurements = [{ id: 'a', date: '2026-10-08T19:00:00Z', weight: 100 }, { id: 'b', date: '2026-10-08T20:00:00Z', weight: 102 }, { id: 'c', date: '2026-10-09T19:00:00Z', weight: 100 }];
    const report = cycleReport(s, undefined, new Date('2026-10-10')); expect(report.sessions).toBe(2); expect(report.weightDelta).toBe(-1); expect(report.comparisons).toEqual([{ templateId: 'recovery-30', before: 3, after: 2 }]);
    expect(report.weekly[0].sessions).toBe(2);
  });
});
