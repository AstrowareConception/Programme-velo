"use client";

import { useEffect, useRef, useState } from "react";
import { diagnoseBle, type BleDiagnosticReport, type DiagnosticBluetooth } from "@/lib/ble-diagnostics";
import { hasWebBluetooth, webBluetoothHint } from "@/lib/ftms";
import { describeBleFailure } from "@/lib/ble-failure";

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
    <p>Ton vélo est prêt pour un premier essai. Cet inventaire lit les capacités annoncées, sans demander le contrôle ni changer la résistance.</p>
    <details><summary>Premier test du vélo · 10 à 15 minutes</summary>
      <ol>
        <li>Alimente le vélo et réveille sa console. Ferme les applications déjà connectées au vélo.</li>
        <li>Inspecte l’appareil ci-dessous puis exporte le rapport JSON. La connexion de diagnostic se ferme automatiquement.</li>
        <li>Dans le laboratoire FTMS juste après, connecte le vélo. Pédale doucement une minute puis arrête : compare vitesse, cadence et distance avec sa console.</li>
        <li>Si le contrôle est disponible, demande-le explicitement. Envoie le minimum annoncé, puis un seul pas au-dessus et reviens au minimum. Compare l’acquittement, l’écran et l’effort ressenti.</li>
        <li>Déconnecte puis reconnecte le vélo. L’auto-résistance reste désactivée ; deux niveaux testés ne suffisent pas à vérifier toute l’échelle 1–32.</li>
      </ol>
      <p>Note séparément la référence exacte, le firmware si affiché, le navigateur et les résultats. Sans FTMS visible, vérifie d’abord le réveil de la console et les permissions ; le mode manuel reste disponible.</p>
    </details>
    <p className="finePrint">Aucun nom, identifiant d’appareil, numéro de série, mesure cardiaque ou historique dans le rapport. Il reste en mémoire ; seul le bouton d’export crée un fichier local.</p>
    {disabled && <p>Déconnecte le vélo et quitte la séance avant cet inventaire.</p>}
    {!hasWebBluetooth() && <p>Web Bluetooth indisponible dans ce navigateur. {webBluetoothHint() === "ios" ? "Pour ce premier essai Bluetooth, ouvre VéloQuest avec Chrome sur un ordinateur Windows/Mac ou un appareil Android disposant du Bluetooth." : "Essaie Chrome sur Windows/Mac ou Android avec Bluetooth activé."} Le mode manuel reste disponible.</p>}
    <button className="secondary" disabled={disabled || busy || !hasWebBluetooth()} onClick={run}>{busy ? "Inventaire en cours…" : "Inspecter un appareil BLE"}</button>
    {busy && <button className="secondary" onClick={() => controller.current?.abort()}>Annuler l’inventaire</button>}
    <p className="finePrint">Périmètre : FTMS, fréquence cardiaque, cadence/vitesse et puissance cycliste. Les services propriétaires non autorisés ne sont pas visibles ici. Un service inaccessible ne prouve pas son absence.</p>
    {report && <div role="status">
      <p><strong>Qualification physique : non établie.</strong> {report.outcome === "inspected" ? "Inventaire terminé, connexion fermée." : "Inventaire incomplet ou annulé. Vérifie les permissions, le réveil du vélo et les autres applications connectées."}</p>
      {report.failure && <p>Étape interrompue : <strong>{describeBleFailure(report.failure)}</strong> La présence d’un service n’est confirmée qu’après sa découverte réussie.</p>}
      <ul>{report.services.map(service => <li key={service.uuid}>
        {service.uuid.slice(4, 8).toUpperCase()} : {service.status === "present" ? service.characteristicStatus === "present" ? `${service.characteristics.length} caractéristique(s) visible(s)` : "service présent, caractéristiques inaccessibles" : service.status === "not-found" ? "non trouvé lors de cet essai" : "inaccessible lors de cet essai"}
      </li>)}</ul>
      {report.outcome !== "inspected" && <p>Pour réessayer : ferme les autres applications et onglets Bluetooth, réveille la console, puis relance l’inventaire. Si l’échec se répète, exporte ce rapport et précise ton appareil, ton système et ton navigateur ; aucun contrôle de résistance n’a été envoyé.</p>}
      {report.ftms.featureStatus === "read" && <p>Commande de résistance annoncée : {(report.ftms.targetSettingsBits ?? 0) & 4 ? "oui, à tester séparément" : "non"}.</p>}
      {report.ftms.resistanceRange && <p>Plage FTMS annoncée : <strong>{report.ftms.resistanceRange.min}–{report.ftms.resistanceRange.max}</strong>, pas {report.ftms.resistanceRange.increment}. Ces unités restent à comparer aux niveaux de la console.</p>}
      <details><summary>Voir le rapport technique</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(report, null, 2)}</pre></details>
      <button className="secondary" onClick={download}>Exporter le rapport sans données personnelles</button>
      <button className="secondary" onClick={() => setReport(null)}>Effacer le rapport</button>
    </div>}
  </section>;
}
