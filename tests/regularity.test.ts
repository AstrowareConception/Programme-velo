import { describe, expect, it } from 'vitest';
import { regularityBadges, regularityStats } from '../lib/regularity';
import type { CompletedSession } from '../lib/types';
const now = new Date('2026-11-01T23:00:00Z');
function ride(date: string): CompletedSession { return { id: date, date: date + 'T12:00:00', templateId: 'bonus-10', duration: 10, points: .5, xp: 10, bonus: true, kind: 'recovery', intensity: 'easy' }; }
describe('regularity trophies', () => {
  it('counts distinct local calendar days, micro-sessions and best historic runs', () => {
    const rows = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10'].map(ride); rows.push(rows[0], ride('2099-01-01'), { ...ride('2026-10-04'), duration: 0 });
    expect(regularityStats(rows, now)).toMatchObject({ bestDays: 3, activeDays: 4 }); expect(regularityBadges(rows, now).find(b => b.id === 'days-3')?.unlocked).toBe(true);
  });
  it('allows rest days across two Monday-to-Sunday weeks and breaks on a missing week', () => {
    const dates = ['2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-07', '2026-10-09', '2026-10-19', '2026-10-21', '2026-10-23'];
    const stats = regularityStats(dates.map(ride), now); expect(stats.bestWeeks).toBe(2); expect(stats.bestDays).toBe(1);
  });
  it('crosses month and daylight-saving boundaries using calendar days', () => {
    const rows = ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].map(ride);
    expect(regularityStats(rows, now).bestDays).toBe(7); expect(regularityBadges(rows, now).find(b => b.id === 'days-7')?.unlocked).toBe(true);
  });
});
