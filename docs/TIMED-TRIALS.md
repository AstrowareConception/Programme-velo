# Défis chrono et score cadence V2

Dans **Séances → Défis chrono**, six épreuves complètent les parcours Time Attack, Segment Attack et défis calories :

| Épreuve | Objectif | Record |
| --- | --- | --- |
| La minute express | 1 minute | Plus grande distance |
| Les cinq minutes | 5 minutes | Plus grande distance |
| Les douze minutes | 12 minutes | Plus grande distance |
| Le kilomètre lancé | 1 km | Temps le plus court |
| La poursuite | 5 km | Temps le plus court |
| Le contre-la-montre | 10 km | Temps le plus court |

## Départ lancé

Échauffe-toi avant le défi puis choisis son origine de mesure. Pendant **5, 4, 3, 2, 1**, prends ton élan : cette distance et ces secondes sont exclues. Le chrono ne peut pas être mis en pause. Résistance et cadence restent libres ; aucune commande de résistance automatique n’est ajoutée.

Avec un vélo connecté, le premier relevé de distance reçu après le compte à rebours déclenche le chrono et fixe le zéro. Sans relevé dans les cinq secondes suivantes, le départ est refusé. Pour une distance imposée, le temps de franchissement est interpolé entre les deux paquets encadrant l’arrivée. Pour un temps imposé, le dernier compteur reçu avant la limite est retenu : aucune distance postérieure n’est ajoutée. Un relevé final datant de plus de deux secondes avant l’arrivée exclut le record. Il peut donc y avoir une légère sous-estimation, jamais une distance ajoutée après l’épreuve.

En mode déclaré, le signal « Partez » démarre le chrono. Relève le compteur de ta console à ce moment. À temps fixé, saisis la différence de distance au bilan ; à distance fixée, clique sur **Distance atteinte** à l’arrivée. Ces résultats sont toujours déclarés et classés séparément.

Un compteur qui recule, une coupure, un trou de télémétrie supérieur à cinq secondes ou un rechargement empêche un record mesuré. L’arrêt anticipé conserve un journal sans record ni récompense de complétion. Limite technique d’une heure par épreuve. Garde la fenêtre visible pour recevoir les mesures. Le maintien de l’écran reprend ton réglage habituel ; son état et le bouton de relance restent visibles.

## Historique et fiabilité

Relis le bilan, coche la confirmation puis enregistre. Si le stockage refuse, la fenêtre reste ouverte pour réessayer. La reprise locale retrouve le dernier état enregistré sous forme de bilan **hors record** ; elle ne fabrique pas les mesures manquantes. Si cette reprise ne peut pas s’écrire, un avertissement demande de garder la fenêtre ouverte. L’export/import v3 inclut les résultats enregistrés.

Les records FTMS sont groupés par épreuve et nom du vélo connecté. Un nom n’identifie pas toujours un exemplaire unique ; utiliser le même vélo et des conditions similaires. Résistance libre et étalonnage de la console limitent les comparaisons : ce ne sont pas des records de puissance universels. Les défis comptent comme séances intenses. Les épreuves terminées rapportent 15 XP et 0,5 point sous dix minutes, 1 point au-delà ; les interruptions ne rapportent pas ces bonus.

## Mesures pendant l’épreuve

En mode vélo connecté, la **vitesse instantanée en km/h** est affichée dès le compte à rebours puis pendant la course, accompagnée de la cadence (tr/min), de la puissance (W) et de la fréquence cardiaque (bpm) lorsqu’elles sont transmises. Sur tablette paysage, chrono et mesures sont côte à côte ; sur téléphone, ils se succèdent. Les valeurs changeantes ne déclenchent pas d’annonce vocale permanente.

Un tiret signifie qu’une mesure n’est pas reçue ou n’est plus récente : cinq secondes pour vitesse, cadence et puissance, dix pour la fréquence cardiaque. Chaque champ possède sa propre date de réception ; une nouvelle distance ne rajeunit pas une ancienne vitesse. Une vitesse reçue de zéro reste affichée **0,0 km/h**. Aucun calcul depuis la cadence ni vitesse simulée ne remplace une valeur absente. En mode déclaré, lis ces informations sur la console.

Le bilan et l’historique affichent la **vitesse moyenne calculée** à partir de la distance du défi et de son temps, sans les cinq secondes d’élan. Elle est distincte de la vitesse instantanée diffusée par la console et reste fondée sur les valeurs déclarées lorsque le résultat est manuel. Ces indications ne changent ni le chronométrage, ni la sélection des records, ni les sauvegardes existantes.

## Points et note des séances guidées

Le **score V2** est distinct de la **note** :

- Base : `cadence en tr/min ÷ 6` points par seconde. À 60 tr/min : 10 points/s ; à 75 : 12,5 points/s.
- Dans la cible : combo ×2 après 10 secondes, ×3 après 20, ×4 après 30.
- Hors cible : les points de base continuent, combo remis à zéro.
- À zéro tr/min : zéro point. Pauses et mesures absentes ne rapportent rien.
- Note : même pourcentage de temps mesuré dans la cible, même barème S à E.

Les cartes affichent les points et la note du meilleur score comparable. Les classements choisissent les **points** à réglages et version identiques. Comme avant, séance complète, au moins 60 secondes mesurées et 80 % de couverture sont nécessaires. Les anciens scores V1 restent lisibles dans l’historique mais ne concurrencent pas V2 ; aucune séance ni XP n’est supprimé. Une ancienne séance en reprise reste V1, sans mélange des barèmes. Le score représente le jeu, pas la puissance ni l’énergie physiologique.

## Recette

Automatiser les deux modes de départ, exclusion des mètres d’élan, arrivée exacte/interpolée, délai fixe, resets et trous, arrêt/rechargement, refus d’écriture et réessai unique, conservation après export/import, comparaison par appareil/source et affichage des notes distinctes des points. Vérifier mobile, ordinateur et WebKit ; inspecter aussi tablette paysage. La simulation Bluetooth n’établit pas la qualification d’un vélo réel.
