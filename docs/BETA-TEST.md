# Recette de la bêta privée VéloQuest

Le socle de découverte est livré. Ce protocole prépare les essais ; il ne signifie pas qu’ils ont déjà été réalisés ni que la compatibilité de tous les vélos est acquise.

## Avant l’essai

Noter la version affichée dans Plus, l’appareil, le navigateur, l’installation éventuelle en PWA et le modèle de vélo. Exporter l’historique existant avant une manipulation de test. Pour simuler un stockage plein ou une sauvegarde invalide, utiliser uniquement les tests automatisés ou un profil de navigateur dédié contenant des données fictives.

## Parcours à observer

| Parcours | Action | Résultat attendu |
| --- | --- | --- |
| Première découverte | Laisser un nouveau venu choisir et préparer une séance sans explication orale | Il trouve le départ, comprend les consignes et sait consulter le lexique |
| Mode manuel | Pédaler sans connecter de vélo, terminer, saisir les mesures connues | Les inconnues peuvent rester vides ; les mesures et le ressenti saisis se retrouvent dans Suivi après rechargement |
| Tablette | Passer portrait/paysage en préparation, en lecture et au bilan | Les réglages et champs restent présents ; les commandes principales restent accessibles |
| Pause et reprise | Mettre en pause, mettre la séance de côté, recharger et reprendre | La proposition de reprise apparaît avec la progression sauvegardée ; une seule séance est finalement enregistrée |
| Arrière-plan réel | Passer brièvement dans une autre application puis revenir | Vérifier le temps, les consignes, le maintien de l’écran et la connexion ; noter ce que le navigateur interrompt réellement |
| Vélo connecté | Recevoir des mesures, déconnecter puis reconnecter dans un environnement maîtrisé | L’état de connexion est compréhensible ; les valeurs absentes ne sont pas interprétées comme zéro ; vérifier la sauvegarde finale |
| Pilotage | Sur un vélo déjà qualifié, vérifier quelques niveaux et les commandes Alléger/Renforcer | Comparer la consigne, la valeur reçue et l’effet physique ; ne pas généraliser à un autre modèle |
| Refus d’écriture simulé | En test automatisé, refuser l’écriture de l’historique, puis l’autoriser | Le bilan reste ouvert avec les valeurs, la reprise existe encore, la nouvelle tentative enregistre une seule séance avant de supprimer la reprise |
| Sauvegarde et transfert | Exporter puis importer dans un profil de test séparé | Retrouver séances, mesures, parcours personnels et progression ; conserver le fichier original |

Pour les modes chronométrés, vérifier leur règle propre de pause : le chrono de course continue. Pour Voyage, une portion inachevée ne doit pas valider des kilomètres de progression. Les tests automatisés couvrent ces règles ; les observations matérielles doivent être notées séparément.

## Fiche de retour

- Version de VéloQuest :
- Appareil / système / navigateur / PWA :
- Vélo et fonctions utilisées : manuel, mesures, pilotage, fréquence cardiaque…
- Étapes effectuées :
- Résultat attendu / résultat observé :
- Reproductible ? À quelle fréquence ?
- Séance retrouvée après rechargement ?
- Capture facultative, après masquage des informations personnelles :
- Ce qui a nécessité une explication pendant la découverte :

Ne pas joindre une sauvegarde complète par défaut : elle peut contenir des données personnelles et corporelles. Un diagnostic technique prévisualisable reste un prochain chantier ; aucun envoi automatique n’est ajouté.

## Conditions pour élargir la bêta

Plusieurs utilisateurs doivent réussir une séance complète, la retrouver après rechargement et comprendre comment sauvegarder leurs données. Corriger tout blocage critique ou perte de données connue avant d’élargir. Consigner les combinaisons matériel/navigateur réellement essayées, leurs capacités et leurs limites. Les résultats de la CI ne remplacent pas ces essais.

Voir [la roadmap](ROADMAP.md), [le confort de séance](READER-COMFORT.md) et [l’état de reprise](PROJECT-STATE.md).
