# Architecture des vélos connectés

Document de conception initial — 7 octobre 2026.

**Phase A démarrée** : un registre `BikeAdapter` expose désormais FTMS comme premier adaptateur, et la qualification TOPUTURE 1–32 est centralisée dans un module dédié plutôt que dans l'interface principale. La persistance des qualifications et l'extraction complète du contrôleur Bluetooth restent les étapes suivantes.

## Objectif

VéloQuest doit pouvoir utiliser plusieurs marques et modèles de vélos d'appartement sans faire dépendre le cœur de l'application d'un nom commercial. Le support est possible lorsqu'un appareil expose un protocole accessible au navigateur, en priorité **Bluetooth FTMS**, ou lorsqu'un protocole propriétaire est documenté et peut être encapsulé proprement.

Cette architecture ne promet pas une compatibilité universelle. Un appareil dont le protocole est fermé, chiffré, inaccessible depuis Web Bluetooth ou inconnu peut rester limité au mode manuel.

## État actuel favorable

Le code possède déjà plusieurs propriétés qui facilitent cette évolution :

- la sélection BLE n'impose pas de filtre de marque ;
- FTMS est découvert après sélection ;
- la télémétrie est normalisée dans une structure commune ;
- les capacités de résistance, plage et Control Point sont inspectées avant commande ;
- l'absence de contrôle conserve la télémétrie et le mode manuel ;
- le diagnostic BLE est séparé de la connexion d'entraînement.

La principale dette restante est que l'interface applique encore une qualification automatique spécifique au nom Bluetooth du TOPUTURE pour activer le pilotage 1–32. Cette décision doit sortir de `VeloQuestApp.tsx`.

## Cible d'architecture

### 1. Contrat `BikeAdapter`

Le cœur de l'application ne doit connaître qu'une interface stable :

```ts
type BikeAdapter = {
  id: string;
  label: string;
  canHandle(candidate: BikeCandidate): Promise<boolean>;
  connect(candidate: BikeCandidate): Promise<BikeConnection>;
};
```

Le détail du protocole reste dans l'adaptateur.

### 2. Connexion normalisée

```ts
type BikeConnection = {
  adapterId: string;
  deviceName: string;
  capabilities: BikeCapabilities;
  onTelemetry(listener: (sample: BikeTelemetry) => void): () => void;
  requestControl?: () => Promise<void>;
  setResistance?: (target: BikeResistanceTarget) => Promise<void>;
  disconnect(): void;
};
```

Les futures extensions possibles restent optionnelles : inclinaison, ERG/power target, cadence target, simulation de pente, etc.

### 3. Capacités au lieu d'une liste de marques

```ts
type BikeCapabilities = {
  telemetry: {
    speed: boolean;
    cadence: boolean;
    distance: boolean;
    power: boolean;
    calories: boolean;
    heartRate: boolean;
    resistance: boolean;
  };
  control: {
    resistance: boolean;
    power?: boolean;
    incline?: boolean;
  };
  resistanceRange?: {
    min: number;
    max: number;
    increment: number;
  };
};
```

Un écran doit se rendre en fonction de ces capacités, pas en fonction de `deviceName`.

## Adaptateurs prévus

### Adaptateur 1 — FTMS générique

Priorité absolue. Il reprend le comportement actuel de `lib/ftms.ts` :

- Fitness Machine Service ;
- Indoor Bike Data ;
- Fitness Machine Feature ;
- Supported Resistance Level Range ;
- Fitness Machine Control Point ;
- service Heart Rate facultatif ;
- refus propre lorsque certaines capacités manquent.

Il doit supporter un vélo FTMS conforme sans ajouter son nom dans le code.

### Adaptateurs de compatibilité FTMS

Certains vélos annoncent FTMS mais présentent des particularités. Ces adaptations ne doivent être ajoutées qu'avec preuve et tests :

- caractéristique absente alors qu'une autre source fournit la même donnée ;
- échelle de résistance différente ;
- télémétrie diffusée sur un service complémentaire ;
- commande standard acceptée avec une convention particulière documentée.

Ces écarts doivent vivre dans un profil/adaptateur, jamais sous forme de conditions dispersées dans l'interface.

### Adaptateurs propriétaires

Ils ne seront envisagés que si :

1. le protocole est documenté publiquement ou observé de manière suffisamment fiable et légitime ;
2. aucune commande inconnue n'est envoyée au hasard ;
3. un simulateur/test automatisé accompagne l'implémentation ;
4. le mode manuel reste disponible en repli.

## Mappage de résistance

VéloQuest raisonne aujourd'hui sur une consigne pédagogique 1–32. Un autre vélo peut exposer 1–16, 0–100 ou une unité FTMS décimale.

Il faut séparer :

- **intensité VéloQuest** : 1–32, utilisée par les séances existantes ;
- **cible matérielle** : unité native du vélo ;
- **mappage** : fonction explicitement qualifiée.

Premier comportement prudent :

1. si la plage matérielle est exactement 1–32/pas 1 et que le contrôle a été validé, utiliser l'identité ;
2. sinon rester en manuel jusqu'à définition/validation d'un mappage ;
3. un mappage automatique éventuel doit être visible, réversible et testé physiquement ;
4. ne jamais supposer qu'une interpolation linéaire produit un effort équivalent.

## Qualification d'un modèle

La compatibilité doit être enregistrée sous forme de profil explicite :

```ts
type BikeQualification = {
  adapterId: string;
  modelKey: string;
  telemetryVerified: boolean;
  resistanceControlVerified: boolean;
  resistanceMapping?: "1:1-32" | "custom";
  verifiedAt: string;
  notes?: string;
};
```

Le `modelKey` ne doit pas être un identifiant privé du vélo. Il peut être dérivé d'un nom de modèle normalisé et d'un ensemble de capacités, ou être choisi explicitement par l'utilisateur.

Une simple expression régulière sur le nom Bluetooth ne doit plus être la source de vérité.

## Ordre d'implémentation

### Phase A — sans changement fonctionnel

1. ✅ déplacer la décision de qualification TOPUTURE dans un module dédié ;
2. ✅ introduire un registre `BikeAdapter` et identifier la connexion par `adapterId` ;
3. ✅ faire de l'implémentation FTMS actuelle le premier adaptateur sans modifier son protocole ;
4. ⏳ extraire la logique de connexion/état de `VeloQuestApp.tsx` dans un hook/contrôleur ;
5. ⏳ déplacer progressivement les types protocolaires génériques hors de `ftms.ts` ;
6. conserver exactement le comportement utilisateur actuel à chaque étape.

### Phase B — capacités et profils

1. persister une qualification non sensible ;
2. remplacer les tests de nom dans l'interface par un profil de qualification ;
3. afficher clairement télémétrie disponible / contrôle disponible / mappage vérifié ;
4. permettre de révoquer la qualification.

### Phase C — deuxième vélo réel

La vraie validation de l'architecture sera l'ajout d'un **deuxième modèle différent** sans modifier le cœur du lecteur.

Critère de réussite : ajouter le support via un adaptateur/profil et ses tests, sans condition de marque dans `VeloQuestApp.tsx`.

## Tests nécessaires

- FTMS complet avec résistance ;
- FTMS télémétrie seule ;
- service Heart Rate séparé ;
- plage autre que 1–32 ;
- Control Point absent ;
- Control Point refusé ;
- reconnexion ;
- qualification absente ;
- qualification révoquée ;
- deux adaptateurs simulés dans la même suite ;
- sauvegarde/import d'un profil de qualification si celui-ci devient persistant.

## Sécurité et limites

- aucune écriture propriétaire inconnue ;
- aucune donnée BLE privée dans les rapports exportés ;
- aucun numéro de série ou adresse MAC nécessaire ;
- commandes bornées par les capacités annoncées ;
- arrêt du pilotage automatique après erreur ;
- mode manuel disponible à tout moment ;
- tests physiques nécessaires pour confirmer l'effet réel d'une commande.

## Critère de sortie du chantier

Le socle multi-vélos sera considéré opérationnel lorsque :

1. `VeloQuestApp.tsx` ne contient plus de nom de marque/modèle pour décider du contrôle ;
2. FTMS fonctionne via un adaptateur générique ;
3. le TOPUTURE actuel conserve son comportement ;
4. un deuxième profil simulé démontre une autre plage/capacité ;
5. l'ajout futur d'un deuxième vélo réel ne nécessite pas de modifier le lecteur métier.
