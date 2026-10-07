# Roadmap VéloQuest

Actualisée le **7 octobre 2026** à partir de `main` `0c7077970a012bcf9af25072f397ccbd56518a2a`.

Cette roadmap remplace les listes historiques devenues obsolètes. Le produit dispose déjà d'un socle très riche : 44 séances, 84 parcours natifs, 38 balades faciles, 12 thèmes, 6 programmes, 22 campagnes/carnets et 77 badges. L'objectif n'est plus d'empiler les fonctionnalités, mais de consolider le produit, fiabiliser son usage réel, prolonger le programme au-delà de douze semaines et rendre le matériel connecté extensible à plusieurs vélos.

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

**État : engagé — vélo connecté, reprise et persistance locale sont extraits ; la PR 55 sort maintenant les règles de finalisation de séance.**

Après la PR 54, le composant principal est à environ 2 135 lignes. Le lot de finalisation le ramène à environ 2 083 lignes en déplaçant dans `lib/session-completion.ts` les règles de durée, métriques, achèvement, records, défis, XP et Voyage.

Ordre de découpage proposé :

1. ✅ contrôleur/hook de vélo connecté (`useBikeController`) ;
2. ✅ contrôleur de reprise et instantané de séance (`useSessionSnapshotController`) ;
3. ⏳ enregistrement et persistance :
   - ✅ état principal et parcours personnels dans `useLocalPersistenceController` ;
   - ⏳ finalisation métier de séance dans `buildSessionCompletion` (PR 55) ;
   - import/export et orchestration résiduelle à extraire si cela réduit réellement le couplage ;
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

Créer :

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

Authentification, profils distants et partage ne deviennent prioritaires que si VéloQuest évolue d'un outil personnel vers un produit réellement distribué.

---

## Matrice d'exécution

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
