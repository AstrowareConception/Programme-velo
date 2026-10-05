"use client";

import { useState } from "react";
import type { Preferences } from "@/lib/types";
import { testCueAudio } from "@/lib/session-cues";

type Props = { preferences: Preferences; onChange: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void };

export function ReaderViewChoice({ preferences, onChange }: Props) {
  return <div className="readerViewChoice" role="group" aria-label="Vue du lecteur">
    <button type="button" className="secondary" aria-pressed={preferences.readerView !== "essential"} onClick={() => onChange("readerView", "full")}>Vue complète</button>
    <button type="button" className="secondary" aria-pressed={preferences.readerView === "essential"} onClick={() => onChange("readerView", "essential")}>Vue essentielle</button>
  </div>;
}

export function SessionComfort({ preferences, onChange }: Props) {
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);
  async function test() {
    if (testing) return;
    setTesting(true);
    try { setNotice(await testCueAudio(preferences)); }
    finally { setTesting(false); }
  }
  return <details className="sessionComfort">
    <summary>Son, voix et média</summary>
    <div className="comfortFields">
      <label className="comfortCheck"><input type="checkbox" checked={preferences.soundCues} onChange={event => onChange("soundCues", event.target.checked)} />Bips de consigne</label>
      <label className="comfortCheck"><input type="checkbox" checked={preferences.voiceCues} onChange={event => onChange("voiceCues", event.target.checked)} />Voix du coach</label>
      <label>Volume des alertes · {preferences.cueVolume ?? 65}%<input aria-label="Volume des alertes" type="range" min="0" max="100" step="5" value={preferences.cueVolume ?? 65} onChange={event => onChange("cueVolume", Number(event.target.value))} /></label>
      <label>Fréquence des annonces<select value={preferences.cueFrequency ?? "all"} onChange={event => onChange("cueFrequency", event.target.value === "changes" ? "changes" : "all")}><option value="all">Tous les segments</option><option value="changes">Changements de consigne seulement</option></select></label>
      <label className="comfortCheck"><input type="checkbox" checked={preferences.announceUpcoming ?? false} onChange={event => onChange("announceUpcoming", event.target.checked)} />Prévenir 10 secondes avant le changement</label>
      <small>Préavis sur les segments minutés. En course pilotée par la distance du vélo, suis la prochaine consigne affichée.</small>
      <button type="button" className="secondary" disabled={testing} onClick={test}>Tester mes alertes</button>
      <p className="audioTestNotice" role="status">{notice}</p>
      <div className="mediaGuide"><strong>Avec un podcast ou une vidéo</strong><p>Lance ton podcast, puis garde VéloQuest visible. Pour YouTube, utilise une fenêtre flottante ; sur ordinateur ou tablette, tu peux garder les deux fenêtres côte à côte. La vue essentielle laisse les consignes et les commandes au premier plan.</p><p>Teste les alertes avec ton média avant de partir. En quittant l’application ou en verrouillant l’écran, les annonces et la connexion du vélo peuvent être interrompues.</p></div>
    </div>
  </details>;
}
