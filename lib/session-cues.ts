import type { Preferences, Segment } from "./types";

let audio: AudioContext | null = null;
let speaking = false;

export function adjustedResistance(label: string, offset: number) {
  if (!offset || label === "libre") return label;
  const values = label.match(/\d+(?:[.,]\d+)?/g)?.map(value => Number(value.replace(",", ".")));
  if (!values?.length) return label;
  const adjusted = values.map(value => Math.max(1, Math.min(32, Math.round(value + offset))));
  return adjusted.length === 1 ? String(adjusted[0]) : adjusted.join("–");
}

export function shouldCueSegment(segment: Segment, previous: Segment | undefined, preferences: Preferences) {
  return preferences.cueFrequency !== "changes" || !previous ||
    segment.resistance !== previous.resistance || segment.rpe !== previous.rpe || segment.cadence !== previous.cadence;
}

function context() {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  if (!audio || audio.state === "closed") audio = new Context();
  return audio;
}

// Called from a start, resume or test gesture; no silent media to bypass background restrictions.
export async function prepareCueAudio(preferences: Preferences) {
  if (!preferences.soundCues || preferences.cueVolume === 0) return true;
  try {
    const player = context();
    if (!player) return false;
    if (player.state === "suspended") await player.resume();
    return player.state === "running";
  } catch { return false; }
}

function beep(volume: number) {
  try {
    const player = context();
    if (!player || volume === 0) return;
    const oscillator = player.createOscillator();
    const gain = player.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, player.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.12 * volume), player.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, player.currentTime + 0.16);
    oscillator.connect(gain).connect(player.destination);
    oscillator.start();
    oscillator.stop(player.currentTime + 0.18);
    oscillator.addEventListener("ended", () => { oscillator.disconnect(); gain.disconnect(); }, { once: true });
  } catch { /* Visual guidance stays available if the platform refuses audio. */ }
}

export function cueSegment(segment: Segment, preferences: Preferences, options: { previous?: Segment; upcoming?: boolean } = {}) {
  if (typeof window === "undefined" || !shouldCueSegment(segment, options.previous, preferences)) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const volume = Math.max(0, Math.min(100, preferences.cueVolume ?? 65)) / 100;
  if (preferences.soundCues && volume > 0) beep(volume);
  if (preferences.haptics && "vibrate" in navigator) {
    try { navigator.vibrate([80, 50, 80]); } catch {}
  }
  if (preferences.voiceCues && volume > 0 && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
    try {
      if (speaking) window.speechSynthesis.cancel();
      const level = adjustedResistance(segment.resistance, preferences.resistanceOffset);
      const resistance = level === "libre" ? "résistance libre" : `niveau ${level}`;
      const utterance = new SpeechSynthesisUtterance(`${options.upcoming ? "Dans dix secondes. " : ""}${segment.label}. ${resistance}. Effort visé ${segment.rpe} sur dix.${segment.cadence ? ` Cadence ${segment.cadence === "libre" ? "libre" : segment.cadence + " tours par minute"}.` : ""}`);
      utterance.lang = "fr-FR";
      utterance.rate = 1.05;
      utterance.volume = volume;
      utterance.onend = utterance.onerror = () => { speaking = false; };
      speaking = true;
      window.speechSynthesis.speak(utterance);
    } catch { speaking = false; }
  }
}

export async function testCueAudio(preferences: Preferences) {
  if (!preferences.soundCues && !preferences.voiceCues) return "Active les bips ou la voix pour tester les alertes.";
  if (preferences.cueVolume === 0) return "Le volume des alertes est à zéro.";
  const beepReady = await prepareCueAudio(preferences);
  const voiceReady = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if ((!preferences.soundCues || !beepReady) && (!preferences.voiceCues || !voiceReady)) return "Les alertes audio sont indisponibles ici. Les consignes restent affichées.";
  cueSegment({ label: "Test des alertes VéloQuest", minutes: 1, resistance: "8", rpe: "3" }, { ...preferences, haptics: false });
  return "Test envoyé. Vérifie que tu l’entends avec ton casque ou ton podcast ; le volume du téléphone compte aussi.";
}

export function releaseCueAudio(keepAudio = false) {
  const player = audio;
  if (!keepAudio) {
    audio = null;
    try { if (player && player.state !== "closed") void player.close().catch(() => undefined); } catch {}
  }
  try { if (speaking && typeof window !== "undefined") window.speechSynthesis.cancel(); } catch {}
  speaking = false;
}

/** Supplemental coaching never interrupts an existing segment announcement. */
export function cueCoach(text: string, preferences: Preferences) {
  if (typeof window === "undefined" || !preferences.voiceCues || document.visibilityState === "hidden" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window) || speaking || window.speechSynthesis.speaking) return false;
  const volume = Math.max(0, Math.min(100, preferences.cueVolume ?? 65)) / 100;
  if (!volume) return false;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR"; utterance.rate = 1.05; utterance.volume = volume;
    speaking = true;
    utterance.onend = utterance.onerror = () => { speaking = false; };
    window.speechSynthesis.speak(utterance);
    return true;
  } catch { speaking = false; return false; }
}

export function coachIsSpeaking() { return speaking || (typeof window !== "undefined" && Boolean(window.speechSynthesis?.speaking)); }

/** Short reward arpeggio, using the existing volume and sound/haptic preferences. */
export function cueTrophyReward(preferences: Preferences) {
  if (typeof window === 'undefined' || document.visibilityState === 'hidden') return;
  const volume = Math.max(0, Math.min(100, preferences.cueVolume ?? 65)) / 100;
  try {
    const player = audio;
    if (preferences.soundCues && volume && player?.state === 'running') {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
        const oscillator = player.createOscillator(), gain = player.createGain();
        const start = player.currentTime + i * .11;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0001, .1 * volume), start + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .24);
        oscillator.connect(gain).connect(player.destination); oscillator.start(start); oscillator.stop(start + .26);
        oscillator.addEventListener('ended', () => { oscillator.disconnect(); gain.disconnect(); }, { once: true });
      });
    }
    if (preferences.haptics && 'vibrate' in navigator) navigator.vibrate([60, 50, 100]);
  } catch { /* A refused sound never prevents the visual reward. */ }
}
