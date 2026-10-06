# Compatibilité matérielle — TOPUTURE à qualifier

## État des preuves

Le 4 octobre 2026, la commande Amazon rapportée par Térence décrit un vélo TOPUTURE à résistance magnétique électrique, 32 niveaux, écran tactile, application et capteur cardiaque ; initialement annoncée jeudi 8 octobre, livraison réelle confirmée par Térence le 6 octobre 2026. La référence exacte et le firmware de l’exemplaire restent à relever. Ces indications commerciales ne démontrent ni BLE, ni FTMS, ni le contrôle de résistance par FTMS. Ne pas assimiler automatiquement cet exemplaire au TEB5 précédemment évoqué.

- [PR #16](https://github.com/AstrowareConception/Programme-velo/pull/16) : simulateur logiciel FTMS 1–32, anciennement nommé « Fake TEB5 ». Ce nom n’était pas une qualification constructeur.
- [PR #28](https://github.com/AstrowareConception/Programme-velo/pull/28) : aucun vélo physique qualifié.
- Premier essai réel transmis par Térence le 6 octobre : inventaire interrompu par un délai et laboratoire FTMS inaccessible. La version `9208763` pouvait afficher « service présent » prématurément ; aucune caractéristique FTMS ni télémétrie n’est confirmée. **Qualification physique non établie.**

## Audit des hypothèses

| Emplacement | Hypothèse antérieure | Traitement |
| --- | --- | --- |
| `lib/ftms.ts`, sélection | Noms TOPUTURE / Sport privilégiés | Sélection BLE sans filtre de marque ; service FTMS vérifié après sélection |
| Adaptateur, résistance | Repli implicite 1–32, support déduit de caractéristiques | Exiger feature bit 2, plage valide et notifications du Control Point ; aucune plage inventée |
| Encodage des commandes | Arrondi au dixième uniquement | Quantification sur le pas annoncé, bornée et signée ; rejet de NaN / plage invalide |
| Auto-résistance | Consigne 1–32 assimilée à l’unité matérielle | Disponible seulement pour plage 1–32/pas 1 et confirmation physique explicite pour la connexion ; aucune conversion vers une autre plage |
| Interface | TEB5 présenté comme identité du vélo | Libellés génériques ; les consignes de séance restent sur l’échelle 1–32 |
| Simulateur E2E | Nom « Fake TEB5 » | « Simulateur FTMS 1–32 » ; aucune preuve constructeur |
| Documents historiques | Références au TEB5 et à sa notice | Conservées comme contexte historique ; ce protocole fait autorité pour le vélo commandé |

Les profils d’effort, parcours, carnets, XP et données de séance ne changent pas. Le mode Voyage actuel, les photos et le fonctionnement hors connexion sont conservés ; aucune migration de stockage. La calibration des consignes reste un réglage d’entraînement et ne démontre pas une correspondance matérielle.

## Diagnostic sans données personnelles

Dans **Plus → Explorer les services Bluetooth → Inspecter un appareil BLE**, choisir soi-même l’appareil dans le sélecteur du navigateur. Aucun nom de marque n’est imposé, y compris lorsque FTMS n’est pas annoncé dans les publicités BLE. Fermer les autres applications connectées au vélo ; déconnecter la télémétrie VéloQuest et quitter la séance avant l’inventaire.

L’inventaire est indépendant de `connectFtmsBike`. Il ne demande jamais le contrôle, n’écrit aucune caractéristique et ne s’abonne à aucune notification. Il lit uniquement Fitness Machine Feature et Supported Resistance Level Range ; les autres caractéristiques sont recensées par UUID et propriétés. Il n’enregistre ni nom/ID/adresse BLE, ni numéro de série, ni profil, fréquence cardiaque, télémétrie, horodatage ou message d’erreur brut. Aucun appel réseau, stockage local ou envoi serveur ne fait partie du diagnostic. Le rapport est en mémoire jusqu’à effacement, sortie de l’onglet Plus ou rechargement ; l’export JSON est une action explicite et locale. Les erreurs sont converties en catégories fixes.

| Service autorisé | UUID | But de l’inventaire |
| --- | --- | --- |
| Fitness Machine | `1826` | Caractéristiques FTMS ; lecture des capacités et plage |
| Heart Rate | `180D` | Présence et propriétés, aucune mesure lue |
| Cycling Speed and Cadence | `1816` | Présence et propriétés uniquement |
| Cycling Power | `1818` | Présence et propriétés uniquement |

Web Bluetooth n’offre ici qu’une vue des services autorisés. **Un inventaire sans FTMS ne prouve pas l’absence de tout protocole de fitness**. Les services propriétaires non demandés ne sont pas visibles. `not-found` signifie non trouvé pendant l’essai, `not-authorized` refus d’accès et `unavailable` échec de communication ; ne pas confondre ces états. Une connexion tardive après annulation est refermée ; chaque opération expire après 15 secondes. La connexion FTMS d’entraînement borne aussi son établissement et referme une connexion tardive après expiration. Les mises à jour PWA attendent la fin de l’inventaire ou la déconnexion du vélo. Après un délai dépassé, fermer le sélecteur navigateur s’il est encore ouvert et recommencer avec le vélo réveillé.

Le rapport porte toujours `qualification: "not-qualified"` : découvrir les UUID ne valide ni les mesures ni les effets physiques d’une commande. La connexion d’entraînement peut mémoriser la télémétrie selon les préférences existantes ; elle constitue une fonction distincte du diagnostic.

## Recette physique courte — vélo reçu le 6 octobre 2026

La procédure est également consultable dans **Plus → Premier test du vélo · 10 à 15 minutes**. [Fiche de recette vierge](HARDWARE-TEST-RESULTS.md).

Durée indicative : 10 à 15 minutes. Réaliser d’abord l’inventaire sans pédaler ; n’entamer les tests de résistance qu’après identification des capacités.

1. **Identifier, sans données privées.** Relever la référence commerciale exacte sur la notice/étiquette et le firmware si affiché. Ne pas copier numéro de série, adresse MAC, identifiant de commande, nom Bluetooth personnalisé ou captures avec appareils voisins. Préparer un navigateur disposant effectivement de Web Bluetooth sur HTTPS (ou localhost pour le développement). Pour le premier essai, utiliser Chrome sur Windows/Mac ou Android avec Bluetooth activé, à proximité du vélo. Si VéloQuest indique que l’API est absente sur le téléphone utilisé, garder le mode manuel et effectuer l’inventaire depuis cet appareil compatible. Aucun appairage système préalable n’est nécessaire : choisir le vélo dans le sélecteur de VéloQuest.
2. **Réveiller et isoler la connexion.** Alimenter le vélo, réveiller sa console selon sa notice, fermer l’application constructeur et les autres connexions BLE. Lancer le diagnostic dans Plus, choisir le bon appareil localement. Exporter le JSON et noter seulement navigateur/OS, référence et firmware séparément, après relecture.
3. **Identifier les UUID.** Chercher `1826`, puis `2AD2` (Indoor Bike Data), `2ACC` (Feature), `2AD6` (Resistance Range), `2AD9` (Control Point), éventuellement `2ADA` (Status). Relever leurs propriétés. La présence de `180D` seule ne suffit pas pour la télémétrie vélo. Noter le bit 2 des cibles annoncées et min/max/pas, sans supposer que « 32 niveaux » implique FTMS 1–32.
4. **Si l’inventaire est incomplet.** Vérifier permissions, console réveillée et absence d’application concurrente, puis refaire un essai. Pour identifier les services propriétaires, utiliser un explorateur GATT local (par exemple nRF Connect ou LightBlue) en lecture seule : relever uniquement UUID des services/caractéristiques et propriétés. Ne pas exporter un scan brut, des publicités, des identifiants ou des mesures ; ne pas écrire de commande inconnue. Un protocole propriétaire demandera un lot séparé.
5. **Télémétrie séparée.** Après fermeture automatique de la connexion de diagnostic, connecter le vélo pour la télémétrie FTMS, pédaler doucement environ une minute puis arrêter. Comparer localement vitesse/cadence/distance et leur évolution avec la console ; noter seulement présent/absent/cohérent/incohérent. Dans le laboratoire, vitesse, distance et heure du dernier paquet facilitent cette comparaison ; une valeur inchangée n’est pas une preuve de réception continue. Vérifier arrêt, déconnexion puis reconnexion avec « Déconnecter le vélo après le test ». Ne pas joindre de valeurs cardiaques personnelles au rapport de compatibilité. La précision métrologique reste hors de portée de ce test court.
6. **Contrôle facultatif.** Seulement si Feature, plage et Control Point sont utilisables : dans le laboratoire, demander explicitement le contrôle, puis envoyer le minimum annoncé. « Choisir le minimum » et « Choisir un pas au-dessus » préparent la consigne sans écriture ; « Envoyer ce niveau au vélo » l’applique. Vérifier l’acquittement **et** le niveau de console **et** le changement physique. Si le premier essai est cohérent, essayer un pas voisin puis revenir au minimum. Un ACK prouve seulement l’acceptation logicielle ; arrêter en cas de refus, délai ou effet incohérent. Aucune montée automatique ni essai maximal n’est nécessaire.
7. **Conclure et déconnecter.** Classer séparément inventaire, télémétrie et contrôle. Ne cocher « Correspondance physique 1–32 vérifiée » que si cette correspondance a été établie sur l’exemplaire ; les deux commandes minimales ci-dessus ne qualifient pas toute l’échelle. L’auto-résistance reste facultative et désactivée à chaque nouvelle connexion. En cas de doute, continuer en manuel.

### Fiche de résultat à compléter (aucune valeur préremplie)

- Référence exacte / firmware / navigateur et OS : à relever.
- Rapport JSON du diagnostic : à produire ; services propriétaires éventuels : UUID/propriétés uniquement.
- Inventaire : non réalisé / incomplet / réalisé.
- Télémétrie : non testée / disponible et cohérente sur l’essai / partielle / incohérente.
- Contrôle : non testé / non exposé / refusé / ACK sans effet établi / effet local confirmé sur les niveaux essayés.
- Correspondance FTMS ↔ console : inconnue / description des niveaux effectivement essayés.
- Déconnexion/reconnexion : non testée / conforme / anomalie.
- Conclusion : manuel uniquement / télémétrie seule qualifiée sur cet exemplaire / contrôle partiel à approfondir.

## Validation et réversibilité

Tests unitaires : confidentialité par liste de champs autorisés, permissions, FTMS absent, plage/feature tronquées, lecture impossible, annulation, connexion tardive, délai ; adaptateur sans plage ni feature, refus/délai ACK, quantification, fermeture sur échec. Tests E2E : export réel du JSON, absence de données privées et de stockage du diagnostic, annulation, navigateur sans API, absence FTMS, largeur mobile, télémétrie et contrôle simulés avec confirmation explicite.

Commandes : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`. Le statut exact des exécutions est consigné dans la PR, sans qualification matérielle implicite. La CI existante exécute ces quatre contrôles.

Retour arrière : révoquer la connexion et supprimer le JSON local si exporté ; pour retirer le lot logiciel après fusion, revert du commit de fusion. Aucun schéma ni historique à restaurer ; aucune dépendance ou variable d’environnement ajoutée. Aucun changement des règles Voyage dans ce lot.

Références techniques : [Web Bluetooth, permissions et services optionnels (Chrome)](https://developer.chrome.com/docs/capabilities/bluetooth), [Fitness Machine Service (Bluetooth SIG)](https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/). Ces références définissent les interfaces ; elles ne certifient aucun modèle TOPUTURE.
## Diagnostic interrompu lors du premier essai

Si le rapport contient `outcome: "timeout"`, aucune compatibilité n'est établie.
La version initiale `9208763` créait trop tôt une entrée `status: "present"` :
un service listé sans `characteristicStatus` pouvait encore être en cours de découverte.
Ne pas interpréter ce premier rapport comme la preuve que FTMS existe sur le vélo.

Le diagnostic corrigé confirme `present` seulement après une découverte réussie.
Il exporte l'étape interrompue (`failure.stage`), les UUID concernés et un code
d'erreur connu du navigateur, sans message brut ni identifiant d'appareil.
Le laboratoire FTMS indique aussi l'étape et distingue notamment `NotFoundError`,
`NetworkError`, `SecurityError` et `TimeoutError`.

Fermer les autres applications et onglets connectés au vélo, réveiller la console
puis retenter l'inventaire. Si l'échec se répète, transmettre le nouveau JSON,
le système et le navigateur. Un second essai sur un autre appareil compatible
permet de comparer les environnements, sans conclure à la cause à partir d'un seul échec.
Ne pas demander le contrôle ni tenter de commande propriétaire pour contourner
un échec de découverte.
