"use client";
import { useEffect, useRef, useState } from "react";
import type { createBackup } from "@/lib/storage";

type Backup = ReturnType<typeof createBackup>;
export function BackupTransfer({ backup, filename, onClose }: { backup: Backup; filename: string; onClose: () => void }) {
  const text = JSON.stringify(backup, null, 2);
  const field = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { heading.current?.focus(); }, []);
  function select() { field.current?.focus(); field.current?.select(); field.current?.setSelectionRange(0, text.length); }
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(text);
      setNotice("Sauvegarde complète copiée. Transfère ce texte vers l’autre appareil, puis utilise Coller une sauvegarde.");
    } catch { select(); setNotice("Copie automatique indisponible. Le texte est sélectionné : utilise Copier dans le menu du téléphone."); }
  }
  async function share() {
    try {
      const files = [new File([text], filename, { type: "application/json" })];
      if (!navigator.share || !navigator.canShare?.({ files })) { setNotice("Le partage de fichier n’est pas disponible ici. Utilise Copier la sauvegarde ou la sélection manuelle ci-dessous."); return; }
      await navigator.share({ files });
      setNotice("Partage terminé. Vérifie la présence du fichier dans la destination choisie.");
    } catch (error) { setNotice(error instanceof Error && error.name === "AbortError" ? "Partage annulé. Ta sauvegarde reste disponible ci-dessous." : "Le partage n’a pas abouti. Utilise la copie ou la sélection manuelle ci-dessous."); }
  }
  return <section className="backupTransfer" aria-labelledby="backup-title">
    <h3 id="backup-title" ref={heading} tabIndex={-1}>Ta sauvegarde à transférer</h3>
    <p><strong>{backup.state.profile.name || "Profil sans nom"}</strong> · {backup.state.sessions.length} séance(s) · {backup.state.measurements.length} mesure(s)</p>
    {!backup.state.sessions.length && !backup.state.measurements.length && <p>Cette sauvegarde ne contient aucune séance ni mesure. Vérifie que tu utilises le navigateur où tes données sont visibles.</p>}
    <p>Si aucun fichier ne se télécharge, partage-le ou copie le texte complet. Sur l’autre appareil : Plus → Coller une sauvegarde.</p>
    <div className="backupButtons"><button type="button" className="secondary" onClick={share}>Partager le fichier JSON</button><button type="button" className="primary" onClick={copy}>Copier la sauvegarde</button></div>
    <label>Texte complet de la sauvegarde<textarea ref={field} readOnly value={text} spellCheck={false} /></label>
    <button type="button" className="secondary" onClick={() => { select(); setNotice("Tout le texte est sélectionné. Utilise Copier dans le menu du téléphone."); }}>Tout sélectionner</button>
    {notice && <p role="status">{notice}</p>}
    <button type="button" className="secondary" onClick={onClose}>Fermer les options d’export</button>
  </section>;
}
export function BackupPaste({ onImport }: { onImport: (file: File) => Promise<void> }) {
  const [text, setText] = useState("");
  return <details className="backupPaste"><summary>Coller une sauvegarde</summary><p>Colle le texte JSON complet copié depuis ton autre appareil. L’import remplace les données de ce navigateur.</p><label>Texte JSON à importer<textarea value={text} onChange={event => setText(event.target.value)} spellCheck={false} /></label><button type="button" className="secondary" disabled={!text.trim()} onClick={() => void onImport(new File([text], "sauvegarde-collee.json", { type: "application/json" }))}>Importer le texte collé</button></details>;
}
