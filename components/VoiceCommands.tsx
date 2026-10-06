"use client";
import { useEffect, useRef, useState } from "react";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import { coachIsSpeaking } from "@/lib/session-cues";
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  start(): void; abort(): void;
};
type Constructor = new () => Recognition;
function recognitionType() { const w = window as typeof window & { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor }; return w.SpeechRecognition ?? w.webkitSpeechRecognition; }
export function VoiceCommands({ onCommand }: { onCommand: (command: VoiceCommand) => string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("Micro coupé");
  const current = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const restart = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const action = useRef(onCommand);
  useEffect(() => { action.current = onCommand; }, [onCommand]);
  function stop(message = "Micro coupé") {
    wanted.current = false; clearTimeout(restart.current);
    const recognition = current.current; current.current = null;
    if (recognition) { recognition.onend = null; recognition.onresult = null; recognition.onerror = null; recognition.onstart = null; try { recognition.abort(); } catch {} }
    setEnabled(false); setNotice(message);
  }
  useEffect(() => {
    setSupported(Boolean(recognitionType()));
    const hide = () => { if (document.hidden) stop("Écoute arrêtée en arrière-plan. Réactive-la au retour."); };
    document.addEventListener("visibilitychange", hide);
    return () => { wanted.current = false; clearTimeout(restart.current); if (current.current) { current.current.onend = null; current.current.onresult = null; current.current.onerror = null; current.current.onstart = null; try { current.current.abort(); } catch {} } document.removeEventListener("visibilitychange", hide); };
  }, []);
  function start() {
    if (wanted.current) return;
    const Type = recognitionType(); if (!Type) return;
    let recognition: Recognition;
    try { recognition = new Type(); } catch { setNotice("Reconnaissance indisponible dans ce navigateur."); return; }
    current.current = recognition; wanted.current = true;
    let restarts = 0; let lastCommandAt = -Infinity;
    recognition.lang = "fr-FR"; recognition.continuous = true; recognition.interimResults = false;
    setEnabled(true); setNotice("Demande d’accès au micro…");
    recognition.onstart = () => { if (wanted.current) setNotice("Écoute active · commence par « Vélo »"); };
    recognition.onerror = event => stop(event.error === "not-allowed" || event.error === "service-not-allowed" ? "Micro ou reconnaissance vocale refusés. Vérifie les autorisations du navigateur." : event.error === "audio-capture" ? "Aucun micro disponible." : "Reconnaissance interrompue. Tu peux réessayer.");
    recognition.onend = () => {
      if (!wanted.current) return;
      if (++restarts > 3) { stop("L’écoute s’arrête dans ce navigateur. Réactive-la pour continuer."); return; }
      setNotice("Reprise de l’écoute…");
      restart.current = setTimeout(() => { if (wanted.current) { try { recognition.start(); } catch { stop("Écoute indisponible. Tu peux réessayer."); } } }, 500);
    };
    recognition.onresult = event => {
      if (!wanted.current || document.hidden || coachIsSpeaking()) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]; if (!result.isFinal) continue;
        const command = parseVoiceCommand(result[0].transcript);
        if (!command || Date.now() - lastCommandAt < 2000) continue;
        lastCommandAt = Date.now(); setNotice(action.current(command)); break;
      }
    };
    try { recognition.start(); } catch { stop("Impossible de démarrer l’écoute dans ce navigateur."); }
  }
  return <details className="sessionComfort voiceCommands"><summary>Commandes vocales{enabled ? " · activées" : ""}</summary>
    <p>« Vélo allège », « Vélo renforce », « Vélo pause », « Vélo reprends ».</p>
    <p className="finePrint">Écoute facultative pendant le lecteur. Selon le navigateur, la voix peut être traitée par un service en ligne ; VéloQuest ne conserve ni audio ni transcription. Coupe le micro quand tu as terminé.</p>
    {supported ? <button type="button" className="secondary" aria-pressed={enabled} onClick={() => enabled ? stop() : start()}>{enabled ? "Couper le micro" : "Activer les commandes vocales"}</button> : <p>Commandes vocales indisponibles dans ce navigateur. Les boutons restent utilisables.</p>}
    <p role="status">{notice}</p>
  </details>;
}
