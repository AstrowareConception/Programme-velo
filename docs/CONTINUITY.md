# Continuité de travail et reprise après perte d’une conversation

Ce document rend le projet **indépendant d’un fil ChatGPT particulier**. Une conversation, un résumé externe ou une mémoire d’assistant peut aider à comprendre l’intention, mais ne constitue jamais la source de vérité technique du projet.

## Sources de vérité, par ordre de priorité

1. **GitHub en direct** : branche `main`, commits, PR ouvertes, diff réel et résultats GitHub Actions.
2. **Production** : déploiement Vercel et `/api/version` lorsque la question porte sur ce qui est effectivement publié.
3. **État de reprise** : [PROJECT-STATE.md](PROJECT-STATE.md), qui donne un checkpoint lisible et l’historique des lots.
4. **Roadmap** : [ROADMAP.md](ROADMAP.md), qui décrit les priorités et travaux à venir.
5. **Documentation spécialisée** : guides produit, PWA, matériel, architecture, parcours, etc.
6. **Conversation** : utile pour l’intention immédiate, mais jamais suffisante pour affirmer l’état du dépôt.

En cas de contradiction, l’état live de GitHub et de la production prime sur les résumés anciens.

## Procédure obligatoire au début d’une reprise

Avant de modifier le projet après une nouvelle conversation, une interruption ou une erreur « Impossible de charger cette conversation » :

1. lire `AGENTS.md`, ce document, `docs/PROJECT-STATE.md` et `docs/ROADMAP.md` ;
2. vérifier le SHA actuel de `main` ;
3. lister les PR ouvertes et relever leur branche, head SHA, intégrabilité et but ;
4. contrôler les CI du head concerné ;
5. si la tâche touche la publication, vérifier Vercel et `/api/version` ;
6. comparer cet état avec le checkpoint documentaire ;
7. annoncer brièvement le point de reprise réel avant de poursuivre le lot.

Ne jamais reconstruire un état technique uniquement depuis le souvenir d’un ancien chat.

## Règle de taille des lots et des conversations

Un fil doit rester centré sur **un lot cohérent**. Lorsqu’un jalon important est atteint — fusion, déploiement, changement d’architecture, décision produit structurante ou série importante de fonctionnalités — il faut produire un checkpoint avant d’empiler un nouveau chantier.

Une décision indispensable à la reprise ne doit pas vivre uniquement dans le chat. Elle doit être reflétée dans le code, la PR, la roadmap, l’état de reprise ou une documentation spécialisée.

## Fin de lot : checkpoint minimal

À la fin d’un lot significatif, mettre à jour la documentation concernée. Pour un changement qui modifie l’état du projet, ajouter ou actualiser dans `PROJECT-STATE.md` :

- date ;
- base de travail observée ;
- numéro et URL de PR ;
- head SHA testé ;
- fonctions réellement ajoutées ou modifiées ;
- contrôles exécutés et résultats ;
- état de fusion ;
- état de publication, si pertinent ;
- limites encore non vérifiées ;
- prochaine action concrète.

Le fichier d’état n’a pas besoin d’avoir un SHA identique à la tête courante : c’est un **checkpoint daté**. La reprise commence toujours par une vérification live.

## Si une conversation devient inaccessible

La procédure est volontairement mécanique :

1. ignorer le contenu inaccessible comme dépendance ;
2. repartir de `main` et des PR ouvertes ;
3. relire le dernier checkpoint ;
4. contrôler les CI et la production ;
5. reprendre la première action non terminée.

Si le chat contenait une décision qui n’a jamais été inscrite ailleurs, la traiter comme non garantie : la redemander uniquement si elle bloque réellement le travail.

## Discipline de PR

Chaque PR doit rester lisible sans le chat qui l’a créée. Sa description doit préciser le problème, la solution, les migrations/compatibilités, les tests, les limites et la suite éventuelle.

Le modèle de PR du dépôt rappelle les contrôles de continuité. Une PR purement documentaire peut marquer les tests non pertinents comme tels, mais les liens et garde-fous documentaires de la CI doivent rester verts.

## Modèle de checkpoint rapide

```md
## YYYY-MM-DD — <nom du lot>

Base observée : main `<sha>`.
PR : #<n> — <url>.
Head testé : `<sha>`.

Réalisé :
- ...

Validation :
- typecheck : ...
- tests unitaires : ...
- tests navigateur : ...
- build : ...
- CI : ...
- production : ...

Limites / non vérifié :
- ...

Prochaine action :
- ...
```

Ce protocole vaut également pour les autres agents ou assistants travaillant sur le dépôt : **le dépôt conserve l’état ; la conversation ne fait que l’accompagner.**
