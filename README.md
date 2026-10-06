# VéloQuest

**Ride · Level up · Repeat.**

Application : [programme-velo.vercel.app](https://programme-velo.vercel.app/) · Dépôt : [AstrowareConception/Programme-velo](https://github.com/AstrowareConception/Programme-velo)

VéloQuest est une PWA personnelle Next.js / React / TypeScript. Elle associe un programme souple de douze semaines, des séances guidées, des parcours variés et un suivi local. Les consignes utilisent une échelle **1–32**. Le Toputure TBE5 a été testé physiquement par l’utilisateur le 6 octobre 2026 avec Bluefy sur iPhone : télémétrie, résistance effective et transfert JSON confirmés. Cette qualification ne s’étend pas automatiquement aux autres appareils ou navigateurs. Le mode manuel permet de suivre les consignes et de saisir les valeurs du vélo sans connexion Bluetooth.

## Mise à jour programme personnel — PR 46

Quête accueille **Ma semaine adaptée** : disponibilités, créneaux, semaines allégées, remplacement et déplacement de séances, objectifs cohérents avec le planning confirmé. Suivi regroupe le bilan hebdomadaire, les tendances de poids et les habitudes facultatives. Les points du jeu ne poussent plus le coach vers une charge supérieure.

Dix nouvelles séances, trois nouveaux programmes et défis de maîtrise ; repère de cadence personnel ; carnets ordonnés de parcours/GPX et reprise de leur prochaine étape. Le premier pack du canal de Nantes à Brest ajoute quatre parcours sourcés. Les champs nouveaux sont inclus dans la sauvegarde v3, sans recalcul de l’historique.

[Mode d’emploi et limites](docs/PROGRAMME-PERSONNEL.md) · [Sources du canal](docs/CANAL-NANTES-BREST.md). La synchronisation distante reste à configurer ; les nouveaux packs Alpes/Ardèche et l’extension des photos restent dans la roadmap. Les résultats des contrôles du commit de livraison figurent dans la PR 46.

## Fonctions disponibles

- Démarrage accompagné en quatre étapes, profil et mesures facultatives, première séance douce de 15 min, puis Quête simplifiée et découverte progressive du coach et des balades. Les comptes existants conservent leur interface.
- Programme de douze semaines : objectifs de minutes, points, séances et variété, avec un plafond de séances difficiles.
- Catalogue libre, micro-séances de 10/12/15/20 minutes, séance libre et saisie rétroactive. Nouveaux formats : Roulage contemplatif (25 min), Cadence fluide (30 min), Petites vagues (40 min), Parenthèse souple (12 min bonus).
- Six **programmes découverte** souples, dont Retour en selle, L’art de la régularité et Gérer sa réserve ; trophée et bonus unique selon le programme.
- Des **formats courts** extraits des GPX existants, avec filtre de durée simulée et des carnets indépendants. Un tronçon court ne valide pas son parcours parent.
- Fiches harmonisées sur tous les parcours : paysages, lieux, sources et limites. Les repères des quatorze profils historiques restent indicatifs.
- Coach adaptatif local : temps disponible, énergie, historique, charge récente et RPE.
- Préparation et lecteur guidé, **vue essentielle** ou complète, pause et commandes accessibles ; alertes sonores/vocales/haptiques réglables, test avant le départ, volume, fréquence et préavis facultatif. Calibration et état réel du maintien de l’écran. [Utilisation avec podcast ou vidéo](docs/READER-COMFORT.md).
- Reprise locale d'une séance interrompue, y compris Time Attack, Segment Attack et défi actif.
- **84 parcours natifs**, dont **38 balades à 1/5** et les cinq étapes Velleron, Vaison, Uchaux, Enclave des Papes et Corniches à **2/5–3/5** : bosses, descentes, faux-plats et récupérations, en complément des grands cols à 4/5–5/5.
- Douze thèmes de découverte, dont **Estérel et Corniche d’Or** et **Route Napoléon** (quatorze grandes étapes et quatre escales courtes), recherche par ville ou repère (avec ou sans accents), filtres, tri, favoris et import GPX avec persistance des parcours personnels.
- Time Attack, records de parcours, fantôme et temps intermédiaires ; Segment Attack sur quatre secteurs, avec records séparés.
- Huit défis de parcours ; **22 campagnes/carnets**, dont Passeport azuréen, Carnet du Verdon, Cartes postales de Provence, Les deux Corniches et Des forêts aux cimes. Les objectifs précédents restent inchangés ; Escales du Sud, Un paysage en 30 minutes et Route Napoléon ajoutent des bonus uniques de 220, 180 et 900 XP.
- Trophées de découverte : Premier paysage, Flâneur de France (3 balades différentes), Atlas des balades (7), plus six trophées de variété : 10/20 parcours natifs, 6 destinations PACA, 3 parcours azuréens, 4 territoires et les 5 difficultés. Collection La France en douceur inchangée.
- XP, niveaux, badges, collections, palmarès et analyses de performance.
- Journal, dates/heures locales, mesures datées de poids/taille/abdomen et suppression des saisies erronées.
- Export/import JSON (v3, compatible v2 et ancien état simple), exports CSV et estimation du stockage local.
- Lecture FTMS : vitesse, cadence, distance, résistance, puissance, fréquence cardiaque, moyennes, énergie, MET et temps **si le vélo les transmet**. Contrôle de résistance facultatif avec acquittement.

## Premiers pas accompagnés

Au premier lancement, le guide demande un prénom facultatif, une envie (habitude, endurance ou paysages), le niveau de pratique, un créneau de 15/25/30 minutes et un cap souple de 2/3/4 séances par semaine. Il explique le mode manuel sur 32 niveaux et le RPE, puis propose **Premiers tours de roue** : 15 minutes faciles, trois segments, sans Bluetooth obligatoire. Les mesures corporelles pourront être ajoutées dans Plus ; une sauvegarde peut être restaurée dès l’accueil.

La Quête affiche ensuite une prochaine action et trois repères : découvrir les consignes, trouver son rythme, choisir son chemin. Ils sont recalculés depuis les séances complètes enregistrées d’au moins 10 minutes ; bonus, secteurs, tentatives explicitement incomplètes et dates futures ne les valident pas. Une saisie manuelle ou un ancien historique sans marqueur d’incomplétude reste reconnu ; il ne constitue pas une preuve indépendante d’achèvement physique.

Les trois premiers repères privilégient les formats faciles. Après trois séances, les choix du jour (temps et énergie) apparaissent et le coach exploite la charge et le ressenti. Un débutant accompagné évite les séances difficiles avant six réalisations ; un RPE récent de 8 ou plus ramène les suggestions aux formats faciles. Le cap personnel n’attribue pas de bonus et ne remplace pas les missions XP du programme de douze semaines, accessibles dans une section dépliable. Les balades et tous les autres onglets restent libres.

Le guide et ses réglages sont sauvegardés avec les données locales et le JSON v3. Une interruption de configuration reprend à la même étape. **Explorer librement** permet de sortir du guide ; **Plus → Revoir le guide de démarrage** permet d’y revenir sans effacer les séances, mesures, favoris ou dates. Si une séance interrompue existe, le guide la signale et renvoie vers sa reprise plutôt que de la remplacer par la première séance. Les anciennes sauvegardes sans guide n’en déclenchent pas un automatiquement. Les choix du jour restent temporaires ; le cap du guide est conservé.

## Campagnes et historique

Le **mode Voyage** permet de terminer un parcours natif ou un GPX en portions de 15/30/45/60 minutes, puis de le retrouver dans Quête. Carte, profil et lieux conservent les kilomètres du parcours entier. Cette première version utilise une position **simulée à 15 km/h** ; la distance mesurée sur le vélo reste distincte. Seules les portions achevées et enregistrées comptent. Les chevauchements ne multiplient pas la progression ; les XP du parcours sont attribués une seule fois en Voyage à sa fin, sans second bonus s’il existe déjà une séance classique complète à cette date. Suppression et restauration recalculent couverture, campagnes et trophées. Trois trophées Voyage complètent les récompenses ; le catalogue actuel compte **74 badges**, avec les carnets et trophées alsaciens. Voir [le guide Voyage](docs/VOYAGE.md).

Les coches reflètent les parcours réellement terminés, même réalisés dans le désordre. « Continuer » propose la première étape encore manquante. Une séance complète peut compter pour plusieurs campagnes qui contiennent le même parcours.

Chaque campagne achevée débloque un badge et un **bonus unique calculé à partir de l'historique**. Répéter une étape ne multiplie pas ce bonus ; la séance conserve son XP habituel. Une tentative explicitement incomplète ou un Segment Attack ne valide jamais un parcours entier. Pour préserver les sauvegardes antérieures, les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme terminées.

La suppression recalcule les semaines, niveaux, campagnes, badges, collections, statistiques et records depuis les séances restantes. Si la dernière réalisation d'une étape est supprimée, le bonus et le badge de cette campagne disparaissent ; une autre réalisation complète conserve l'étape. Les XP déjà attribués aux autres séances restent leurs valeurs enregistrées : les anciennes récompenses de record/défi ne sont pas réécrites rétroactivement.

## Balades et programmes de découverte

Le filtre **Balades** et le raccourci **Explorer les 35 balades** ouvrent trente-cinq parcours à 1/5 : tour du lac du Der, rive ouest d’Annecy, petit tour de Chambord, chemins en campagne de l’île de Ré, Coulon–Damvix, Carcassonne–Marseillette et Tours–Villandry, ainsi que Cagnes-sur-Mer–Cannes et son format court Golfe-Juan–Cannes. S’y ajoutent Menton–Garavan, le Calavon de Cavaillon à Apt, les canaux de Camargue gardoise, la baie de Somme et Erstein–Strasbourg. Les paysages et leurs points d’intérêt sont décrits sur les fiches et dans le lecteur.

Les nouveaux profils à 2–5/5 complètent les cinq étapes historiques : Les Baux, Sainte-Croix et le plateau de Valensole, Castellane et ses deux lacs, Route des Crêtes du Verdon, Èze-sur-Mer–Menton, Nice–Menton par la Grande Corniche, Turini et Bonette, Roscoff–Morlaix et Blois–Chaumont. **Thème** combine paysages et difficultés ; **Campagnes et carnets** se déplie pour choisir un objectif de découverte ou sportif. Les lieux et leurs repères restent visibles avant le départ et pendant la séance.

En mode balade, l’effort conseillé reste **RPE 2–4**, avec une résistance de base entre 4 et 10 sur 32, ajustable par la calibration. Les pauses sont libres. Les chronos et défis sont facultatifs ; aucune vitesse, cadence ou absence de pause n’est exigée pour les carnets. Une balade courte dure environ 25–27 minutes en simulation, mais le tour du Der approche 140 minutes : **1/5 décrit l’effort, pas la durée**. Les kilomètres restent ceux de la trace et ne sont pas compressés pour raccourcir la sortie. Une interruption sauvegardée peut être reprise.

La **Côte d’Azur** se découvre de Cagnes-sur-Mer à Cannes (23,8 km, environ 95 minutes simulées), ou sur le petit format **Golfe-Juan → Cannes** (7,5 km, environ 30 minutes). Les fiches et la préparation présentent les villes, quartiers et repères kilométriques. Pendant la séance, le dernier repère atteint et le suivant accompagnent la carte : Villeneuve-Loubet, Antibes, Juan-les-Pins, Golfe-Juan, Palm Beach et la Croisette. Les kilomètres viennent de la trace ; les repères ne définissent pas les frontières des communes. Le format court a son propre identifiant et ne valide pas la traversée complète.

Les deux premiers carnets sont des programmes souples de découverte, en complément des douze semaines. Au fil de l’eau regroupe Der, Annecy, Marais poitevin et canal du Midi ; Échappées patrimoine associe Chambord, île de Ré et Villandry. Leurs cinq nouveaux badges comprennent deux badges de campagne et trois trophées de diversité. Les répétitions ne font pas progresser le nombre de paysages différents ; les bonus de carnet sont uniques, les séances gardent leur XP habituel. Les badges historiques `climb1` / `climb3` sont désormais nommés Premier relief / Collectionneur de reliefs : leurs validations antérieures sont conservées, les nouvelles balades disposent de leurs propres trophées. Atlas des balades garde son seuil de 7 destinations différentes ; La France en douceur conserve les sept parcours fondateurs pour préserver les récompenses déjà obtenues.

Voir [les sources et la méthode des profils](docs/SCENIC-ROUTES.md). Ces traces ne servent pas de guide de navigation extérieure.


La **Route Napoléon** réunit huit étapes routières de **Golfe-Juan à Gap**, à 2/5–3/5 : Grasse, Saint-Vallier-de-Thiey, Séranon, Castellane, Barrême, Digne et Sisteron jalonnent le voyage. Le thème regroupe ces parcours ; le carnet accepte toutes les étapes dans le désordre, avec un trophée et **900 XP uniques**. Le tracé officiel CRT PACA est découpé sans liaisons inventées, avec altitudes IGN lissées. La suite **Gap–Grenoble** ajoute six étapes par le col Bayard, Corps, La Mure, Laffrey, Vizille, Brié et Eybens, issues d’une seule trace Michelin publiée, avec altitudes IGN. Un carnet distinct offre **700 XP uniques** ; « Dauphiné en poche » (3/6) et « Traversée impériale » (14/14) ajoutent deux trophées sans XP supplémentaire. Le départ à Gap est distant d’environ 260 m de l’arrivée précédente, sans liaison ajoutée. Les étapes restent indépendantes ; le lecteur permet d’en retrouver une puis de reprendre sa séance. Voir [les nouvelles destinations et programmes](docs/DISCOVERY-PROGRAMMES.md).

La **Corniche d’Or et l’Estérel** ajoutent quatre étapes de Saint-Raphaël à Théoule et retour par la RN7 (1/5–3/5), ainsi que deux petits formats côtiers. Quatre **petites escales Napoléon** de 15–27 minutes complètent le thème, avec leurs propres validations. Trois carnets offrent 600/100/180 XP uniques ; **Roches rouges** et **Aigle de poche** ajoutent deux trophées sans XP. Les anciens parcours et objectifs sont conservés. Voir [les dix destinations et leurs sources](docs/ESTEREL-ESCALES.md) et [la roadmap](docs/ROADMAP.md). Voyage fonctionne sur un parcours à la fois ; l’enchaînement automatique de plusieurs étapes reste à développer.

## Confort du lecteur et médias

Les parcours illustrés proposent **Voir les photos** dans la fiche, la préparation et la vue complète du lecteur : dix photos documentées, dont les cinq premières à Cagnes-sur-Mer, Antibes, Golfe-Juan, Cannes et Menton, avec dates, légendes et crédits. Une photo à la fois, chargée uniquement à l’ouverture. **Photos des paysages**, dans Son, voix et média, permet de les masquer ; la vue essentielle les masque pendant l’effort. Les kilomètres du Voyage restent absolus, les vues prises hors du tracé sont identifiées. Les dix photos couvrent dix-sept parcours, avec le Ventoux, le Galibier, l’Estérel et les étapes alsaciennes ajoutés au premier lot azuréen. Le téléchargement facultatif pèse 575 Ko, sans vidéo continue ni photos attribuées automatiquement aux GPX personnels. [Sources, droits et limites](docs/LANDSCAPE-PHOTOS.md).

Choisis **Vue essentielle** dans Plus, avant le départ ou pendant la séance : résistance, temps, prochaine consigne, lieux et commandes restent visibles. La vue complète retrouve carte et profil. Le choix est conservé dans les sauvegardes sans modifier les historiques, chronos ou défis.

Dans **Son, voix et média**, règle les bips, la voix, le volume et la fréquence, puis teste avec ton casque ou ton podcast. Un préavis facultatif de dix secondes est disponible sur les segments minutés ; la voix tient compte de la calibration. Le maintien de l’écran indique son état réel, y compris refus ou interruption, avec possibilité de réessayer.

Lance ton média séparément et garde VéloQuest visible : podcast en arrière-plan, vidéo flottante si YouTube et l’appareil le permettent, fenêtres côte à côte sur ordinateur/tablette. Le comportement audio dépend de l’appareil. Un écran verrouillé ou VéloQuest masqué peut interrompre les alertes et le Bluetooth. Les tests Chromium simulés ne qualifient ni ce comportement sur iPhone/Android réels ni le TEB5. [Guide pratique et limites](docs/READER-COMFORT.md).

## Géographie, simulation et mesures

| Source | Ce qu'elle représente | Limites |
| --- | --- | --- |
| Cols et étapes natifs historiques | Profil géographique simplifié et coordonnées de référence | Ni trace GPS relevée ni itinéraire routier de navigation |
| Balades natives | Géométrie issue d’un GPX officiel ; altitude GPX, ou terrain IGN RGE ALTI selon la méthode documentée du parcours | Profil lissé et échantillonné à 500 m ; D+ calculé sur ce profil, différent du total d’une fiche touristique ; ni relevé indépendant ni navigation |
| GPX importé | Distance et altitude calculées depuis les points du fichier ; pente lissée sur environ 250 m | Dépend de la qualité GPS et altimétrique ; le D+ reste calculé |
| Simulation | Progression estimée à partir du temps des segments, résistance suggérée sur 1–32 | Aucun kilomètre extérieur mesuré ; chrono distinct d'une validation physique |
| FTMS | Données transmises par le compteur du vélo ; progression relative à la distance au départ | La précision et les capacités dépendent du firmware et de l'exemplaire |
| Saisie manuelle | Valeurs déclarées par l'utilisateur, généralement lues sur l'écran du vélo | VéloQuest ne les vérifie pas indépendamment |

Les calories de séance préremplies depuis FTMS sont la variation du compteur d'énergie sur les échantillons conservés, avec gestion des remises à zéro. « KCAL VÉLO » affiche le compteur du vélo. Une saisie manuelle permet de corriger la valeur de séance. Les watts et calories affichés par le matériel peuvent eux-mêmes être estimés.

Les tests FTMS simulés vérifient le protocole logiciel et l'interface. **Ils ne prouvent pas le fonctionnement du TEB5 physique**, notamment le changement effectif de résistance. Voir le [diagnostic et la recette TOPUTURE](docs/HARDWARE-COMPATIBILITY.md). Sur un appareil sans Web Bluetooth, le mode manuel reste disponible ; aucune enveloppe native iOS n'est livrée.

## Données et PWA

Aucun compte ni backend métier : profil, historique, mesures, préférences et favoris utilisent `veloquest:v1`, les parcours personnels `veloquest:custom-routes:v1` et la reprise `veloquest:active-session:v1`. Les sauvegardes JSON comprennent l'état et les GPX ; la reprise active reste propre à l'appareil et n'est pas transférée par ce fichier.

Les semaines suivent le calendrier local, y compris lors d'un changement d'heure. Les séances sont sauvegardées comme instants UTC et affichées dans le fuseau courant de l'appareil. Une mesure datée est enregistrée à midi local pour préserver le jour au moment de la saisie.

Dans **Plus**, le cadre **Installer VeloQuest** est entièrement cliquable. Il ouvre la confirmation native dès que le navigateur fournit une invitation d’installation ; sinon il ouvre les étapes adaptées à l’appareil. L’invitation est conservée dès l’accueil, même avant d’ouvrir Plus. Sur iPhone/iPad, le guide explique l’ajout à l’écran d’accueil ; sur Safari Mac, l’ajout au Dock. Le navigateur conserve la décision et la confirmation finales. Une annulation reste possible et ne modifie aucune séance.

La PWA prépare le paquet du build et vérifie ses fichiers dans **Plus → Emporte ta séance**. Les photos ont un compteur et une préparation facultative ; les cartes distantes et les médias restent dépendants de leur réseau. Une mise à jour attend ton action et le repos des lecteurs ouverts. Le navigateur peut retirer le cache : fais un export avant de changer de téléphone ou d’effacer les données. [Guide PWA](docs/PWA-OFFLINE.md) · [Confidentialité](https://programme-velo.vercel.app/confidentialite).

## Développement et validation

Node 22 en CI (Node 24 utilisé par Vercel). Les dépendances sont verrouillées par `package-lock.json`.

```bash
npm ci
npm run dev
```

Avant toute production, sur le commit proposé :

```bash
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

La CI exécute les quatre contrôles sur les PR et sur `main`. Playwright couvre Chromium mobile (390 × 844) et ordinateur (1 280 × 900), avec persistance/rechargement, campagnes, saisie/suppression, records, reprise et FTMS simulé. Ces profils ne sont pas un test sur iPhone physique ou Safari.

`CHROMIUM_PATH` permet d'utiliser un Chromium local déjà installé. `E2E_BASE_URL` cible un serveur existant sans démarrer le serveur de développement ; les scénarios écrivent uniquement dans le stockage isolé du navigateur de test.

## Déploiement et version

Le projet Vercel **programme-velo** est relié au dépôt : les branches créent des previews et `main` alimente l'URL publique. Fusionner seulement après réussite des contrôles sur le commit exact de la PR. Le workflow de vérification attend ensuite que `/api/version` expose le commit de `main` ayant réussi la CI ; il ne crée pas un second projet Vercel.

La version est visible dans **Plus** et dans [l'endpoint de version](https://programme-velo.vercel.app/api/version), sans cache. Comparer ce SHA avec `main` et les métadonnées du déploiement Vercel ; une CI verte seule ne prouve pas la publication. Recharger l'application en ligne après une mise à jour, puis vérifier la conservation de l'historique.

## Guides

- [Guide utilisateur](docs/USER-GUIDE.md)
- [Compatibilité matérielle : diagnostic BLE privé et recette TOPUTURE](docs/HARDWARE-COMPATIBILITY.md)
- [Ancien protocole TEB5, contexte historique](docs/TEB5-BLUETOOTH-VALIDATION.md)
- [État technique de reprise](docs/PROJECT-STATE.md)
- [Sources des balades et méthode des profils](docs/SCENIC-ROUTES.md)

Les niveaux proposés sont des repères : le ressenti, la récupération et les limites d'intensité du programme restent prioritaires. Projet personnel / expérimental.

Les quinze nouvelles traces, leurs sections, les lieux traversés et les récompenses sont documentés dans [docs/EXPLORATION-ROUTES.md](docs/EXPLORATION-ROUTES.md). Les profils officiels lissés restent une représentation pour vélo d’appartement, sans guidage routier ni preuve de fonctionnement du TEB5 réel.

Hors connexion et mises à jour : dans **Plus → Emporte ta séance**, vérifie le paquet local et prépare les photos facultatives. Une nouvelle version attend ton action et le repos des lecteurs ouverts ; la reprise sauvegardée reste conservée. [Usage, construction et limites PWA](docs/PWA-OFFLINE.md).

Le **Vignoble d’Alsace** ajoute six étapes de Marlenheim à Thann et trois parenthèses de 14 à 23 minutes simulées. Deux carnets distincts, **Vignoble d’Alsace · la traversée** (650 XP) et **Parenthèses alsaciennes** (120 XP), rejoignent les **22 objectifs**. Les formats courts ne remplacent aucune grande étape. Deux trophées accompagnent ces découvertes. [Sources, relief et limites](docs/ALSACE-VIGNOBLE.md).
