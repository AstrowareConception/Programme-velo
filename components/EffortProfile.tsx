import type { WorkoutTemplate } from "@/lib/types";
import { resistanceTarget } from "@/lib/effort";

export function EffortProfile({ workout, elapsed, offset }: { workout: WorkoutTemplate; elapsed: number; offset: number }) {
  const duration = workout.segments.reduce((sum, segment) => sum + segment.minutes * 60, 0);
  let start = 0;
  const paths = workout.segments.map((segment, index) => {
    const seconds = segment.minutes * 60;
    const points = Array.from({ length: 65 }, (_, i) => {
      const t = seconds * i / 64;
      return `${(start + t) / duration * 600},${84 - (resistanceTarget(segment, t, offset) ?? 1) / 32 * 76}`;
    }).join(" ");
    start += seconds;
    return <polyline key={index} points={points} fill="none" stroke="currentColor" strokeWidth="3" />;
  });
  return <figure className="effortProfile"><figcaption>Profil de résistance <span>Début → Fin</span></figcaption><svg viewBox="0 0 600 90" role="img" aria-label={`Profil d’effort, progression ${Math.round(elapsed / duration * 100)} %`} preserveAspectRatio="none">{paths}<line x1={Math.min(600, elapsed / duration * 600)} x2={Math.min(600, elapsed / duration * 600)} y1="0" y2="90" stroke="white" strokeWidth="2" /></svg><small>La ligne blanche indique ta position · niveaux de résistance, pas altitude</small></figure>;
}
