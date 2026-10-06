import type { CompletedSession } from '@/lib/types';
import { masteryProgress } from '@/lib/mastery';
export function MasteryPanel({sessions}:{sessions:CompletedSession[]}) {
  const p=masteryProgress(sessions);
  return <details className="campaignDrawer masteryPanel"><summary>Défis de maîtrise · précision, continuité, gestion</summary><p>Des objectifs personnels rejouables. Seules les séances complètes, à réglages constants et suffisamment mesurées sont retenues. Aucun bonus de points hebdomadaires n’est ajouté.</p><div className="reviewMetrics">
    <div><small>Précision · 3 séances différentes à 90 %</small><strong>{p.precise>=3?'✓ Maîtrisé':`${p.precise} / 3`}</strong></div><div><small>Continuité · 60 secondes dans la cible</small><strong>{p.bestCombo>=60?'✓ Maîtrisé':`${Math.floor(p.bestCombo)} / 60 s`}</strong></div><div><small>Gestion · une seconde moitié aussi précise</small><strong>{p.managed?'✓ Maîtrisé':'À découvrir'}</strong></div>
  </div><p className="finePrint">Gestion : dans « Garder une réserve » ou « Finir avec aisance », réussir au moins 80 % du premier plateau et faire aussi bien au second. Ces défis évaluent le suivi des consignes, pas la valeur de ton effort.</p></details>;
}
