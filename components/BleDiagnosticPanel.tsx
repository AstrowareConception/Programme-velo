"use client";

import { useEffect, useRef, useState } from "react";
import { diagnoseBle, type BleDiagnosticReport, type DiagnosticBluetooth } from "@/lib/ble-diagnostics";
import { hasWebBluetooth } from "@/lib/ftms";

export function BleDiagnosticPanel({ disabled, onBusyChange }: { disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [report, setReport] = useState<BleDiagnosticReport | null>(null);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); onBusyChange(false); }, [onBusyChange]);

  async function run() {
    const bluetooth = (navigator as Navigator & { bluetooth?: DiagnosticBluetooth }).bluetooth;
    if (!bluetooth || disabled || controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setReport(null);
    setBusy(true);
    onBusyChange(true);
    try {
      const result = await diagnoseBle(bluetooth, current.signal);
      if (!current.signal.aborted) setReport(result);
    } finally {
      controller.current = null;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function download() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "veloquest-ble-diagnostic.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="card" aria-label="Diagnostic matériel BLE">
    <p className="eyebrow">COMPATIBILITÉ MATÉRIELLE</p>
    <h2>Explorer les services Bluetooth</h2>
    <p>Le TOPUTURE commandé reste à qualifier. Cet inventaire lit les capacités annoncées, sans demander le contrôle ni changer la résistance.</p>
    <p className="finePrint">Aucun nom, identifiant d’appareil, numéro de série, mesure cardiaque ou historique dans le rapport. Il reste en mémoire ; seul le bouton d’export crée un fichier local.</p>
    {disabled && <p>Déconnecte le vélo et quitte la séance avant cet inventaire.</p>}
    {!hasWebBluetooth() && <p>Web Bluetooth indisponible dans ce navigateur. Utilise un navigateur compatible pour l’inventaire ; le mode manuel reste disponible.</p>}
    <button className="secondary" disabled={disabled || busy || !hasWebBluetooth()} onClick={run}>{busy ? "Inventaire en cours…" : "Inspecter un appareil BLE"}</button>
    {busy && <button className="secondary" onClick={() => controller.current?.abort()}>Annuler l’inventaire</button>}
    <p className="finePrint">Périmètre : FTMS, fréquence cardiaque, cadence/vitesse et puissance cycliste. Les services propriétaires non autorisés ne sont pas visibles ici. Un service inaccessible ne prouve pas son absence.</p>
    {report && <div role="status">
      <p><strong>Qualification physique : non établie.</strong> {report.outcome === "inspected" ? "Inventaire terminé, connexion fermée." : "Inventaire incomplet ou annulé. Vérifie les permissions, le réveil du vélo et les autres applications connectées."}</p>
      <ul>{report.services.map(service => <li key={service.uuid}>
        {service.uuid.slice(4, 8).toUpperCase()} : {service.status === "present" ? service.characteristicStatus === "present" ? `${service.characteristics.length} caractéristique(s) visible(s)` : "service présent, caractéristiques inaccessibles" : service.status === "not-found" ? "non trouvé lors de cet essai" : "inaccessible lors de cet essai"}
      </li>)}</ul>
      <details><summary>Voir le rapport technique</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(report, null, 2)}</pre></details>
      <button className="secondary" onClick={download}>Exporter le rapport sans données personnelles</button>
      <button className="secondary" onClick={() => setReport(null)}>Effacer le rapport</button>
    </div>}
  </section>;
}
