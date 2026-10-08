"use client";

import { useEffect, useRef, useState } from "react";
import { usePwa } from "@/components/PwaProvider";
import { hasWebBluetooth } from "@/lib/ftms";
import { buildSupportDiagnostic, type SupportDiagnosticInput } from "@/lib/support-diagnostic";

type Props = Pick<SupportDiagnosticInput, "storage" | "session" | "bluetooth">;
export function SupportDiagnosticPanel({ storage, session, bluetooth }: Props) {
  const pwa = usePwa();
  const [report, setReport] = useState<ReturnType<typeof buildSupportDiagnostic> | null>(null);
  const [notice, setNotice] = useState("");
  const [copying, setCopying] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const generateButton = useRef<HTMLButtonElement>(null);
  const text = report ? JSON.stringify(report, null, 2) : "";
  useEffect(() => { if (report) heading.current?.focus(); }, [report]);

  function generate() {
    setReport(buildSupportDiagnostic({
      buildCommit: process.env.NEXT_PUBLIC_BUILD_COMMIT,
      environment: {
        width: window.innerWidth, height: window.innerHeight,
        standalone: window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
        online: navigator.onLine, secureContext: window.isSecureContext,
        webBluetooth: hasWebBluetooth(), serviceWorker: "serviceWorker" in navigator,
        clipboard: typeof navigator.clipboard?.writeText === "function", wakeLock: "wakeLock" in navigator
      },
      pwa: {
        registered: pwa.available, controlled: Boolean(navigator.serviceWorker?.controller),
        updateWaiting: pwa.waiting, busy: pwa.busy, cache: pwa.availability
      },
      storage, session, bluetooth
    }));
    setNotice("");
  }
  function select() {
    field.current?.focus(); field.current?.select(); field.current?.setSelectionRange(0, text.length);
  }
  async function copy() {
    setCopying(true);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(text);
      setNotice("Rapport copié. Tu peux le joindre à ton retour en choisissant son destinataire.");
    } catch {
      select(); setNotice("Copie automatique indisponible. Le texte est sélectionné : utilise Copier dans le menu de ton appareil.");
    } finally { setCopying(false); }
  }
  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = "veloquest-diagnostic-support.json";
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      setNotice("Téléchargement demandé. Si aucun fichier n’apparaît, utilise Copier le rapport ou Tout sélectionner.");
    } catch { setNotice("Téléchargement indisponible. Utilise Copier le rapport ou Tout sélectionner."); }
    finally { if (url) { const blobUrl = url; window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000); } }
  }

  return <section className="card supportDiagnostic" aria-labelledby="support-diagnostic-title">
    <p className="eyebrow">AIDE & RETOURS</p>
    <h2 id="support-diagnostic-title">Un souci avec VéloQuest ?</h2>
    <p>Prépare un rapport technique pour accompagner ton retour : version ouverte, affichage, connexion et état de l’application.</p>
    <p className="muted">Sans nom, historique, mesures corporelles, trace GPS ni identifiant du vélo. Aucun envoi automatique : le rapport reste en mémoire sur cette page jusqu’à son effacement ou jusqu’à ce que tu quittes cet écran.</p>
    <button ref={generateButton} type="button" className="secondary" disabled={copying} onClick={generate}>{report ? "Actualiser le rapport" : "Préparer un diagnostic"}</button>
    {report && <div className="backupTransfer supportPreview">
      <h3 ref={heading} tabIndex={-1}>Vérifie avant de partager</h3>
      <p>Version ouverte : <strong>{report.app.openedBuild.slice(0, 7)}</strong> · {report.environment.viewport.width} × {report.environment.viewport.height} · {report.environment.online ? "En ligne" : "Hors connexion"}</p>
      <p>Ce texte est exactement celui qui sera copié ou exporté. Il décrit l’instant où tu l’as préparé ; actualise-le après avoir reproduit le problème.</p>
      <label>Rapport technique complet<textarea ref={field} readOnly value={text} spellCheck={false} /></label>
      <div className="backupButtons">
        <button type="button" className="primary" disabled={copying} onClick={() => void copy()}>{copying ? "Copie en cours…" : "Copier le rapport"}</button>
        <button type="button" className="secondary" onClick={download}>Exporter le rapport JSON</button>
        <button type="button" className="secondary" onClick={() => { select(); setNotice("Tout le rapport est sélectionné. Utilise Copier dans le menu de ton appareil."); }}>Tout sélectionner</button>
      </div>
      <p className="finePrint">Les capacités indiquent ce que le navigateur expose, pas une compatibilité matérielle garantie. L’absence d’erreur observée ne garantit pas une sauvegarde : le rapport ne teste pas le stockage et ne remplace pas un export de tes données.</p>
      <p className="finePrint">Dans ton retour, précise l’appareil, le navigateur, les étapes suivies et le résultat attendu. Pour inspecter un vélo, utilise le diagnostic matériel BLE plus bas.</p>
      {notice && <p role="status">{notice}</p>}
      <button type="button" className="secondary" disabled={copying} onClick={() => { setReport(null); setNotice(""); generateButton.current?.focus(); }}>Effacer le diagnostic</button>
    </div>}
  </section>;
}
