import { cadenceSummary, type CadenceScore } from "@/lib/effort";

export function CoachComparison({ score, previous, eligible }: { score?: CadenceScore; previous?: CadenceScore; eligible: boolean }) {
  const current = cadenceSummary(score), best = cadenceSummary(previous);
  if (current.percent === undefined || score?.version !== 2) return null;
  const record = eligible && !current.provisional && best.percent !== undefined && (score?.points ?? 0) > (previous?.points ?? 0);
  return <aside className={`coachComparison ${record ? "coachRecord" : ""}`} aria-label="Comparaison du suivi" role="status">
    <strong>{record ? "✦ Nouveau record de score ! ✦" : best.percent === undefined ? "Première référence à ces réglages" : "Ton score à réglages identiques"}</strong>
    <div><span>Aujourd’hui <b>{Math.floor(score?.points ?? 0)} pts · {current.grade} · {current.percent.toFixed(1)} %</b></span><span>Meilleur précédent <b>{best.percent === undefined ? "—" : `${Math.floor(previous?.points ?? 0)} pts · ${best.grade} · ${best.percent.toFixed(1)} %`}</b></span></div>
    {best.percent !== undefined && <small>{(score?.points ?? 0) >= (previous?.points ?? 0) ? "+" : ""}{Math.floor((score?.points ?? 0) - (previous?.points ?? 0))} points · note de régularité indépendante</small>}
    {(!eligible || current.provisional) && <p>Comparaison indicative : une épreuve complète, sans saut de segment, avec au moins 80 % de mesures et 60 s mesurées est nécessaire pour établir un record.</p>}
    {record && <span className="recordSparkles" aria-hidden="true">✧ ✦ ★ ✧ ✦</span>}
  </aside>;
}
