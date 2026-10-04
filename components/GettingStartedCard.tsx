import type { AppState, WorkoutTemplate } from "@/lib/types";
import { guidanceSessions } from "@/lib/onboarding";

const milestones = ["Découvrir les consignes", "Trouver mon rythme", "Choisir mon chemin"];

export function GettingStartedCard({ state, workout, reasons, weeklySessions, availableMinutes, energy, onMinutes, onEnergy, onLaunch, onExplore, onReview, onFree }: {
  state: AppState; workout: WorkoutTemplate; reasons: string[]; weeklySessions: number;
  availableMinutes: number; energy: "easy" | "normal" | "hard"; onMinutes: (minutes: number) => void; onEnergy: (energy: "easy" | "normal" | "hard") => void;
  onLaunch: () => void; onExplore: () => void; onReview: () => void; onFree: () => void;
}) {
  const guide = state.guidance!;
  const sessions = guidanceSessions(state);
  const count = sessions.length;
  const rpeCount = sessions.filter((session) => typeof session.rpe === "number").length;
  return <section className="card gettingStartedCard" aria-label="Mon démarrage accompagné">
    <p className="eyebrow">{count >= 3 ? "TON PROGRAMME PREND FORME" : "UN PAS À LA FOIS"}</p>
    <h2>{count === 0 ? "Ta première séance, tout simplement." : count === 1 ? "Tu as commencé. Trouvons ton rythme." : count === 2 ? "Et si tu choisissais ton prochain chemin ?" : "Continue selon ton temps et ton énergie."}</h2>
    {count >= 3 && <div className="form formRow guideToday">
      <label>Temps pour aujourd’hui<select value={availableMinutes} onChange={(event) => onMinutes(Number(event.target.value))}>{[15, 25, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
      <label>Énergie pour aujourd’hui<select value={energy} onChange={(event) => onEnergy(event.target.value as "easy" | "normal" | "hard")}><option value="easy">Tranquille</option><option value="normal">Normale</option><option value="hard">Envie d’effort</option></select></label>
    </div>}
    <div className="guideWorkout"><p className="eyebrow">TA PROCHAINE ACTION</p><h3>{workout.name}</h3><p>{workout.duration} min · {workout.intensity === "easy" ? "facile" : workout.intensity === "moderate" ? "soutenu" : "intense"} · résistance réglable à la main</p>
      {count > 0 && <p className="finePrint">{reasons[0]}</p>}
      <button className="primary fullWidth" onClick={onLaunch}>{count === 0 ? "Préparer ma première séance" : "Préparer ma prochaine séance"}</button>
    </div>
    <ol className="guideMilestones">{milestones.map((label, i) => <li key={label} className={count > i ? "done" : ""} aria-current={Math.min(count, 2) === i && count < 3 ? "step" : undefined}><span>{count > i ? "✓" : i + 1}</span><strong>{label}</strong></li>)}</ol>
    <p>{count === 0 ? "Commence par 15 minutes faciles. Tu découvriras les niveaux, la pause et l’enregistrement de ton ressenti." : count < 3 ? "Chaque séance complète enregistrée ajoute un repère. Ton ressenti aide le coach ; une séance arrêtée reste dans ton journal sans faire avancer ces premiers pas." : `${rpeCount} ressenti${rpeCount > 1 ? "s" : ""} enregistré${rpeCount > 1 ? "s" : ""} : le coach apprend de tes séances, de leur intensité et de ta charge récente.`}</p>
    <div className="guideHint"><strong>Ton cap : {guide.weeklySessions} séances de {guide.sessionMinutes} min par semaine</strong><span>{weeklySessions} séance{weeklySessions > 1 ? "s" : ""} complète{weeklySessions > 1 ? "s" : ""} enregistrée{weeklySessions > 1 ? "s" : ""} cette semaine. C’est un repère personnel ; le programme de douze semaines reste consultable ci-dessous.</span></div>
    {count >= 1 && <details className="guideLesson" open={count === 1}><summary>Comment noter mon ressenti ?</summary><p>À la fin d’une séance, RPE indique l’effort ressenti sur 10 : 2–3 facile, 4–6 soutenu, 8–10 très difficile. Choisis ce que tu as vraiment ressenti ; ce n’est pas une note à réussir. Les prochains conseils tiendront compte des efforts élevés.</p></details>}
    {(count >= 2 || guide.goal === "explore") && <div className="guideLesson"><h3>Une envie de paysage ?</h3><p>Les balades à 1/5 offrent une autre façon de pédaler. Les formats courts commencent autour de 25 minutes ; une difficulté faible ne signifie pas une courte durée.</p><button className="secondary" onClick={onExplore}>Explorer les balades faciles</button></div>}
    <div className="guideFooter"><button className="secondary" onClick={onReview}>Ajuster mon démarrage</button><button className="onboardingSkip" onClick={onFree}>Passer en exploration libre</button></div>
  </section>;
}
