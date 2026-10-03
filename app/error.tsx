"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("VeloQuest UI error", error);
  }, [error]);

  return (
    <main className="fatalScreen">
      <div className="fatalCard">
        <span>⚠</span>
        <p className="eyebrow">VELOQUEST</p>
        <h1>Le cockpit a rencontré un problème.</h1>
        <p>Les données locales n’ont pas été effacées. Tu peux relancer l’interface.</p>
        <button className="primary" onClick={reset}>Relancer VeloQuest</button>
      </div>
    </main>
  );
}
