# VéloQuest — fiche de premier essai matériel

Vélo reçu le **6 octobre 2026**. Fiche vierge : aucune ligne ne constitue un résultat acquis. Prévoir 10 à 15 minutes, avec [la procédure complète](HARDWARE-COMPATIBILITY.md), disponible aussi dans Plus.

Référence exacte : __________  Firmware (si affiché) : __________

Appareil / OS / navigateur : __________  Version VéloQuest (Plus) : __________

Date de l’essai : __________

| Vérification | Observation à renseigner |
| --- | --- |
| Console réveillée, applications concurrentes fermées | __________ |
| Appareil sélectionnable dans VéloQuest | oui / non / incertain |
| Inventaire standard | complet / partiel / refus / délai |
| Export `veloquest-ble-diagnostic.json` | produit / non produit |
| FTMS `1826`, données `2AD2` | présent / non trouvé / inaccessible |
| Résistance annoncée : min / max / pas | __________ |
| Commande de résistance annoncée, Control Point | __________ |
| Une minute de pédalage : vitesse / cadence / distance | absent / partiel / cohérent / incohérent |
| Arrêt : dernier paquet et évolution des chiffres | __________ |
| Demande explicite de contrôle | accordée / refusée / délai / indisponible |
| Minimum FTMS : valeur / ACK / console / effet ressenti | __________ |
| Minimum + un pas : valeur / ACK / console / effet ressenti | __________ |
| Retour au minimum : ACK / console / effet ressenti | __________ |
| Déconnexion puis reconnexion | conforme / anomalie : __________ |
| Après reconnexion : contrôle et automatique désactivés | oui / non |

**Conclusion provisoire :** mode manuel / télémétrie seule / effet confirmé seulement sur les niveaux essayés / anomalie à examiner.

Ne pas activer l’auto-résistance au seul vu d’un acquittement. Le nom Bluetooth et les 32 niveaux commerciaux ne certifient pas FTMS. Ces deux commandes ne qualifient pas toute l’échelle. Si FTMS n’est pas trouvé, relever les seuls UUID/propriétés depuis un explorateur GATT local, sans commande propriétaire.

Pour la reprise, joindre le rapport JSON et préciser référence, navigateur et ce qui fonctionne. Le JSON n’inclut ni identifiant de vélo ni mesures personnelles. Ne pas recopier le numéro de série, l’adresse Bluetooth, les appareils voisins ni les valeurs cardiaques.
