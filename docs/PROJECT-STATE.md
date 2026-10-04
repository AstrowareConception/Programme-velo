# État de reprise VéloQuest — 4 octobre 2026

## Références

- Dépôt : https://github.com/AstrowareConception/Programme-velo ; référence `main`.
- Production : https://programme-velo.vercel.app/ ; projet Vercel `programme-velo`.
- Matériel : TOPUTURE TEB5, consignes sur 1–32 niveaux, mode manuel conservé.

## Campagnes intégrées

La PR 19 a été corrigée au commit `45d1ba1720aa6284071581b395a0af3f4cba2fb2` : coches par route réellement achevée, quatre badges, bonus unique, exclusions des tentatives incomplètes et des secteurs, compatibilité des anciens historiques. Les quatre contrôles ont réussi dans la CI 37186992622 sur ce commit exact. Fusion dans `main` : `d882c5abc7198280e6bdfe4c2843883f3bbc6a62`.

Les cinq étapes accessibles à 2/5–3/5 étaient déjà présentes et ont été conservées.

## Lot de réconciliation des opérations quotidiennes

La PR 7 (`8aac612eebc4edcff038a0395250cb46fada4438`) était conflictuelle. Ses fonctions utiles ont été adaptées au lecteur actuel dans la PR 20 : date/heure locale de séance, mesures datées, suppressions, télémétrie enrichie et guides. Les courses, défis et reprise de séance sont conservés. La PR 20, au commit `e87c2ce6e63f5de0558f2d359bbc356f3a8e755b`, a été validée par la CI 37187520845 et fusionnée dans `main` au commit `5be593c9fb3fe54021c7de68f42a573218ad9539`. Les quatre contrôles ont été rejoués avec succès sur ce main final : 65 tests unitaires, 42 tests navigateur, typecheck et build. La production a été vérifiée par Vercel et `/api/version`. La PR 7 est fermée comme remplacée.

Corrections complémentaires : semaines calendaires à travers le changement d'heure, remise à zéro du mode de course lors de la saisie libre, exclusion des courses/secteurs incomplets des records, énergie de séance relative au compteur FTMS, lecture prudente des paquets tronqués, version de build dans Plus et `/api/version`, dépendances verrouillées et vérification du SHA de production après CI.

## Lot balades et découverte

La branche `feat/gentle-rides`, fondée sur `5be593c`, ajoute sept balades à 1/5, portant le catalogue à 21 parcours. Les traces officielles sont documentées dans `docs/SCENIC-ROUTES.md`, avec altitudes GPX ou IGN, profils lissés à 500 m et provenance SHA-256. Le D+ est calculé sur le profil représenté, sans prétendre égaler une fiche touristique ou un relevé indépendant.

Ajouts : filtre et raccourci Balades, préparation compacte sur mobile, paysages dans les fiches et le lecteur, carnets Au fil de l’eau / Échappées patrimoine (450 / 300 XP uniques), trois trophées de diversité et collection La France en douceur. Les balades sont faciles, RPE 2–4, niveaux de base 4–10, avec pauses libres ; leur longueur reste réelle dans la simulation, notamment environ 140 minutes pour le Der.

Trois séances guidées de 25, 30 et 40 minutes et un bonus de 12 minutes complètent le catalogue. Le bonus partage le plafond existant de 60 XP par semaine. Les badges historiques de parcours conservent leurs identifiants et validations, avec libellés de relief ; les balades ne les alimentent pas. Le palmarès parle de parcours distincts plutôt que de sommets.

Le lecteur positionne correctement la fin du dernier segment lorsqu’une reprise de minuterie saute plusieurs segments. Une couverture navigateur vérifie une arrivée complète après une grande avance du temps, la persistance, les carnets, la suppression et la reprise incomplète. Le cache PWA passe à v5 et l’indicateur Next.js de développement, qui masquait la navigation mobile en tests, est désactivé.

Le présent fichier décrit le lot à valider sur son commit exact. Le document d’état externe doit consigner son SHA, sa PR, les résultats finaux et la version publique réellement constatée après intégration.

## Livraison et extension du littoral

Le lot balades de la PR 21 a été validé au commit `4badd9bef6e8c10e7e341f29252fcea197934f8a`, CI 37190254086 réussie, puis fusionné dans main `1668a7cadbed79aa81f6b0f8eb8f1c5c85c473ba`. Les quatre commandes ont aussi passé sur ce SHA final : 71 tests unitaires, 50 tests navigateur, typecheck et build. Production Vercel READY, `/api/version` et écran Plus concordants.

L’extension `feat/azure-coastal-ride` ajoute Cagnes-sur-Mer → Cannes (23,8 km, environ 95 min) et Golfe-Juan → Cannes (7,5 km, environ 30 min), tous deux à 1/5. Des repères calculés sur le GPX officiel accompagnent villes et quartiers dans les fiches, la préparation et le lecteur, avec état restauré après pause. Le GPX retour incohérent a été rejeté ; le tronçon du GPX aller est inversé uniquement pour la simulation. Les données, sources et limites sont documentées dans SCENIC-ROUTES.

Le marqueur de carte et le fantôme utilisent désormais les distances cumulées plutôt que le nombre de points GPS. Les repères azuréens et la carte partagent les kilomètres du GPX original ; une couverture vérifie le placement à Antibes et des géométries de densité inégale.

Le catalogue atteint 23 parcours dont 9 balades. Atlas conserve son seuil de 7 découvertes ; la collection fondatrice et les deux carnets gardent leurs parcours pour préserver les récompenses acquises. Le format court ne valide pas la traversée complète. Les sept profils précédents sont inchangés et le cache passe à v6. La PR 22 a été validée au commit `7283926da26730dc78e04df55c16fd787be1d401`, CI 37192039129 réussie, puis fusionnée dans main `744f0b0b82821512708695e7d07d57c8c4a1738a`. Les quatre contrôles passent également sur ce main : 76 tests unitaires, 54 tests navigateur, typecheck et build. Production READY, SHA public et Plus vérifiés.

## Lot démarrage accompagné

La branche `feat/progressive-onboarding`, fondée sur main `744f0b0`, prépare quatre étapes courtes : profil facultatif et envie, niveau de pratique / temps / fréquence, mode manuel et RPE, première séance douce de 15 minutes. Les mesures corporelles sont proposées plus tard ; une sauvegarde peut être restaurée dès l’accueil. Le guide conserve son étape au rechargement et utilise un dialogue natif avec focus, clavier, sortie libre et retour aux étapes précédentes.

La Quête simplifiée met la prochaine action en avant et replie le tableau de bord avancé. Trois repères se recalculent depuis les séances complètes enregistrées d’au moins 10 minutes, sans bonus, secteur, tentative explicitement incomplète ou date future. Après trois séances, les choix du jour apparaissent ; le coach favorise les formats faciles pendant la découverte et évite les formats difficiles avant six réalisations pour un débutant accompagné. Le ressenti récent élevé ramène les propositions aux formats faciles. L’envie d’endurance oriente ensuite le choix parmi les séances compatibles. Les balades restent accessibles librement.

Le cap personnel de 2/3/4 séances de 15/25/30 minutes n’attribue pas de nouvelle récompense et ne modifie pas les missions XP du programme de douze semaines. Aucun compteur de repères n’est stocké : suppression et import recalculent l’accompagnement. L’indicateur optionnel `completedWorkout` distingue les séances guidées réellement arrivées au bout dans le modèle de l’application. Les saisies manuelles et anciens historiques sans marqueur restent reconnus, sans preuve physique indépendante.

Les comptes existants sans champ `guidance` conservent leur interface. Plus permet de revoir le guide sans réinitialiser les historiques, mesures, dates, favoris, réglages ou reprise. Le champ facultatif versionné `guidance` est conservé dans le JSON v3 ; les imports v2 et anciens restent compatibles. Les choix du jour restent temporaires, le cap personnel et les brouillons du guide sont durables. Le cache PWA passe à v7.

Couverture ajoutée : brouillon/rechargement/retour, mode manuel sans mesures, préparation/pause/reprise/arrivée/RPE, exclusion d’une séance interrompue et retour après suppression, anciens profils et sauvegardes, progression jusqu’aux choix du jour et exploration des balades. Les quatre commandes doivent réussir sur le commit exact proposé avant intégration ; le document externe consignera SHA, PR, CI et version publique observée après livraison.

## Règles de données

Clés inchangées : `veloquest:v1`, `veloquest:custom-routes:v1`, `veloquest:active-session:v1`. Backups v3, v2 et anciens états conservés. Le nouvel indicateur optionnel `completedSegment` identifie les tentatives de secteur incomplètes ; son absence dans un ancien historique reste compatible.

Une suppression recalcule les indicateurs depuis les séances restantes. Les XP des autres séances restent ceux enregistrés. Les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme complètes ; les secteurs sont toujours exclus des campagnes.

## Validation requise et prochaine étape

Avant fusion : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` sur le commit exact de la PR, puis contrôle visuel mobile/ordinateur. Vérifier ensuite la CI de `main`, le déploiement Vercel, `/api/version` et l'URL publique.

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/TEB5-BLUETOOTH-VALIDATION.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

Le document d'état externe livré après déploiement complète ce point avec les commits finaux, PR et résultats réellement observés, sans anticiper la publication.
