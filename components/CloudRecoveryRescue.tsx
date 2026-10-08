"use client";
import { useState } from "react";
import { BackupTransfer } from "./BackupTransfer";
import { createBackup, normalizeState } from "@/lib/storage";
/** Read-only escape hatch: never replace an interrupted restore with an empty profile. */
export function CloudRecoveryRescue() {
  const [backup] = useState(() => {
    try {
      const journal = JSON.parse(localStorage.getItem("veloquest:cloud-apply:v1") ?? "null");
      return createBackup(normalizeState(JSON.parse(journal["veloquest:v1"])), JSON.parse(journal["veloquest:custom-routes:v1"]));
    } catch { return null; }
  });
  return <main className="legalShell"><h1>Ta restauration locale est protégée</h1><p>Le navigateur n’a pas terminé l’écriture. Aucune nouvelle séance ne sera ajoutée tant que cette restauration n’est pas résolue. Conserve d’abord une copie de récupération, puis recharge pour réessayer.</p>
    {backup ? <BackupTransfer backup={backup} filename="veloquest-recuperation.json" onClose={() => {}} /> : <p role="alert">La copie de récupération n’est pas lisible ici. Ne supprime pas les données du navigateur ; contacte le support.</p>}
    <button className="primary" onClick={() => window.location.reload()}>Réessayer la restauration locale</button>
  </main>;
}
