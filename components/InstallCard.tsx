"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (standalone) {
    return (
      <section className="card installCard installed">
        <div className="installIcon">✓</div>
        <div><p className="eyebrow">PWA INSTALLÉE</p><h2>VeloQuest est sur ton appareil</h2><p>Lance-la depuis l’écran d’accueil pour une expérience plein écran et un accès hors ligne plus fiable.</p></div>
      </section>
    );
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  return (
    <section className="card installCard">
      <div className="installIcon">↧</div>
      <div className="installCopy">
        <p className="eyebrow">INSTALLATION</p>
        <h2>Installe VeloQuest comme une app</h2>
        {promptEvent ? (
          <p>Installation directe disponible sur cet appareil.</p>
        ) : ios ? (
          <p>Sur iPhone : ouvre le menu de partage du navigateur, puis <strong>Ajouter à l’écran d’accueil</strong> / <strong>Ouvrir comme app web</strong>.</p>
        ) : (
          <p>Ton navigateur proposera l’installation dès que les critères PWA seront remplis.</p>
        )}
      </div>
      {promptEvent && <button className="primary" onClick={install}>Installer</button>}
    </section>
  );
}
