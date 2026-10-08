# Roadmap VéloQuest

Actualisée le **8 octobre 2026** à partir de `main` `5e64624ed42536a509626d0eb68ae498afcda176`. Orientation vers une distribution grand public validée par l’utilisateur. Les jalons ci-dessous pilotent désormais l’exécution ; le backlog détaillé reste conservé.

Cette roadmap remplace les listes historiques devenues obsolètes. Le produit dispose déjà d'un socle très riche : 44 séances, 84 parcours natifs, 38 balades faciles, 12 thèmes, 6 programmes, 22 campagnes/carnets et 77 badges. L'objectif n'est plus d'empiler les fonctionnalités, mais de consolider le produit, fiabiliser son usage réel, prolonger le programme au-delà de douze semaines et rendre le matériel connecté extensible à plusieurs vélos.

## Cap produit — de l’usage personnel à la distribution

### Jalon A — Première séance impeccable · socle livré, essais utilisateurs restants

Objectif : un nouveau venu comprend la préparation, démarre, retrouve les commandes et enregistre sa première séance sans assistance.

- ✅ Lecteur paysage livré par la PR 56 ; production `78b7877`, CI et vérification de publication réussies. Essai utilisateur sur tablette concluant le 7 octobre.
- ✅ PR 57 publiée : mise à jour visible depuis les écrans principaux, avec les protections existantes pendant séance, saisie, connexion vélo et entre onglets.
- ✅ PR 57 publiée : préparation en deux colonnes sur tablette paysage : programme et profil d’effort, réglages avant départ, bouton de lancement toujours accessible.
- ✅ PR 57 publiée : bilan cohérent : récapitulatif, mesures à vérifier, confirmation explicite avant sauvegarde ; champs conservés lors des rotations.
- ✅ PR 58 publiée : actualités éditoriales dans Plus, annonce discrète mémorisée par version importante, repères du lecteur avant le départ et lexique débutant (D+, BPM, RPM, watts, RPE, etc.) avec exemples.
- À suivre : évaluation du parcours de démarrage existant auprès de nouveaux utilisateurs.
- À suivre : adaptation progressive aux petits formats paysage, choix des mesures principales et accessibilité avec texte agrandi.

La PR 57 est publiée sur `36633cd` : 224 tests unitaires, 278 scénarios navigateur réussis et CI de main/vérification production vertes. Départ et confirmation visibles à 1024×768 et 960×600, saisies conservées après rotation, enregistrement/rechargement et protections PWA vérifiés.

La PR 58 est publiée sur `e65bf33` : 224 unités, 288 scénarios navigateur sans échec ni retry ; CI main et vérification production réussies. Nouveautés et lexique sont consultables dans Plus, aide et lexique avant le départ. Les essais de découverte avec de nouveaux utilisateurs restent à réaliser.


### Jalon B — Bêta privée fiable · lot actif

- ✅ PR 55 publiée sur `de6cfcf` : finalisation métier isolée et écriture locale confirmée avant fermeture du bilan/suppression de la reprise. Refus/réessai/rechargement vérifiés : 232 unités et 290 scénarios navigateur ; CI main et vérification production réussies.
- ✅ Protocole de [recette bêta](BETA-TEST.md) préparé ; essais physiques et retours utilisateurs à recueillir.
- Qualifier plusieurs combinaisons vélo/appareil/navigateur et afficher les capacités réellement disponibles.
- Éprouver interruption, reprise, reconnexion, enregistrement, export et restauration avec des utilisateurs extérieurs.
- ✅ Diagnostic de support livré par la PR 59 sur `b0818af` : aperçu exact, copie/export, repli manuel, champs personnels exclus. 236 unités et 296 scénarios navigateur réussis ; CI main et vérification production réussies.
- Rendre explicites mesures reçues, données manquantes et simulations.
- ✅ PR 60 publiée sur `9360ec8` : accessibilité des séances et WebKit. 236 unités et 334 scénarios navigateur (32 WebKit) réussis ; production vérifiée.
- ✅ PR 61 publiée sur `cb7cb15` : six défis chronométrés au départ lancé et score cadence V2 dissocié de la note ; 245 unités et 362 scénarios navigateur réussis, CI main et vérification production vertes. [Règles](TIMED-TRIALS.md).
- Retours utilisateur du 8 octobre : kilomètre lancé puis épreuve de calories concluants. Les autres formats et le nouvel affichage des mesures restent à éprouver ; le mode et l’appareil de l’essai calories ne sont pas précisés.
- ✅ PR 62 publiée sur `493f9f3` : vitesse instantanée, cadence, watts et BPM dans les défis ; vitesse moyenne au bilan et dans l’historique. 249 unités et 366 scénarios navigateur réussis ; CI main et vérification production réussies. Fraîcheur indépendante des champs, zéro/absence et petit écran vérifiés. Essai sur le vélo réel différé par l’utilisateur.
- ✅ PR 63 publiée sur `5e64624` : accessibilité du journal, Secteurs, Défis de parcours et Voyage ; 249 unités et 382 scénarios navigateur sans échec ni retry. CI main et vérification production réussies.
- ⏳ Lot actif : libellé « Score » sans numéro de version dans l’interface et les guides utilisateur ; accessibilité du profil et du guide de démarrage, protection des saisies et enregistrement du profil confirmé avant fermeture.
- À suivre : essais VoiceOver/Safari/Bluefy réels, audit des autres modales, contrastes et parcours complet de première utilisation. Regrouper les changements avant publication pour éviter les cycles de CI inutiles.

Passage au jalon suivant : plusieurs séances terminées par les testeurs, aucun blocage critique ni perte de données connue non corrigée. La CI ne remplace pas la recette physique.

### Jalon C — Usage durable

- Programme renouvelable après douze semaines et reprise après interruption, historique conservé.
- Bilans mensuels et de cycle ; enrichir le bilan hebdomadaire et les repères de ressenti déjà présents.
- Voyage V2 : continuité des carnets, étape suivante, reprise facile.
- Défis axés sur régularité, variété et maîtrise ; revue des programmes et règles de progression par un professionnel qualifié avant diffusion large.

Passage au jalon suivant : le produit accompagne plusieurs cycles et les retours après interruption sans remise à zéro ni accumulation de séances manquées.

### Jalon D — Ouverture publique

- Sauvegarde distante facultative d’abord ; compte facultatif puis synchronisation avec gestion des conflits et récupération.
- Présentation publique, démonstration, compatibilités, aide, historique des versions et canal de retours.
- Revue sécurité, confidentialité et droits des contenus ; modalités de support et modèle économique à décider.
- Évaluer une enveloppe native selon les limites constatées de Bluetooth, installation et arrière-plan.

L’ouverture publique reste un objectif, pas une annonce de disponibilité générale ni une promesse de compatibilité universelle. Aucun service cloud, paiement ou nouveau traitement de données n’est mis en place par le lot A.

## Principes de priorité

1. **Fiabilité avant volume** : aucun nouveau pack de contenu ne doit passer devant une régression de séance, de sauvegarde, de PWA ou de vélo connecté.
2. **Capacités avant marques** : le support matériel doit d'abord s'appuyer sur FTMS et les capacités réellement exposées, sans supposer qu'un nom commercial garantit un protocole.
3. **Compatibilité conservée** : les sauvegardes v3, historiques, parcours personnels, carnets et identifiants de récompenses existants restent lisibles.
4. **Validation réelle séparée de la simulation** : un test Playwright FTMS ne qualifie jamais un vélo physique, un navigateur mobile ou un comportement en arrière-plan.
5. **Progression durable** : le jeu ne doit pas pousser artificiellement la charge pour distribuer plus de points.

---

## P0 — Consolidation du produit

### P0.1 — Documentation et état de référence

**État : en cours dans le lot de consolidation du 7 octobre.**

- réécrire cette roadmap sur l'état réel du produit ;
- simplifier `PROJECT-STATE.md` en séparant l'état courant de l'historique ;
- harmoniser la référence matérielle TOPUTURE/TEB5 dans les textes utilisateurs ;
- enlever les mentions « à qualifier » devenues fausses tout en conservant les limites réellement non vérifiées ;
- conserver une distinction stricte entre télémétrie, pilotage, fréquence cardiaque, commandes vocales et fonctionnement en arrière-plan ;
- documenter les travaux ouverts et leurs critères de fin.
- ✅ installer un protocole de continuité indépendant des conversations : reprise depuis GitHub live, checkpoint daté et modèle de PR ;

**Terminé quand** README, roadmap, état de reprise, guide utilisateur et guide matériel ne se contredisent plus.

### P0.2 — Architecture multi-vélos

**État : phase A en cours — registre d’adaptateurs créé et qualification de marque sortie de l’interface.**

VéloQuest doit pouvoir accueillir plusieurs marques et modèles **lorsque leurs protocoles sont accessibles**. La voie principale est Bluetooth FTMS ; les protocoles propriétaires éventuels sont des adaptateurs optionnels et ne doivent jamais être devinés.

Le socle visé :

- un contrat `BikeAdapter` indépendant de l'interface — **premier registre FTMS préparé** ;
- découverte, connexion, télémétrie et contrôle séparés ;
- description normalisée des capacités : vitesse, cadence, distance, puissance, calories, fréquence cardiaque, résistance, contrôle ;
- profil de mappage entre l'échelle VéloQuest 1–32 et l'échelle réelle du vélo ;
- qualification centralisée par **adaptateur + modèle/capacités** ; la logique de nom n'est plus dispersée dans `VeloQuestApp.tsx` et devra ensuite devenir persistante/révocable ;
- FTMS générique comme premier adaptateur ;
- possibilité ultérieure d'ajouter des adaptateurs documentés pour des appareils non conformes ou partiellement conformes ;
- mode manuel toujours disponible.

Voir [Architecture des vélos connectés](CONNECTED-BIKES-ARCHITECTURE.md).

**Limite importante** : cette architecture peut supporter plusieurs modèles compatibles FTMS ou documentés. Elle ne garantit pas la compatibilité avec un appareil utilisant un protocole propriétaire inconnu ou inaccessible depuis le navigateur.

### P0.3 — Dette de `VeloQuestApp.tsx`

**État : engagé — vélo connecté, reprise et persistance locale extraits (PR 54 fusionnée). La PR 55 de finalisation des séances est publiée, avec protection contre les refus de stockage. Les écrans restent à découpler.**

Après la PR 52, le composant principal est descendu à environ 2 160 lignes. Le lot de persistance locale le ramène à environ 2 135 lignes en retirant l’hydratation et les écritures directes de `localStorage` du composant principal.

Ordre de découpage proposé :

1. ✅ contrôleur/hook de vélo connecté (`useBikeController`) ;
2. ✅ contrôleur de reprise et instantané de séance (`useSessionSnapshotController`) ;
3. ⏳ enregistrement et persistance : `useLocalPersistenceController` couvre l’état principal et les parcours personnels ; la finalisation est isolée et livrée par la PR 55 ; l’import/export et leurs dépendances restent à extraire ;
4. écrans Quête / Séances / Parcours / Suivi / Plus ;
5. lecteur de séance et panneau Bluetooth ;
6. suppression des dépendances croisées restantes.

Les règles métier doivent continuer à vivre dans `lib/`, pas dans les composants visuels.

### P0.4 — Recette physique complète TOPUTURE

**État : partiellement qualifié, recette globale restante.**

Déjà observé par l'utilisateur : connexion Bluefy, télémétrie, transfert de sauvegarde et effet physique de commandes de résistance sur l'exemplaire utilisé.

Reste à éprouver ensemble sur la version courante :

- reconnexion et récupération après interruption ;
- niveau reçu et niveau demandé sur plusieurs paliers ;
- activation automatique du contrôle qualifié ;
- boutons Alléger / Renforcer ;
- fréquence cardiaque lorsqu'elle est réellement transmise ;
- séance complète puis sauvegarde/rechargement ;
- commande vocale réelle dans Bluefy ;
- écran éveillé, arrière-plan, podcast et vidéo flottante.

Aucun de ces essais ne doit être généralisé à un autre modèle sans nouvelle qualification.

### P0.5 — Durcissement qualité

**État : engagé — garde-fous d'architecture et liens documentaires ajoutés à la CI.**

Conserver les contrôles actuels puis ajouter progressivement :

- ✅ garde-fou empêchant le retour des marques/protocoles dans `VeloQuestApp.tsx` et limitant sa croissance pendant le découpage ;
- ✅ vérification automatique des liens Markdown locaux ;
- ESLint / règles React et TypeScript ;
- contrôle d'accessibilité automatisé sur les écrans principaux ;
- couverture de tests et seuils raisonnables sur les modules métier critiques ;
- scénario de restauration d'une sauvegarde ancienne dans chaque migration ;
- audit de dépendances automatisé ;
- si stable, tests du parcours manuel sous WebKit en complément de Chromium.

---

## Lot ergonomie demandé — tablette paysage

**État : livré — PR 56 fusionnée, production `78b7877` vérifiée, CI réussie et essai réel utilisateur concluant.**

Tableau de bord de séance sur toute la fenêtre, consignes et parcours en colonnes, mesures et commandes en bas, détails secondaires sur demande. Portrait et petites fenêtres restent défilants. Le layout est isolé dans `SessionDashboard` et la carte observe ses dimensions ; aucune migration de données. Recette : 1024×768, 1180×820, 1280×800 et 960×600, rotation, vues, pause/reprise, sauvegarde, courses et télémétrie simulée. Voir [le guide du lecteur](READER-COMFORT.md).

---

## P1 — Programme longue durée

### P1.1 — Cycle après la semaine 12

**Priorité métier la plus élevée après le P0.**

La semaine 12 clôt aujourd'hui le premier cycle. Il faut concevoir une continuité explicite :

- bilan de fin de cycle ;
- choix d'un nouveau cap : régularité, endurance, paysages, performance mesurée ;
- nouveau cycle sans effacer l'historique ;
- semaines de relâche planifiées ;
- reprise après interruption ;
- objectifs recalculés à partir des disponibilités actuelles ;
- conservation des programmes découverte et séances libres.

Aucune progression de charge ne doit être automatique uniquement parce qu'un objectif de points n'est pas atteint.

### P1.2 — Charge et récupération

Ajouter des indicateurs simples et compréhensibles :

- charge basée sur durée et RPE ;
- tendance courte / moyenne durée ;
- fréquence des séances difficiles ;
- alerte de répétition d'efforts élevés ;
- suggestion de récupération ou séance facile.

Ces indicateurs restent des outils d'entraînement et non un diagnostic médical.

### P1.3 — Bilans de progression

Le bilan hebdomadaire, les habitudes et le débrief de séance existent déjà. Compléter avec :

- bilan mensuel ;
- bilan de cycle ;
- évolution des minutes, séances, régularité et RPE ;
- records comparables ;
- distance et dénivelé virtuels ;
- poids/tours uniquement lorsque l'utilisateur les renseigne ;
- découvertes, carnets et territoires parcourus.

### P1.4 — Voyage V2

- bouton « étape suivante » à l'arrivée ;
- enchaînement fluide d'un carnet ;
- reprise d'un voyage depuis Quête ;
- bilan final du carnet ;
- distinction permanente entre distance simulée et distance mesurée.

### P1.5 — Données multi-appareils

Étudier d'abord une **sauvegarde distante facultative**, puis une vraie synchronisation.

Avant toute implémentation :

- choisir authentification et stockage ;
- définir la source de vérité ;
- conflits entre deux appareils ;
- suppression/restauration ;
- GPX et carnets ;
- données hors connexion ;
- chiffrement et confidentialité ;
- réversibilité vers export JSON.

L'export/import local reste obligatoire même si un cloud apparaît.

---

## P2 — Immersion et contenu

Le produit possède déjà assez de contenu pour que ces ajouts passent après la maturation.

### Route des Grandes Alpes

Roselend, Izoard et étapes de liaison, en réutilisant les cols existants sans dupliquer leurs identifiants.

### Ardèche

Balazuc, villages, gorges et profils vallonnés à difficulté intermédiaire.

### Canal de Nantes à Brest V2

Le premier lot de quatre parcours existe. Étendre progressivement le voyage et ses carnets.

### Photos documentées

Augmenter la couverture des parcours majeurs avec les mêmes règles de droits, crédits et distinction entre trace et point de vue photographique.

### Ambiances sonores facultatives

Étudier mer, forêt, vent ou montagne avec :

- volume séparé ;
- aucune concurrence avec les consignes ;
- chargement facultatif ;
- coupure automatique en vue essentielle si nécessaire ;
- fonctionnement hors connexion documenté.

### Mode média compagnon

Améliorer l'usage avec podcast, musique et Picture-in-Picture avant d'envisager un lecteur vidéo intégré. Une intégration vidéo n'est justifiée que si elle résout un problème observé lors des essais réels.

### Maîtrise plutôt que multiplication des badges

Les nouveaux systèmes de récompense doivent privilégier :

- précision ;
- constance ;
- répétition maîtrisée ;
- découverte variée ;
- progression de records comparables.

Éviter d'ajouter des badges uniquement pour augmenter le catalogue.

---

## P3 — Évolutions structurelles possibles

### Enveloppe native

À étudier seulement si l'usage réel le justifie :

- Bluetooth iOS natif ;
- notifications ;
- meilleur comportement en arrière-plan ;
- HealthKit / Health Connect ;
- partage de fichiers plus fiable.

La PWA et le mode manuel restent le socle.

### Compte et produit multi-utilisateur

L’objectif de distribution est validé. Authentification et profils distants appartiennent au jalon D, après validation de la bêta privée ; le partage reste à spécifier.

---

## Backlog technique et contenu

Les jalons A à D ci-dessus déterminent l’ordre de livraison ; cette matrice conserve le détail des chantiers.

### Matrice historique

| Ordre | Lot | Résultat attendu |
| --- | --- | --- |
| 1 | Consolidation documentaire | Une seule vérité courante dans le dépôt |
| 2 | Architecture multi-vélos + découpage technique | Socle extensible, moins de logique de marque dans l'UI |
| 3 | Recette matérielle/PWA réelle | Liste courte de défauts réels, corrigés avant enrichissement |
| 4 | Durcissement CI/accessibilité | Régressions détectées plus tôt |
| 5 | Programme V2 après semaine 12 | Continuité sur plusieurs mois |
| 6 | Charge, récupération et bilans | Progression mieux expliquée |
| 7 | Voyage V2 | Carnets réellement continus |
| 8 | Sauvegarde distante / synchronisation | Passage propre entre appareils |
| 9 | Grandes Alpes / Ardèche / canal | Nouveau contenu après stabilisation |
| 10 | Immersion média et éventuel natif | Enrichissement basé sur l'usage réel |

## Contrôles obligatoires avant production

Sur le commit exact proposé :

```bash
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

Puis vérifier :

- la version réellement publiée via `/api/version` ;
- la conservation des données locales après rechargement ;
- l'import d'une sauvegarde existante ;
- le parcours utilisateur concerné sur mobile et ordinateur ;
- lorsque le lot touche Bluetooth, voix, veille ou PWA : un essai physique distinct de la CI.

## Règle de maintenance

Chaque lot terminé doit mettre à jour cette roadmap, `PROJECT-STATE.md` et la documentation utilisateur concernée. Les sections terminées peuvent être résumées dans l'historique ; elles ne doivent pas rester présentées comme des tâches ouvertes.
