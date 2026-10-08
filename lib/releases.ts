/** Editorial milestones, independent of build SHAs. Keep the newest entry first.
 * Change an id only for a new user-facing release, never for a rebuild. */
export const releases = [
  {
    id: "2026-10-chrono-score-v2", date: "2026-10-08", label: "8 octobre 2026",
    title: "Le chrono entre en jeu",
    summary: "Six défis au départ lancé et un score qui suit vraiment ta cadence.",
    changes: [
      { title: "Distance ou chrono ?", text: "Dans Séances, parcours la plus grande distance en 1, 5 ou 12 minutes, ou termine 1, 5 ou 10 km au meilleur temps. Prends ton élan pendant le compte à rebours de cinq secondes." },
      { title: "Deux résultats distincts", text: "Le score V2 dépend de ta cadence, avec un combo quand tu tiens la cible. La note reste fondée sur la régularité. Les cartes affichent les deux ; les anciens résultats sont conservés hors nouveaux records." },
      { title: "Tes mesures dans le défi", text: "Vitesse instantanée en km/h, cadence, watts et fréquence cardiaque reçus du vélo accompagnent l’élan puis le chrono. Une mesure absente ou ancienne devient un tiret. Le bilan et l’historique indiquent la vitesse moyenne calculée hors élan." },
      { title: "Des records comparables", text: "Les résultats mesurés sont comparés sur le même nom de vélo et séparés des saisies déclarées. Coupure, compteur remis à zéro ou rechargement : pas de faux record." }
    ]
  },
  {
    id: "2026-10-discovery",
    date: "2026-10-07",
    label: "7 octobre 2026",
    title: "Tes repères, au bon moment",
    summary: "Des explications avant de pédaler et un espace pour retrouver ce qui change.",
    changes: [
      { title: "Une séance plus accessible", text: "Au clavier, les commandes restent dans la séance et le focus suit la préparation, la lecture et le bilan. Le paysage s’adapte au texte agrandi, avec défilement quand nécessaire. Échap revient au bouton de mise de côté sans effacer tes saisies." },
      { title: "Un diagnostic à relire", text: "Un souci ? Dans Plus, prépare un rapport technique, vérifie son contenu puis copie-le ou exporte-le pour accompagner ton retour. Ni profil ni historique sportif ne sont inclus, et rien n’est envoyé automatiquement." },
      { title: "Un bilan protégé", text: "Si le stockage refuse l’enregistrement, le bilan reste ouvert avec tes saisies et un bouton pour réessayer. Ferme-le seulement après une sauvegarde réussie." },
      { title: "Comprendre le lecteur", text: "Avant le départ, ouvre « Les repères du lecteur » pour distinguer niveau, cadence, ressenti et mesures reçues." },
      { title: "Les mots du vélo, simplement", text: "D+, BPM, RPM, watts… Un lexique avec des exemples concrets t’attend dans Plus → Guide rapide et avant chaque séance." },
      { title: "Retrouver les nouveautés", text: "Les évolutions importantes sont regroupées ici, dans Plus. Tu peux masquer l’annonce sur Quête et revenir les consulter à tout moment." }
    ]
  },
  {
    id: "2026-10-session-space",
    date: "2026-10-07",
    label: "7 octobre 2026",
    title: "Plus d’espace pour ta séance",
    summary: "De la préparation au bilan, la tablette trouve sa place.",
    changes: [
      { title: "Un lecteur paysage", text: "Sur tablette paysage compatible, consignes, progression et commandes partagent l’écran. Il fonctionne pour les séances classiques comme pour les parcours." },
      { title: "Un départ et un bilan plus clairs", text: "Programme et réglages avant le départ, récapitulatif et mesures à l’arrivée : deux colonnes en paysage, avec les actions principales accessibles." },
      { title: "Les mises à jour visibles", text: "Une annonce apparaît lorsqu’une mise à jour est prête. Son application reste protégée pendant une séance ou lorsqu’un autre onglet est occupé." }
    ]
  }
] as const;

export const latestRelease = releases[0];
export const RELEASE_SEEN_KEY = "veloquest:release-seen:v1";
