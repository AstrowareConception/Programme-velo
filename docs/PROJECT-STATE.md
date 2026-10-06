# État de reprise VéloQuest — actualisé le 5 octobre 2026

## 6 octobre 2026 — vignoble d’Alsace et extension des photos

Lot préparé depuis main `58a8769bab262903918757bdbe9c29306476d389` (correctif PWA de la PR 34 livré et vérifié en production). Neuf parcours alsaciens : six étapes continues et trois courts formats distincts, deux carnets (770 XP uniques au total) et deux trophées. Catalogue : 80 parcours, 35 balades, 11 thèmes, 22 carnets et 74 badges. Les anciens parcours et objectifs restent identiques. [Trace, relief et règles](ALSACE-VIGNOBLE.md).

Cinq nouvelles photos créditées : Ventoux, Galibier, Estérel, Obernai et Eguisheim. Dix images, dix-sept parcours illustrés, 574 734 octets facultatifs ; compteur PWA et bouton de préparation suivent le manifeste. [Sources et points de vue](LANDSCAPE-PHOTOS.md). Les contrôles exacts, PR, fusion et version publique seront portés dans l’état de reprise externe après observation. La PR 29 matérielle reste séparée. Nantes constitue la prochaine piste de contenu, sans lot engagé ici.


## Construction PWA sur Vercel

La PR 33 a passé les quatre contrôles sur `b390adad97b544c6c172bc7822b87e3d2f7fcfdf` (140 unités, 182 scénarios navigateur), puis a été fusionnée dans main `906c30081ba127726c3ef8a09be2dcf4d3329a6d`, dont la CI a également réussi. Le build Vercel a toutefois échoué avec ENOENT ; la production précédente `703d769` est restée active. L’erreur exacte a été reproduite avec l’adaptateur officiel : Next.js 16.3 y conserve le HTML dans le cache de routes et le paquet `.next/output`, au lieu de `.next/server/app/index.html`.

La correction utilise les fichiers du paquet Vercel, écrit le worker dans les deux destinations et retrouve les chunks préparés malgré le paramètre `?dpl` ajouté par Next.js. Tests de construction des deux formats, refus d’un paquet incomplet et vérification hors réseau avec ce paramètre ajoutés. Les références finales de la correction, les quatre contrôles sur son SHA exact, la CI et la version publique observée seront consignés dans l’état de reprise externe ; cet échec de déploiement ne constitue pas une livraison du lot PWA.

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

## Formats courts, Route Napoléon et programmes découverte

Le lot suivant ajoute neuf extraits GPX de 15–30 minutes et huit sections routières de la Route Napoléon, de Golfe-Juan à Gap. Total : 55 parcours, 22 balades, neuf thèmes, 16 campagnes/carnets, 59 badges. Trois programmes découverte, ordre libre, bonus uniques et recalcul après suppression. Six nouveaux modèles de séances/bonus ; filtre de durée simulée combinable.

Fiches harmonisées : paysage, points d’intérêt et lieux. Les quatorze profils historiques sont conservés, leurs repères explicitement indicatifs. Les sept balades initiales reçoivent des lieux sans changer leurs profils. La Route Napoléon utilise uniquement les points de trace du GPX CRT PACA, altitudes IGN lissées ; au-delà de Gap reste à préparer. [Sources, portée et règles](DISCOVERY-PROGRAMMES.md). Cache PWA v10.

Couverture préparée : 101 tests unitaires, 116 cas navigateur (58 mobile, 58 ordinateur). Contrôles obligatoires sur le commit exact proposé ; CI, fusion et production seront consignées dans le document de reprise externe après observation.

## Règles de données

Clés inchangées : `veloquest:v1`, `veloquest:custom-routes:v1`, `veloquest:active-session:v1`. Backups v3, v2 et anciens états conservés. Le nouvel indicateur optionnel `completedSegment` identifie les tentatives de secteur incomplètes ; son absence dans un ancien historique reste compatible.

Une suppression recalcule les indicateurs depuis les séances restantes. Les XP des autres séances restent ceux enregistrés. Les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme complètes ; les secteurs sont toujours exclus des campagnes.

## Validation requise et prochaine étape

Avant fusion : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` sur le commit exact de la PR, puis contrôle visuel mobile/ordinateur. Vérifier ensuite la CI de `main`, le déploiement Vercel, `/api/version` et l'URL publique.

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/TEB5-BLUETOOTH-VALIDATION.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

Le document d'état externe livré après déploiement complète ce point avec les commits finaux, PR et résultats réellement observés, sans anticiper la publication.

## Route Napoléon jusqu’à Grenoble

Six étapes ajoutent Gap–La Fare (col Bayard), La Fare–Corps, Corps–La Mure, La Mure–Laffrey, Laffrey–Vizille et Vizille–Grenoble par Brié/Eybens. Catalogue : 61 parcours, 22 balades, neuf thèmes, 17 campagnes/carnets et 62 badges. Le thème Route Napoléon contient 14 étapes ; le nouveau carnet de six étapes apporte 700 XP uniques. Dauphiné en poche (3/6) et Traversée impériale (14/14) ne donnent pas d’XP supplémentaire. Les huit étapes, 900 XP et trophées précédents restent inchangés.

Une seule trace nommée du GPX Michelin Grenoble–Embrun, inversée et découpée ; altitudes IGN lissées. Le générateur refuse les mélanges de traces et un checksum changé. Jonctions internes vérifiées ; départ à Gap situé environ 260 m de l’ancienne arrivée, sans liaison ajoutée. Descente Laffrey–Vizille conservée, sans inventer une montée. [Sources, distances et limites](DISCOVERY-PROGRAMMES.md). Cache PWA v11 ; aucun changement de clé locale. Les quatre contrôles sur le SHA proposé, les vérifications mobile/ordinateur et les références de fusion/déploiement sont consignés dans le document externe d’état de reprise une fois terminés.

## Estérel et petites escales Napoléon

Lot préparé depuis main `e9a9738ffb818569e769000106a6adb6f08a3fec` : dix parcours, 71 au total, 29 balades 1/5, dix thèmes, 20 campagnes/carnets et 67 badges. GPX touristique Estérel séparé en trois étapes côtières et un retour intérieur, plus deux courts extraits ; quatre formats courts issus des sources Napoléon existantes. Tous les nouveaux profils utilisent IGN RGE ALTI lissé. [Détails, sources et règles](ESTEREL-ESCALES.md).

Trois carnets (600/100/180 XP uniques), Roches rouges (3 étapes côtières) et Aigle de poche (2 escales sur 4). Les formats courts ne terminent pas les parents. Les anciens carnets Napoléon, trophées courts et PACA restent fixes. Les nouvelles balades restent exclues des compteurs de reliefs. Aucun changement de stockage ; cache PWA v12. [Roadmap](ROADMAP.md) actualisée : mode Voyage, Alsace, canal de Nantes à Brest, Grandes Alpes puis carnet personnel. Les références exactes des tests, de fusion et de production sont consignées dans l’état de reprise externe une fois vérifiées.

## Confort du lecteur et médias personnels

Lot fondé sur main `d440084389c381ea3d12d67611004f4f6ac4871a` (PR 28 livrée). Vue essentielle ou complète, niveau et temps côte à côte, commandes accessibles ; carte/profil/détails masqués uniquement dans la vue essentielle, lieux et chrono de course conservés. Réglages dans Plus, préparation et lecteur : bips/voix, volume, fréquence, test explicite et préavis facultatif dix secondes sur segments minutés. Les annonces utilisent la calibration globale et l’ajustement du coach. Un contexte audio est réutilisé pendant la séance puis libéré.

Le maintien de l’écran affiche la demande, l’accord, le refus, l’absence ou l’interruption. Libération à la pause/fin/fermeture ; retour visible et relance manuelle ; accord tardif après fermeture relâché. Rappel au retour d’arrière-plan. Les préférences facultatives sont validées à l’import, compatibles avec les anciens états et exportées en v3 ; historiques, métriques, défis, courses et reprise ne changent pas. Cache PWA v13, sans promesse de fonctionnement continu en arrière-plan.

[Guide pratique](READER-COMFORT.md), README et roadmap actualisés. Aucun lecteur vidéo intégré ni mode Voyage continu dans ce lot. Les tests de voix et de maintien simulent les API ; casque, podcast/vidéo, iPhone/Android réels et TEB5 restent à éprouver. Contrôles obligatoires sur le SHA proposé, CI, fusion et version publique seront consignés dans l’état de reprise externe après observation. La PR 29 de diagnostic matériel reste distincte et ouverte, sans qualification du vélo physique.

## 5 octobre 2026 — Voyage par portions

Lot fondé sur main `f1eea5a61505dea0063a178485adff847398a077` (PR 30, confort du lecteur). Préparation sur chaque parcours natif ou GPX, portions 15/30/45/60 minutes, prochain passage depuis le premier kilomètre manquant, reprise depuis Quête. Carte, profil, résistance et repères du parcours original conservés ; position temporelle simulée à 15 km/h, mesures du vélo distinctes. Un parcours à la fois, sans raccord automatique Napoléon/Estérel.

Journal avec bornes et achèvement de portion ; union des passages, sans cumul des chevauchements ni validation individuelle de route. XP du parcours une seule fois en Voyage, à son achèvement, sans double bonus avec une réalisation classique antérieure. Recalcul après suppression ; campagnes et palmarès suivent la couverture entière. Trois trophées ajoutés, 70 badges au total, 71 parcours inchangés. Métadonnées Voyage facultatives, export/import JSON v3 et colonnes CSV ; reprise v1 compatible avec les anciennes séances. Cache PWA v14. [Guide Voyage](VOYAGE.md).

Contrôles exacts, PR, fusion et version publique seront consignés dans l’état de reprise externe après observation. La PR 29 reste distincte pour les diagnostics du vélo ; la simulation temporelle et FTMS ne qualifie pas le TOPUTURE physique. Photos documentées et carnet composé de plusieurs étapes restent à développer.

## 5 octobre 2026 — photos azuréennes documentées

Lot préparé depuis main `50304a6` (Voyage livré via PR 31). Cinq photos locales de Cagnes-sur-Mer, Antibes, Golfe-Juan, Cannes et Menton sur huit parcours existants ; 262 746 octets au total, moins de 100 000 par image. Attribution, date, source, licence et limites géographiques visibles. WebP 960 px sans recadrage, métadonnées retirées ; originaux et dérivés identifiés par SHA-256. [Sources et parcours](LANDSCAPE-PHOTOS.md).

Galerie fermée et sans image au départ, navigation d’un lieu à l’autre, suivi du dernier repère illustré en kilomètres absolus pendant l’effort et Voyage, première vue à venir signalée. La navigation libre n’avance aucune séance. Images indisponibles : texte et crédits conservés, relance possible. Préférence facultative `showRoutePhotos`, sauvegardes v2/v3 compatibles, aucun changement d’historique ou de progression. La vue essentielle masque les galeries pendant l’effort. Aucun rapprochement automatique avec un GPX inconnu. Cache v15 ; images non consultées et cartes externes sans garantie hors connexion.

Le catalogue reste à 71 parcours, 29 balades, dix thèmes, 20 campagnes et 70 badges. La PR 29 matérielle demeure distincte. Les quatre contrôles sur le commit exact, les vues mobile/ordinateur et la production doivent être vérifiés avant d’inscrire la livraison dans l’état de reprise externe. Suite : disponibilité hors connexion et mise à jour PWA accompagnée, puis extension photographique documentée et carnets multi-étapes. Le TOPUTURE physique n’est toujours pas qualifié.

## Lot PWA du 5 octobre 2026

Service worker généré à partir du build exact, empreintes des fichiers essentiels et caches distincts par version. Plus affiche la disponibilité vérifiée et le compteur des cinq photos ; préparation et réparation explicites. Nouvelle version en attente sans skipWaiting automatique ; accord de tous les onglets au repos, lecteur ouvert/pause/résultat/formulaire ou échec de sauvegarde bloquants. Verrou temporaire puis rechargement accompagné et reprise sauvegardée conservée. Une précédente version de cache reste conservée. Données locales et catalogue inchangés, aucun badge ni XP ajouté. [Guide PWA](PWA-OFFLINE.md).

Tests navigateur en production ; service workers isolés pour les simulations de métier et activés pour les scénarios PWA réels. Les quatre contrôles sur le SHA exact, les vues mobile/ordinateur et la version publique sont à observer avant d’inscrire la livraison dans l’état externe. Prochaine priorité : autres photos documentées et packs de parcours. Matériel et iPhone/Android réels restent à valider.
