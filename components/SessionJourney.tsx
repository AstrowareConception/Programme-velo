import type { WorkoutTemplate } from "@/lib/types";

/** Presentational only: the session controller owns all values and actions. */
export function SessionJourneySteps({ phase }: { phase: "prepare" | "review" }) {
  return <ol className="sessionJourneySteps" aria-label="Étapes de la séance">
    <li aria-current={phase === "prepare" ? "step" : undefined}><span>01</span> Préparer</li>
    <li><span>02</span> Pédaler</li>
    <li aria-current={phase === "review" ? "step" : undefined}><span>03</span> Enregistrer</li>
  </ol>;
}

export function SessionReviewSummary({ workout }: { workout: WorkoutTemplate }) {
  return <div className="sessionReviewSummary">
    <p className="eyebrow">TA SÉANCE</p>
    <h3>{workout.name}</h3>
    <p>Un moment pour faire le point.</p>
    <p className="muted">Vérifie la durée et les mesures du vélo, puis indique ton ressenti si tu le souhaites. Une valeur inconnue peut rester vide.</p>
    <div className="journeyHint"><strong>Et après ?</strong><p>Après validation, retrouve cette séance dans Suivi pour consulter tes mesures et ta progression.</p></div>
    <small>La séance sera enregistrée lorsque tu confirmeras le bilan.</small>
  </div>;
}
