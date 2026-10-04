# VéloQuest

**Ride · Level up · Repeat.**

Application : [programme-velo.vercel.app](https://programme-velo.vercel.app/) · Dépôt : [AstrowareConception/Programme-velo](https://github.com/AstrowareConception/Programme-velo)

VéloQuest est une PWA personnelle Next.js / React / TypeScript. Elle associe un programme souple de douze semaines, des séances guidées, des parcours variés et un suivi local. Le matériel de référence est le **TOPUTURE TEB5, 32 niveaux de résistance**. Le mode manuel permet de suivre les consignes et de saisir les valeurs du vélo sans connexion Bluetooth.

## Fonctions disponibles

- Programme de douze semaines : objectifs de minutes, points, séances et variété, avec un plafond de séances difficiles.
- Catalogue libre, micro-séances de 10/12/15/20 minutes, séance libre et saisie rétroactive. Nouveaux formats : Roulage contemplatif (25 min), Cadence fluide (30 min), Petites vagues (40 min), Parenthèse souple (12 min bonus).
- Coach adaptatif local : temps disponible, énergie, historique, charge récente et RPE.
- Préparation, lecteur guidé, pause, alertes sonores/vocales/haptiques, calibration et maintien de l'écran lorsque disponible.
- Reprise locale d'une séance interrompue, y compris Time Attack, Segment Attack et défi actif.
- **21 parcours natifs**, dont **7 balades à 1/5** et les cinq étapes Velleron, Vaison, Uchaux, Enclave des Papes et Corniches à **2/5–3/5** : bosses, descentes, faux-plats et récupérations, en complément des grands cols à 4/5–5/5.
- Recherche, filtres, tri, favoris et import GPX avec persistance des parcours personnels.
- Time Attack, records de parcours, fantôme et temps intermédiaires ; Segment Attack sur quatre secteurs, avec records séparés.
- Huit défis de parcours ; six campagnes : les quatre campagnes de Provence/montagne et deux carnets doux, Au fil de l’eau (+450 XP) et Échappées patrimoine (+300 XP).
- Trophées de découverte : Premier paysage, Flâneur de France (3 balades différentes), Atlas des balades (7). Collection La France en douceur.
- XP, niveaux, badges, collections, palmarès et analyses de performance.
- Journal, dates/heures locales, mesures datées de poids/taille/abdomen et suppression des saisies erronées.
- Export/import JSON (v3, compatible v2 et ancien état simple), exports CSV et estimation du stockage local.
- Lecture FTMS : vitesse, cadence, distance, résistance, puissance, fréquence cardiaque, moyennes, énergie, MET et temps **si le vélo les transmet**. Contrôle de résistance facultatif avec acquittement.

## Campagnes et historique

Les coches reflètent les parcours réellement terminés, même réalisés dans le désordre. « Continuer » propose la première étape encore manquante. Une séance complète peut compter pour plusieurs campagnes qui contiennent le même parcours.

Chaque campagne achevée débloque un badge et un **bonus unique calculé à partir de l'historique**. Répéter une étape ne multiplie pas ce bonus ; la séance conserve son XP habituel. Une tentative explicitement incomplète ou un Segment Attack ne valide jamais un parcours entier. Pour préserver les sauvegardes antérieures, les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme terminées.

La suppression recalcule les semaines, niveaux, campagnes, badges, collections, statistiques et records depuis les séances restantes. Si la dernière réalisation d'une étape est supprimée, le bonus et le badge de cette campagne disparaissent ; une autre réalisation complète conserve l'étape. Les XP déjà attribués aux autres séances restent leurs valeurs enregistrées : les anciennes récompenses de record/défi ne sont pas réécrites rétroactivement.

## Balades et programmes de découverte

Le filtre **Balades** et le raccourci **Explorer les 7 balades** ouvrent une offre à 1/5 : tour du lac du Der, rive ouest d’Annecy, petit tour de Chambord, chemins en campagne de l’île de Ré, Coulon–Damvix, Carcassonne–Marseillette et Tours–Villandry. Les paysages et leurs points d’intérêt sont décrits sur les fiches et dans le lecteur.

En mode balade, l’effort conseillé reste **RPE 2–4**, avec une résistance de base entre 4 et 10 sur 32, ajustable par la calibration. Les pauses sont libres. Les chronos et défis sont facultatifs ; aucune vitesse, cadence ou absence de pause n’est exigée pour les carnets. Une balade courte dure environ 25–27 minutes en simulation, mais le tour du Der approche 140 minutes : **1/5 décrit l’effort, pas la durée**. Les kilomètres restent ceux de la trace et ne sont pas compressés pour raccourcir la sortie. Une interruption sauvegardée peut être reprise.

Les deux carnets sont des programmes souples de découverte, en complément des douze semaines. Au fil de l’eau regroupe Der, Annecy, Marais poitevin et canal du Midi ; Échappées patrimoine associe Chambord, île de Ré et Villandry. Leurs cinq nouveaux badges comprennent deux badges de campagne et trois trophées de diversité. Les répétitions ne font pas progresser le nombre de paysages différents ; les bonus de carnet sont uniques, les séances gardent leur XP habituel. Les badges historiques `climb1` / `climb3` sont désormais nommés Premier relief / Collectionneur de reliefs : leurs validations antérieures sont conservées, les nouvelles balades disposent de leurs propres trophées.

Voir [les sources et la méthode des profils](docs/SCENIC-ROUTES.md). Ces traces ne servent pas de guide de navigation extérieure.

## Géographie, simulation et mesures

| Source | Ce qu'elle représente | Limites |
| --- | --- | --- |
| Cols et étapes natifs historiques | Profil géographique simplifié et coordonnées de référence | Ni trace GPS relevée ni itinéraire routier de navigation |
| Balades natives | Géométrie issue d’un GPX officiel ; altitude GPX, ou terrain IGN RGE ALTI si le GPX n’en contient pas | Profil lissé et échantillonné à 500 m ; D+ calculé sur ce profil, différent du total d’une fiche touristique ; ni relevé indépendant ni navigation |
| GPX importé | Distance et altitude calculées depuis les points du fichier ; pente lissée sur environ 250 m | Dépend de la qualité GPS et altimétrique ; le D+ reste calculé |
| Simulation | Progression estimée à partir du temps des segments, résistance suggérée sur 1–32 | Aucun kilomètre extérieur mesuré ; chrono distinct d'une validation physique |
| FTMS | Données transmises par le compteur du vélo ; progression relative à la distance au départ | La précision et les capacités dépendent du firmware et de l'exemplaire |
| Saisie manuelle | Valeurs déclarées par l'utilisateur, généralement lues sur l'écran du vélo | VéloQuest ne les vérifie pas indépendamment |

Les calories de séance préremplies depuis FTMS sont la variation du compteur d'énergie sur les échantillons conservés, avec gestion des remises à zéro. « KCAL VÉLO » affiche le compteur du vélo. Une saisie manuelle permet de corriger la valeur de séance. Les watts et calories affichés par le matériel peuvent eux-mêmes être estimés.

Les tests FTMS simulés vérifient le protocole logiciel et l'interface. **Ils ne prouvent pas le fonctionnement du TEB5 physique**, notamment le changement effectif de résistance. Voir le [protocole matériel](docs/TEB5-BLUETOOTH-VALIDATION.md). Sur un appareil sans Web Bluetooth, le mode manuel reste disponible ; aucune enveloppe native iOS n'est livrée.

## Données et PWA

Aucun compte ni backend métier : profil, historique, mesures, préférences et favoris utilisent `veloquest:v1`, les parcours personnels `veloquest:custom-routes:v1` et la reprise `veloquest:active-session:v1`. Les sauvegardes JSON comprennent l'état et les GPX ; la reprise active reste propre à l'appareil et n'est pas transférée par ce fichier.

Les semaines suivent le calendrier local, y compris lors d'un changement d'heure. Les séances sont sauvegardées comme instants UTC et affichées dans le fuseau courant de l'appareil. Une mesure datée est enregistrée à midi local pour préserver le jour au moment de la saisie.

La PWA met en cache l'interface après chargement. Les cartes distantes demandent du réseau ; les capacités hors connexion dépendent de ce qui a déjà été chargé. Faire un export avant de changer de téléphone ou d'effacer les données du navigateur. Les cartes OpenStreetMap et l'hébergement Vercel impliquent des requêtes réseau ordinaires. [Confidentialité](https://programme-velo.vercel.app/confidentialite).

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
- [Validation Bluetooth du TEB5](docs/TEB5-BLUETOOTH-VALIDATION.md)
- [État technique de reprise](docs/PROJECT-STATE.md)
- [Sources des balades et méthode des profils](docs/SCENIC-ROUTES.md)

Les niveaux proposés sont des repères : le ressenti, la récupération et les limites d'intensité du programme restent prioritaires. Projet personnel / expérimental.
