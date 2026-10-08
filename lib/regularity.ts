import type { Badge, CompletedSession } from './types';
import { localCalendarDay } from './dates';

export function regularityStats(sessions: CompletedSession[], now = new Date()) {
  // Recorded activity counts, including easy micro-sessions. Duplicates and future dates do not.
  const days = [...new Set(sessions.filter(s => Number.isFinite(Date.parse(s.date)) && Date.parse(s.date) <= now.getTime() && Number.isFinite(s.duration) && s.duration > 0)
    .map(s => localCalendarDay(new Date(s.date))))].sort((a, b) => a - b);
  let bestDays = 0, run = 0;
  days.forEach((day, i) => { run = i && day === days[i - 1] + 1 ? run + 1 : 1; bestDays = Math.max(bestDays, run); });
  // Calendar weeks, Monday through Sunday, allow recovery days.
  const weekCounts = new Map<number, number>();
  for (const day of days) { const monday = day - ((new Date(day * 86400000).getUTCDay() + 6) % 7); weekCounts.set(monday, (weekCounts.get(monday) ?? 0) + 1); }
  const regularWeeks = [...weekCounts].filter(([, count]) => count >= 3).map(([week]) => week).sort((a, b) => a - b);
  let bestWeeks = 0; run = 0;
  regularWeeks.forEach((week, i) => { run = i && week === regularWeeks[i - 1] + 7 ? run + 1 : 1; bestWeeks = Math.max(bestWeeks, run); });
  return { bestDays, bestWeeks, activeDays: days.length };
}
export const regularityTrophyIds = ['days-3', 'days-7', 'regular-weeks-2', 'regular-weeks-4', 'regular-weeks-8', 'regular-weeks-12'];
export function regularityBadges(sessions: CompletedSession[], now = new Date()): Badge[] {
  const stats = regularityStats(sessions, now);
  return [
    ...[{ target: 3, name: 'Trois rendez-vous', icon: '🌱' }, { target: 7, name: 'Sept jours en selle', icon: '🌟' }].map(t => ({
      id: `days-${t.target}`, name: t.name, icon: t.icon, description: `Enregistrer du vélo pendant ${t.target} jours consécutifs. Une séance facile ou une micro-séance compte ; aucune intensité imposée.`, unlocked: stats.bestDays >= t.target, progress: `${Math.min(stats.bestDays, t.target)}/${t.target} jours` })),
    ...[{ target: 2, name: 'Routine naissante', icon: '🌿' }, { target: 4, name: 'Un mois de rendez-vous', icon: '🗓️' }, { target: 8, name: 'Le rythme s’installe', icon: '💎' }, { target: 12, name: 'Fidèle au rendez-vous', icon: '🏆' }].map(t => ({
      id: `regular-weeks-${t.target}`, name: t.name, icon: t.icon, description: `Enchaîner ${t.target} semaines civiles avec du vélo au moins 3 jours par semaine. Du lundi au dimanche, jours de repos possibles.`, unlocked: stats.bestWeeks >= t.target, progress: `${Math.min(stats.bestWeeks, t.target)}/${t.target} semaines` }))
  ];
}
