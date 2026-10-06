# Ancien protocole Bluetooth du TEB5

> Ce document décrit l’hypothèse matérielle historique. Il n’identifie pas le TOPUTURE commandé le 4 octobre 2026 et ne constitue pas un résultat de test. Pour cet exemplaire, commencer par [le diagnostic privé et la recette matérielle](HARDWARE-COMPATIBILITY.md). Les niveaux proposés plus bas ne doivent pas être envoyés avant vérification de la plage et des unités réellement annoncées.

Ce protocole doit être exécuté avec le vélo réel avant de considérer le pilotage automatique de résistance comme validé.

## Objectifs

1. Identifier le nom BLE réellement annoncé par l'exemplaire.
2. Vérifier la présence du service FTMS `0x1826`.
3. Inventorier les caractéristiques FTMS exposées.
4. Vérifier les données Indoor Bike Data `0x2AD2`.
5. Vérifier la plage de résistance `0x2AD6`.
6. Vérifier le Fitness Machine Control Point `0x2AD9`.
7. Demander explicitement le contrôle avec l'opcode `0x00`.
8. Tester une modification de résistance avec l'opcode `0x04`.
9. Confirmer que la résistance physique ressentie et la valeur affichée par le vélo correspondent.
10. Tester plusieurs changements successifs avant d'activer l'auto-résistance.

## Préconditions

- Utiliser Chrome ou Edge sur un appareil prenant en charge Web Bluetooth.
- Fermer FitShow, Kinomap, Zwift et toute autre application susceptible de conserver la connexion au vélo.
- Alimenter/réveiller le TEB5 et pédaler quelques secondes.
- Dans VeloQuest, ouvrir **Plus > Bluetooth Lab**.

## Étape 1 — Connexion

Cliquer **Lancer le diagnostic Bluetooth**.

À relever :

- nom du périphérique ;
- état FTMS ;
- présence de l'Indoor Bike Data ;
- présence du Control Point ;
- plage de résistance détectée ;
- support annoncé du Target Resistance Level.

La notice TEB5 fournie indique **1–32** niveaux (page imprimée FR 55). Relever la plage FTMS effectivement annoncée et sa correspondance avec ces niveaux ; cette notice ne démontre pas à elle seule le support des commandes FTMS.

## Étape 2 — Télémétrie

Pédaler tranquillement puis plus vite et vérifier :

- RPM ;
- vitesse ;
- watts ;
- niveau de résistance ;
- fréquence cardiaque si disponible ;
- calories si disponibles ;
- distance.

Comparer les chiffres avec l'écran physique du TEB5.

Tolérance : ne pas exiger une égalité parfaite sur les données dérivées (watts/calories) avant d'avoir vérifié le mode de calcul du firmware.

## Étape 3 — Contrôle FTMS

Dans le laboratoire, cliquer **Demander le contrôle FTMS**.

VeloQuest attend la réponse standard du Control Point. Ne poursuivre que si l'application affiche que le contrôle est accordé.

Un refus, un timeout ou une erreur doit être considéré comme un résultat réel à diagnostiquer, pas comme une raison de contourner l'acquittement.

## Étape 4 — Test de résistance manuel

Commencer avec une variation faible.

Exemple :

- résistance actuelle : 8 ;
- envoyer 10 ;
- confirmer la variation physique ;
- envoyer 8 ;
- confirmer le retour.

Puis tester plusieurs valeurs espacées : 5, 12, 20, 28, sans forcer si le comportement semble incohérent.

Pour chaque commande, VeloQuest attend l'acquittement FTMS.

## Étape 5 — Correspondance des niveaux

Créer un petit relevé :

| Cible VeloQuest | Valeur écran TEB5 | Ressenti | Validé |
| ---: | ---: | --- | --- |
| 5 |  |  |  |
| 8 |  |  |  |
| 12 |  |  |  |
| 16 |  |  |  |
| 20 |  |  |  |
| 24 |  |  |  |
| 28 |  |  |  |
| 32 |  |  |  |

Si un décalage constant est observé, utiliser la **calibration résistance** (-4 à +4) de VeloQuest.

Si la relation est non linéaire, ne pas utiliser l'offset : il faudra définir une courbe de calibration spécifique au TEB5.

## Étape 6 — Auto-résistance

N'activer **Auto-résistance pour cette connexion** qu'après validation des étapes précédentes.

Tester d'abord une séance courte avec des changements modérés :

- 8 ;
- 12 ;
- 16 ;
- 12 ;
- 8.

Ensuite seulement tester Ascension, Escalier ou un GPX.

## Critères de validation

Le pilotage TEB5 pourra être déclaré compatible lorsque :

- la connexion est reproductible ;
- la télémétrie reste stable pendant au moins 30 minutes ;
- les commandes sont acquittées ;
- la résistance change réellement dans le bon sens ;
- aucune commande ne provoque de saut incohérent ;
- une reconnexion après extinction/réveil fonctionne ;
- une déconnexion est gérée sans bloquer la séance.

## iPhone

Le mode manuel reste disponible sur les appareils qui n'exposent pas Web Bluetooth à la PWA. Le protocole doit donc être validé initialement depuis un navigateur compatible. Si une enveloppe native Capacitor/CoreBluetooth est ajoutée, les mêmes règles FTMS et les mêmes tests devront être rejoués sur iPhone.


## État de validation au 4 octobre 2026

Tests logiciels : paquets FTMS, moyennes, énergie, MET, temps, paquets tronqués, connexion simulée, acquittement et commandes simulées. Aucun essai sur l'exemplaire physique de Térence n'a été effectué dans ce lot.

Les parcours natifs, GPX et kilomètres simulés n'établissent ni la précision du compteur ni le changement de résistance réel. La distance FTMS représente le compteur du vélo ; les calories et watts transmis peuvent être des estimations du firmware.

Pour le relevé matériel, noter : appareil/navigateur/version, nom BLE, firmware si disponible, caractéristiques et flags, plage de résistance, messages d'acquittement, relevés écran/vélo, durée du test, déconnexion/reconnexion et évolution des compteurs distance/calories. Ne déclarer validées que les capacités effectivement observées.
