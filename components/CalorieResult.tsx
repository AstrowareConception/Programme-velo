import type { CalorieResult as Result } from "@/lib/calorie-challenge";
export function CalorieResult({ result, previous }: { result?: Result; previous?: Result }) {
  const record = result?.eligible && previous && result.kcal > previous.kcal;
  return <div className={record ? "coachComparison coachRecord" : "coachComparison"} role="status" aria-label="Résultat du défi calories">
    <strong>{record ? "Nouveau record calories !" : result?.eligible && !previous ? "Premier record calories" : "Défi calories"}</strong>
    <p>{result ? `${result.kcal.toFixed(0)} kcal · ${result.source === "ftms" ? `vélo ${result.deviceName ?? "FTMS"}` : "saisie déclarée"}` : "Calories à renseigner"}</p>
    <p>{previous ? `Record précédent : ${previous.kcal.toFixed(0)} kcal` : "Pas encore de record comparable"}</p>
    {record && <span className="recordSparkles" aria-hidden="true">✧ ✦ ★ ✧ ✦</span>}
    {result && !result.eligible && <small>Hors record : épreuve interrompue, incomplète ou mesure du vélo insuffisante.</small>}
  </div>;
}
