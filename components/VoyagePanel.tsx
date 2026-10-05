import type { CompletedSession } from "@/lib/types";
import type { ClimbChallenge } from "@/lib/routes";
import { voyagePlan, voyageProgress, voyageWorkout } from "@/lib/voyage";

type Props = {
  route?: ClimbChallenge;
  sessions: CompletedSession[];
  minutes: 15 | 30 | 45 | 60;
  interrupted: boolean;
  onMinutes: (minutes: Props["minutes"]) => void;
  onStart: () => void;
  onChoose: () => void;
  onClear: () => void;
};

export function VoyagePanel({ route, sessions, minutes, interrupted, onMinutes, onStart, onChoose, onClear }: Props) {
  if (!route) return <section className="card voyagePanel"><h2>Parcours du voyage indisponible</h2><p>Restaure une sauvegarde JSON contenant ce GPX pour continuer. Les portions de ton journal restent conservées.</p><button className="secondary" onClick={onClear}>Choisir un autre voyage</button></section>;
  const progress = voyageProgress(route, sessions);
  const plan = voyagePlan(route, sessions, minutes);
  const duration = plan ? voyageWorkout(route, plan).duration : 0;
  const percent = Math.floor(progress.coveredKm / route.distanceKm * 100);
  return <section className="card voyagePanel" aria-label="Mon voyage">
    <p className="eyebrow">VOYAGE · PLUSIEURS SÉANCES</p>
    <h2>{route.name}</h2>
    <p>{progress.complete ? "Voyage achevé : chaque kilomètre du parcours a été couvert." : "Un peu de route aujourd’hui, la suite une autre fois. Les portions achevées et enregistrées construisent ton voyage."}</p>
    <div className="voyageDistance"><strong>{progress.coveredKm.toFixed(2)} / {route.distanceKm.toFixed(2)} km</strong><span>{percent}%</span></div>
    <progress aria-label="Progression du voyage" value={progress.coveredKm} max={route.distanceKm} />
    {plan && <>
      <label>Temps disponible<select value={minutes} onChange={event => onMinutes(Number(event.target.value) as Props["minutes"])}>
        {[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
      </select></label>
      <p className="voyageNext"><strong>Prochaine portion : {plan.startKm.toFixed(2)} → {plan.endKm.toFixed(2)} km</strong><br />≈ {duration.toFixed(1)} min · position simulée à 15 km/h</p>
      {progress.intervals.length > 1 && <p>Une portion antérieure manque dans le journal. Tu reprendras ce passage ; les portions plus loin restent acquises.</p>}
      {interrupted && <p role="status">Reprends ou abandonne d’abord la séance interrompue depuis Quête.</p>}
      <button className="primary" disabled={interrupted} onClick={onStart}>{progress.coveredKm > 0 ? "Continuer mon voyage" : "Commencer mon voyage"}</button>
    </>}
    <p className="finePrint">Récompense du parcours entier : {route.xp} XP, une seule fois en Voyage. Une séance complète déjà inscrite sur ce parcours ne reçoit pas un second bonus. Les campagnes se valident à l’achèvement du parcours.</p>
    <div className="voyageChoices"><button className="secondary" onClick={onChoose}>Voir les parcours</button><button className="secondary" onClick={onClear}>Changer de voyage</button></div>
  </section>;
}
