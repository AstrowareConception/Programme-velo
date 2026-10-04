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

Les comptes existants sans champ `guidance` conservent leur interface. Plus permet de revoir le guide sans réinitialiser les historiques, mesures, dates, favoris, réglages ou reprise. En présence d’une séance interrompue, le guide s’ouvre, conserve le snapshot et propose de la retrouver ; il ne lance pas une nouvelle séance à sa place. Une couverture vérifie une course chronométrée déjà interrompue, la réouverture du guide, le rechargement et la reprise du chrono. Le champ facultatif versionné `guidance` est conservé dans le JSON v3 ; les imports v2 et anciens restent compatibles. Les choix du jour restent temporaires, le cap personnel et les brouillons du guide sont durables. Le cache PWA passe à v7.

Couverture ajoutée : brouillon/rechargement/retour, mode manuel sans mesures, préparation/pause/reprise/arrivée/RPE, exclusion d’une séance interrompue et retour après suppression, anciens profils et sauvegardes, progression jusqu’aux choix du jour et exploration des balades. Les quatre commandes doivent réussir sur le commit exact proposé avant intégration ; le document externe consignera SHA, PR, CI et version publique observée après livraison.

## Livraison du démarrage accompagné et installation active

Le démarrage accompagné a été livré par la PR 23 : commit proposé `ce3138f80dfb06643a3ac5bfc04757c790a1b602`, CI 37194554311 réussie, fusion `709e8e3879269404bc8fd9bbbff2329492040058`. Les quatre commandes passent sur les deux SHA : 82 tests unitaires et 68 tests navigateur. La production READY, `/api/version` et Plus concordent.

La branche `feat/actionable-installation` transforme tout le cadre de Plus en bouton accessible. Un fournisseur monté dès l’accueil conserve `beforeinstallprompt` avant l’ouverture de Plus et entre les onglets. Le clic appelle `prompt()` dans l’action utilisateur ; chaque événement est consommé une seule fois, même après annulation. Double clic, rejet et invitation tardive sont gérés. L’acceptation est distinguée de `appinstalled` ; lancement autonome et installation pendant la visite actualisent le cadre.

Sans invitation, un dialogue natif présente des étapes pour iPhone/iPad (y compris mode bureau), Safari Mac, Android, Edge et Chrome, ou un menu générique. Échap et le bouton de fermeture rendent le focus au cadre. Aucune API ne permet de forcer la fenêtre native lorsque le navigateur ne la fournit pas. Aucun historique ni réglage n’est écrit par cette fonctionnalité. Le manifeste ajoute deux icônes PNG 192/512, rendues depuis le même dessin que le SVG et prégénérées au build ; leur disponibilité, type, signature et dimensions sont vérifiés. Cache PWA v8.

Les tests simulent les événements et les identités de navigateur dans Chromium sur mobile et ordinateur. Ils vérifient le contrat de l’interface, pas une installation réelle sur Safari/iPhone ou Android. Les quatre contrôles sur le SHA exact, la CI, la fusion et la production seront consignés dans le document d’état externe après vérification.

## Installation livrée et extension du catalogue

L’installation active est intégrée par la PR 24 (`9e8b28f41118868524ad37198f69c32b5e74e1f7`, CI 37196952419 réussie), fusionnée en `12c289160794fa6c713983422fe72564ed8b65f4`. Les quatre commandes ont été exécutées sur ces deux commits : 82 tests unitaires et 92 tests navigateur. Vercel READY, `/api/version` et Plus concordaient. Un incident local de cache Next ENOTEMPTY a été résolu avant fusion, sans changement du SHA. Les essais ne prouvent pas une installation complète sur les appareils physiques.

Le lot `feat/atlas-france-paca`, fondé sur ce main, ajoute quinze GPX officiels documentés : dix destinations PACA, Camargue gardoise, Bretagne, Somme, Loire et Alsace. Catalogue : 38 parcours, 14 balades, huit thèmes, 13 campagnes/carnets. Sept nouveaux objectifs attribuent un bonus unique ; six trophées de variété n’ajoutent pas de XP. Les anciennes destinations, exigences, seuils Atlas et XP de campagne restent inchangés.

Les repères sont projetés sur les GPX et utilisent leurs kilomètres cumulés. Les nouveaux tracés gardent les passages réels, leurs altitudes lissées et leur SHA-256 ; limites et sections sont dans `docs/EXPLORATION-ROUTES.md`. La Bonette s’arrête au col sans boucle de la cime ; la Basse Corniche passe par Èze-sur-Mer/Monaco, la Grande Corniche suit un autre tracé. Le lecteur annonce l’arrivée propre à chaque parcours, et non systématiquement la Croisette. Recherche par lieux et accents normalisés. Les campagnes se déplient à la demande et se filtrent.

La couverture comprend 89 tests unitaires et 104 cas navigateur, 52 sur chaque format. Elle contrôle profils/lieux, thèmes, objectifs réels dans le désordre, répétitions, suppression, sauvegardes, secteurs exclus et conservation des mesures/favoris/reprise. Les quatre contrôles sur le commit exact, la CI, la fusion et la production sont consignés dans le document externe après livraison. Cache PWA v9 ; aucune dépendance ni clé locale ajoutée.

## Règles de données

Clés inchangées : `veloquest:v1`, `veloquest:custom-routes:v1`, `veloquest:active-session:v1`. Backups v3, v2 et anciens états conservés. Le nouvel indicateur optionnel `completedSegment` identifie les tentatives de secteur incomplètes ; son absence dans un ancien historique reste compatible.

Une suppression recalcule les indicateurs depuis les séances restantes. Les XP des autres séances restent ceux enregistrés. Les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme complètes ; les secteurs sont toujours exclus des campagnes.

## Validation requise et prochaine étape

Avant fusion : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` sur le commit exact de la PR, puis contrôle visuel mobile/ordinateur. Vérifier ensuite la CI de `main`, le déploiement Vercel, `/api/version` et l'URL publique.

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/TEB5-BLUETOOTH-VALIDATION.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

Le document d'état externe livré après déploiement complète ce point avec les commits finaux, PR et résultats réellement observés, sans anticiper la publication.
