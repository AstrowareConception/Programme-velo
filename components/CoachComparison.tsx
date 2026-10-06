import { cadenceSummary, type CadenceScore } from "@/lib/effort";

export function CoachComparison({ score, previous, eligible }: { score?: CadenceScore; previous?: CadenceScore; eligible: boolean }) {
  const current = cadenceSummary(score), best = cadenceSummary(previous);
  if (current.percent === undefined) return null;
  const record = eligible && !current.provisional && best.percent !== undefined && current.percent > best.percent + .0001;
  return <aside className={`coachComparison ${record ? "coachRecord" : ""}`} aria-label="Comparaison du suivi" role="status">
    <strong>{record ? "✦ Nouveau record de suivi ! ✦" : best.percent === undefined ? "Première référence à ces réglages" : "Ton suivi à réglages identiques"}</strong>
    <div><span>Aujourd’hui <b>{current.grade} · {current.percent.toFixed(1)} %</b></span><span>Meilleur précédent <b>{best.percent === undefined ? "—" : `${best.grade} · ${best.percent.toFixed(1)} %`}</b></span></div>
    {best.percent !== undefined && <small>{current.percent >= best.percent ? "+" : ""}{(current.percent - best.percent).toFixed(1)} points de pourcentage</small>}
    {(!eligible || current.provisional) && <p>Comparaison indicative : une épreuve complète, sans saut de segment, avec au moins 80 % de mesures et 60 s mesurées est nécessaire pour établir un record.</p>}
    {record && <span className="recordSparkles" aria-hidden="true">✧ ✦ ★ ✧ ✦</span>}
  </aside>;
}
