"use client";

import { useEffect, useRef, useState } from "react";
import { useInstallation } from "@/components/InstallProvider";

type BrowserGuide = "ios" | "safari" | "android" | "edge" | "chrome" | "other";

export function InstallCard() {
  const { available, installed, busy, notice, install } = useInstallation();
  const [help, setHelp] = useState(false);
  const [browser, setBrowser] = useState<BrowserGuide>("other");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) setBrowser("ios");
    else if (/Android/.test(ua)) setBrowser("android");
    else if (/Edg\//.test(ua)) setBrowser("edge");
    else if (/Chrome\//.test(ua)) setBrowser("chrome");
    else if (/Safari\//.test(ua)) setBrowser("safari");
  }, []);

  async function activate() {
    if (busy) return;
    if (!available) { setHelp(true); return; }
    const result = await install();
    setHelp(result === "failed" || result === "unavailable");
  }

  if (installed) return (
    <section className="card installCard installed" aria-label="VeloQuest installée">
      <div className="installIcon" aria-hidden="true">✓</div>
      <div><p className="eyebrow">PWA INSTALLÉE</p><h2>VeloQuest est sur ton appareil</h2><p>Lance-la depuis son icône pour retrouver tes séances en plein écran.</p></div>
    </section>
  );

  return (
    <>
      <button type="button" className="card installCard installAction" onClick={activate} disabled={busy} aria-label="Installer VeloQuest" aria-describedby="installation-description">
        <span className="installIcon" aria-hidden="true">↧</span>
        <span className="installCopy">
          <span className="eyebrow">INSTALLATION</span>
          <span className="installTitle">Installe VeloQuest comme une app</span>
          <span id="installation-description" className="installDescription">{available ? "Ouvre la confirmation d’installation de ton navigateur." : "Touche ce cadre pour voir comment l’installer sur ton appareil."}</span>
        </span>
        <span className="primary" aria-hidden="true">{busy ? "Ouverture…" : available ? "Installer" : "Installer / voir les étapes"}</span>
      </button>
      {notice && <p className="installNotice" role="status">{notice}</p>}
      {help && <InstallationHelp browser={browser} available={available} busy={busy} notice={notice} onInstall={activate} onClose={() => setHelp(false)} />}
    </>
  );
}

function InstallationHelp({ browser, available, busy, notice, onInstall, onClose }: {
  browser: BrowserGuide; available: boolean; busy: boolean; notice: string;
  onInstall: () => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus();
    return () => element?.close();
  }, []);

  const guides: Record<BrowserGuide, { title: string; steps: string[] }> = {
    ios: { title: "Sur iPhone ou iPad", steps: ["Ouvre cette même adresse dans Safari si ton navigateur ne propose pas l’ajout à l’accueil.", "Ouvre Partager (parfois dans le menu de la page).", "Choisis Sur l’écran d’accueil ou Ajouter à l’écran d’accueil.", "Active Ouvrir comme app web si proposé, puis touche Ajouter."] },
    safari: { title: "Avec Safari sur Mac", steps: ["Ouvre le bouton Partager de Safari.", "Choisis Ajouter au Dock, puis confirme Ajouter."] },
    android: { title: "Sur Android", steps: ["Ouvre le menu ⋮ de ton navigateur.", "Cherche Installer l’application ou Ajouter à l’écran d’accueil.", "Confirme l’installation si elle est proposée."] },
    edge: { title: "Avec Microsoft Edge", steps: ["Ouvre le menu ⋯, puis Applications (parfois dans Autres outils).", "Choisis Installer VeloQuest ou Installer ce site en tant qu’application, puis confirme."] },
    chrome: { title: "Avec Google Chrome", steps: ["Cherche l’icône d’installation à droite de la barre d’adresse.", "Sinon, ouvre le menu ⋮, puis Caster, enregistrer et partager : Installer la page en tant qu’appli (ou Installer VeloQuest).", "Confirme l’installation si elle est proposée."] },
    other: { title: "Avec ton navigateur", steps: ["Ouvre le menu de ton navigateur.", "Cherche Installer l’application ou Ajouter à l’écran d’accueil, puis confirme si l’option existe.", "Si cette option est absente, tu peux continuer à utiliser VeloQuest ici."] }
  };
  const guide = guides[browser];
  const dismiss = () => { dialog.current?.close(); onClose(); };
  return (
    <dialog ref={dialog} className="onboardingDialog installationDialog" aria-labelledby="installation-title" onCancel={(event) => { event.preventDefault(); dismiss(); }}>
      <p className="eyebrow">INSTALLER VELOQUEST</p>
      <h2 id="installation-title" ref={heading} tabIndex={-1}>{guide.title}</h2>
      <p>{available ? "Ton navigateur propose maintenant l’installation directe. Utilise Installer maintenant ou son menu." : "Le navigateur ne propose pas de confirmation directe pour le moment. Tu peux utiliser son menu ; les intitulés varient selon sa version."}</p>
      {notice && <p className="guideHint">{notice}</p>}
      <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <p className="finePrint">Ton historique reste lié à ce navigateur et à cet appareil. Avant d’en changer, exporte ta sauvegarde dans Plus. Si VeloQuest est déjà installée, lance-la depuis son icône.</p>
      {available && <button type="button" className="primary fullWidth" disabled={busy} onClick={onInstall}>Installer maintenant</button>}
      <button type="button" className="secondary fullWidth" onClick={dismiss}>J’ai compris</button>
    </dialog>
  );
}
