# État de reprise VéloQuest — actualisé le 5 octobre 2026

## 6 octobre 2026 — résistance et fréquence cardiaque après connexion Bluefy

La PR 38 a été fusionnée et publiée dans main `39af4b93c5b69c5692e52be2a2969eebce40ffef`, vérifié via /api/version. L’utilisateur confirme maintenant la connexion Toputure TBE5 et la télémétrie dans VéloQuest/Bluefy. Capture : 69 rpm, 17,8 km/h, puissance diffusée 13 W, niveau affiché 0,6 alors que le vélo est au niveau 6, BPM 0. La console physique affiche pourtant 93, 95, 88 BPM lorsque les poignées sont tenues. Cela ne prouve pas encore que le service 180D émet ces valeurs, ni la commande physique depuis VéloQuest.

Ce lot corrige la division par dix dans Indoor Bike Data (la plage et les commandes de résistance gardent leur encodage distinct). Ajout d’une souscription facultative au service Heart Rate 180D / mesure 2A37 avec UUID canoniques, formats 8/16 bits, prise en compte de la perte de contact, expiration après dix secondes, nettoyage à la déconnexion. L’échec ou le délai du service cardiaque n’interrompt pas FTMS. Les zéros FTMS ne remplacent pas une mesure cardiaque séparée récente ; zéro sans mesure est affiché comme indisponible. Aucun facteur n’est appliqué aux watts transmis.

TypeScript et 188 tests unitaires réussis localement. Validation navigateur mobile/ordinateur et build requis avant fusion. Essai physique restant : niveau 6 affiché 6 ; BPM suivant la console en tenant les poignées ; contrôle physique de résistance toujours à confirmer dans VéloQuest.

## 6 octobre 2026 — Bluefy et UUID canoniques

Correctif préparé depuis main `d1fa26957b24b4e6c1d3f714d8235749d094dd0b` (PR 37). Sur iPhone, le test Google indépendant échoue avant sélection avec `0x1826` (nombre JavaScript, rejet brut `2`), mais découvre les services et caractéristiques avec le champ vide ou l’UUID complet sous forme de texte. Captures utilisateur : service 1826, 2ACC et 2AD6 READ, 2AD2 NOTIFY, 2AD9 WRITE/INDICATE. Ce résultat valide la découverte dans Bluefy, pas encore le contrôle depuis VéloQuest. Le test natif antérieur avait permis un changement physique de résistance sur Toputure ; le test FTMS sur Sport02 n’en avait pas produit.

La connexion et l’inventaire transmettent désormais des UUID complets textuels à requestDevice, getPrimaryService et getCharacteristic. Les autorisations de services restent explicites ; aucune commande ni plage de résistance n’est modifiée. Simulateurs navigateur et unités exigent ce format pour éviter une régression. TypeScript et 183 tests unitaires passent localement ; build réussi. Validation navigateur locale empêchée par le téléchargement Chromium tronqué ; validation mobile/ordinateur à obtenir en CI avant fusion. Le timeout Windows reste un problème distinct non résolu par ces observations.

## 6 octobre 2026 — vignoble d’Alsace et extension des photos

Lot préparé depuis main `58a8769bab262903918757bdbe9c29306476d389` (correctif PWA de la PR 34 livré et vérifié en production). Neuf parcours alsaciens : six étapes continues et trois courts formats distincts, deux carnets (770 XP uniques au total) et deux trophées. Catalogue : 80 parcours, 35 balades, 11 thèmes, 22 carnets et 74 badges. Les anciens parcours et objectifs restent identiques. [Trace, relief et règles](ALSACE-VIGNOBLE.md).

Cinq nouvelles photos créditées : Ventoux, Galibier, Estérel, Obernai et Eguisheim. Dix images, dix-sept parcours illustrés, 574 734 octets facultatifs ; compteur PWA et bouton de préparation suivent le manifeste. [Sources et points de vue](LANDSCAPE-PHOTOS.md). Les contrôles exacts, PR, fusion et version publique seront portés dans l’état de reprise externe après observation. La PR 29 matérielle reste séparée. Nantes constitue la prochaine piste de contenu, sans lot engagé ici.


## Construction PWA sur Vercel

La PR 33 a passé les quatre contrôles sur `b390adad97b544c6c172bc7822b87e3d2f7fcfdf` (140 unités, 182 scénarios navigateur), puis a été fusionnée dans main `906c30081ba127726c3ef8a09be2dcf4d3329a6d`, dont la CI a également réussi. Le build Vercel a toutefois échoué avec ENOENT ; la production précédente `703d769` est restée active. L’erreur exacte a été reproduite avec l’adaptateur officiel : Next.js 16.3 y conserve le HTML dans le cache de routes et le paquet `.next/output`, au lieu de `.next/server/app/index.html`.

La correction utilise les fichiers du paquet Vercel, écrit le worker dans les deux destinations et retrouve les chunks préparés malgré le paramètre `?dpl` ajouté par Next.js. Tests de construction des deux formats, refus d’un paquet incomplet et vérification hors réseau avec ce paramètre ajoutés. Les références finales de la correction, les quatre contrôles sur son SHA exact, la CI et la version publique observée seront consignés dans l’état de reprise externe ; cet échec de déploiement ne constitue pas une livraison du lot PWA.

## Références

- Dépôt : https://github.com/AstrowareConception/Programme-velo ; référence `main`.
- Production : https://programme-velo.vercel.app/ ; projet Vercel `programme-velo`.
- Matériel : TOPUTURE reçu le 6 octobre 2026, référence exacte et FTMS à qualifier ; TEB5 est une hypothèse historique. Consignes sur 1–32 niveaux, mode manuel conservé. Voir `HARDWARE-COMPATIBILITY.md`.

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

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/HARDWARE-COMPATIBILITY.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

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


## 6 octobre 2026 — préparation de la recette du TOPUTURE reçu

Térence confirme la réception du vélo le 6 octobre. Le lot Alsace/photos est déjà intégré dans main `c6e51578895e63931738118589a36f6bf143dcc2` (PR 35). La demande de tester désormais le matériel étend le périmètre à l’intégration de la PR 29 : conflits du lecteur essentiel et du guide réconciliés en conservant Voyage, photos et PWA.

Le diagnostic des services standards ne commande rien et exporte son JSON local explicitement. La procédure courte apparaît dans Plus. La connexion FTMS lit les capacités réellement annoncées ; pas de repli 1–32. Le laboratoire prépare le minimum et un pas voisin sans écriture implicite, affiche vitesse/distance et heure du dernier paquet, évite les commandes concurrentes et expose les refus dans Plus. Les délais de connexion sont bornés et les connexions tardives refermées. Une mise à jour PWA attend la fin du diagnostic ou la déconnexion Bluetooth.

Aucun exemplaire physique n’a encore été qualifié par cette préparation. [Recette](HARDWARE-COMPATIBILITY.md) et [fiche de résultat vierge](HARDWARE-TEST-RESULTS.md) font autorité pour les essais à réaliser par Térence. L’auto-résistance exige une plage annoncée 1–32/pas 1 et une vérification physique explicite à chaque connexion ; deux niveaux essayés ne vérifient pas toute la plage. Les résultats des quatre commandes et la version effectivement publiée seront consignés dans la PR 29 au SHA final.

## 6 octobre 2026 — première séance physique et lecteur avec score coach

Base du lot : main dd248938bd44f7743cd0cdfe65d48d0c66733c93 (PR 39, après PR 38).
Térence confirme sur Toputure TBE5 avec Bluefy : télémétrie, BPM, résistance commandée à la volée (environ deux secondes), première séance enregistrée. Windows/Sport02 ne deviennent pas qualifiés par ce résultat. La précision physiologique des poignées n'est pas établie.

Évolution demandée : lecteur mobile compact, profil de résistance (explicitement distinct de l'altitude), cible instantanée et niveau reçu ; une montée/descente dans chaque plage avec paliers d'au moins cinq secondes. Bilan protégé de l'envoi implicite par le clavier et case de relecture explicite. BPM non plafonnés à 95 : tests de décodage 8/16 bits et sauvegarde simulée à 148 ; moyenne/max historiques issus des échantillons espacés de dix secondes.

Score coach v1 : intégration temporelle à la seconde, mesures de cadence fraîches de cinq secondes maximum, pauses exclues, cadence libre toujours réussie si une mesure existe (zéro inclus). Hors-cible ou données absentes cassent le combo ; pause le fige. 10 points/seconde, multiplicateurs ×2/×3/×4 après 10/20/30 secondes. Note selon pourcentage de temps mesuré dans la cible, S=100, A+=95, A=90, A−=85, B+=80, B=75, B−=70, C=60, D=40, E en dessous. Couverture affichée ; score provisoire sous 60 s ou 80 % de couverture. Données et agrégats par segment conservés même sans trace détaillée.

Comparaison à réglages identiques (identifiant, mode, segments/durées/cadences/résistances, décalage, version). Record réservé à une épreuve complète et suffisamment mesurée, sans changement de réglages. Historique existant préservé, aucune note rétrospective inventée. Bilan et historique affichent le meilleur précédent et une célébration respectant reduced-motion. Aucun XP supplémentaire ni nouveau déblocage attribué par le score dans cette version.

Le SHA final, la PR, les contrôles CI et la publication sont consignés dans la PR de ce lot ; ces fonctionnalités nouvelles restent à essayer physiquement après validation automatisée.

Complément demandé pendant le lot : cartes Parcours sur grille mobile (départ et Voyage pleine largeur, trois actions régulières), résumé record/tentatives/défis sur trois colonnes, cartes Séances compactes avec séparation badges/bouton. Tests tactiles à 320 px ; absence de chevauchement du lecteur paysage et restauration du chrono couvertes.

Objectifs hebdomadaires : les 240 minutes venaient de la table initiale (5 séances ; progression jusqu'à 350 minutes). Nouvelle base 4×30 =120 min, stable, modifiable dans Plus ou depuis la mission. Nombre de séances et durée habituelle règlent aussi points (2/séance) et variété (jusqu'à 3 types) ; les plafonds d'intensité du programme sont conservés. Migration explicite des douze cibles : semaines passées gardent leur ancienne cible, semaine courante et futures reçoivent la base. Les changements suivants préservent les semaines passées. Calcul des semaines réussies/XP/badges aligné sur les cibles enregistrées ; sauvegarde JSON les conserve. Séances et mesures inchangées.

## 6 octobre 2026 — retour de la séance bonus

Après PR 40 (main 7ee7f4c), Térence signale résistance manuelle inattendue, cadence 80–90 difficile et RPE vécu supérieur à la cible. Cause : le verrou du laboratoire était réinitialisé à chaque connexion. Le Toputure TBE5/TEB5 déjà validé physiquement demande désormais le contrôle à la connexion si plage 1–32/pas1 et capacités de commande présentes ; aucune consigne avant le départ. Un refus garde la télémétrie et affiche le problème, avec relance depuis le lecteur. Les autres appareils gardent la validation manuelle, Sport02 n'est pas assimilé au Toputure.

Cadence douce par défaut −15 tr/min (80–90 devient65–75), classique0 ou soutenue+10 réglables avant départ et mémorisées ; bornes minimales40. Cibles ajustées utilisées dans le score et la clé de record, décalage sauvegardé pour la reprise ; anciennes reprises gardent leurs anciennes cibles. Boutons Alléger/Renforcer pendant la séance, comparaison de record invalidée si réglages changés. Le RPE affiché est nommé effort visé, pas mesuré. Coach vocal : cadence aux transitions, cible de résistance aux paliers, conseil après15s sous cible avec télémétrie fraîche et espacement45s, rappel de gestion toutes90s. Annonces supplémentaires sans interrompre la voix en cours, ni en pause, bilan ou arrière-plan. La voix demeure facultative.

Résultats CI, PR et commit de publication consignés dans la PR de ce lot. Validation physique des nouveaux automatismes encore à faire par Térence.

## 6 octobre 2026 — express, records du catalogue et commandes vocales

Base main9890418 (PR41). Huit séances indépendantes de3 à9min : Pause active3, Petit tour4, Cadence précise5, Petit escalier5, Vagues6, Tempo7, Éclats8, Sommet9. Trois faciles, trois soutenues, deux dures ; mise en route et retour au calme inclus. Les dures ne sont pas des bonus et restent comptées par les règles d’intensité existantes. Filtre express<10min et filtre d’intensité dans Séances. Les cartes montrent le meilleur suivi admissible à réglages actuels (cadence, résistance, mode), ou « à établir » ; aucune note rétrospective inventée.

Commandes vocales facultatives dans le lecteur : « Vélo allège », « Vélo renforce », « Vélo pause », « Vélo reprends ». Web Speech API native, détection de capacité et erreurs explicites ; compatibilité Bluefy/iPhone non confirmée physiquement. Activation par bouton, indicateur d’écoute, phrases finales exactes, debounce2s, pas de commande de fin/enregistrement. Refus pendant la voix du coach ; pause/reprise refusées pour les courses à chrono continu. Arrêt à la fermeture, au bilan et en arrière-plan ; reprise automatique limitée à3 interruptions sans erreur, aucune répétition sur refus de permission. Audio/transcription non conservés par VéloQuest ; traitement en ligne possible par le navigateur annoncé avant activation.

Tests et publication consignés dans la PR du lot. Un navigateur exposant la synthèse vocale ne garantit pas la reconnaissance ; essai réel requis dans Bluefy.

Extension du même lot demandée pendant la validation : Défi calories5/10min, rythme et résistance libres, chrono continu, record kcal distinct du score coach. Aucun niveau envoyé au départ ; Alléger/Renforcer choisit ensuite un niveau1–32 libre, par boutons ou voix. Calories du vélo : baseline fraîche au départ, différence du compteur dans l’intervalle exact, rejet des retours à zéro, trous>10s et fin sans mesure récente≤5s. Une reconnexion invalide la mesure ; une reprise après rechargement conserve le journal possible mais ne qualifie pas un record. Un arrêt anticipé ne qualifie pas non plus. Compteurs postérieurs au délai exclus. Résultats FTMS groupés par durée et nom du vélo ; saisies déclarées séparées, durée verrouillée et aucune assimilation aux données FTMS. Bilan/historique/cartes affichent kcal, record précédent et célébration d’un dépassement. Estimations de console explicitement distinguées d’une mesure physiologique ; les deux défis comptent dans les séances intenses existantes.


## 6 octobre 2026 — lot programme personnel, PR 46

Base main `0e3253bbeb02078587022d646e6cc48b7ea2b50c` (PR45). L’utilisateur a confirmé le transfert Bluefy JSON. Nouvelle demande : grande mise à jour issue de la roadmap approuvée. Programme, bilans, habitudes, cadence personnelle, maîtrise, carnets et premier pack canal implémentés ; voir PROGRAMME-PERSONNEL et CANAL-NANTES-BREST. 217 tests unitaires passent localement, TypeScript passe ; build local réussi avant ajout des routes, build final et tests navigateur requis en CI avant fusion. Aucun service de synchronisation distant configuré. Ne pas annoncer les packs Alpes/Ardèche comme livrés.

PR de livraison : https://github.com/AstrowareConception/Programme-velo/pull/46 ; premier commit de travail `29578dc91bef8f53c07f06c195a47d1d23ec5fce`. Les résultats sur la tête finale, la fusion et le déploiement sont consignés dans cette PR après vérification.
