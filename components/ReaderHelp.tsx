import { CyclingGlossary } from "@/components/CyclingGlossary";

/** Native disclosure stays optional and keyboard accessible, with no overlay. */
export function ReaderHelp() {
  return <><details className="readerHelp readerEssentials">
    <summary>Les repères du lecteur</summary>
    <dl>
      <div><dt>Niveau · la résistance visée</dt><dd>La consigne utilise une échelle de 1 à 32. En mode manuel, règle le vélo toi-même. Avec un vélo connecté, une mesure reçue et une consigne peuvent différer ; le pilotage dépend des capacités et du contrôle autorisé.</dd></div>
      <div><dt>Cadence · le rythme de pédalage</dt><dd>Les tr/min indiquent les tours de pédale par minute. La cible te guide ; une cadence reçue du vélo décrit ce que tu fais réellement.</dd></div>
      <div><dt>RPE · ton ressenti sur 10</dt><dd>C’est une estimation de ton effort, pas une mesure du vélo. La cible est un repère ; au bilan, indique ce que tu as ressenti si tu le souhaites.</dd></div>
      <div><dt>Un tiret · une mesure indisponible</dt><dd>« — » ne signifie pas zéro. Au bilan, laisse vide une valeur inconnue. La progression d’un parcours peut être simulée : elle ne remplace pas les kilomètres mesurés par ton vélo.</dd></div>
    </dl>
  </details><CyclingGlossary /></>;
}

export function QuickGuideCard() {
  return <section className="card quickGuide">
    <div className="sectionHead"><div><p className="eyebrow">GUIDE RAPIDE</p><h2>Une routine simple</h2></div><span className="spark">4 étapes</span></div>
    <div className="guideSteps">
      <div><span>1</span><p><strong>Choisis selon ton temps.</strong><small>Le Coach Express adapte la séance au créneau et à ton énergie.</small></p></div>
      <div><span>2</span><p><strong>Respecte surtout ton ressenti.</strong><small>Le niveau guidé 1–32 est un repère ; utilise la calibration globale s’il est trop facile ou trop dur.</small></p></div>
      <div><span>3</span><p><strong>Enregistre la séance.</strong><small>Vérifie les mesures reçues par Bluetooth ou recopie les chiffres utiles du vélo, puis confirme le bilan.</small></p></div>
      <div><span>4</span><p><strong>Retrouve ta progression.</strong><small>Ouvre Suivi pour consulter tes séances et tes tendances. Tes données sont conservées dans ce navigateur : pense à exporter une sauvegarde depuis Plus.</small></p></div>
    </div>
    <ReaderHelp />
  </section>;
}
