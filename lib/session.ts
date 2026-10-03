import type { Preferences, Segment, TelemetrySample } from "./types";

export function compactTelemetry(samples: TelemetrySample[], maxSamples = 180) {
  if (samples.length <= maxSamples) return samples;
  const step = (samples.length - 1) / (maxSamples - 1);
  return Array.from({ length: maxSamples }, (_, i) => samples[Math.round(i * step)]);
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function beep() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.addEventListener("ended", () => context.close().catch(() => undefined));
  } catch {}
}

export function cueSegment(segment: Segment, preferences: Preferences) {
  if (typeof window === "undefined") return;
  if (preferences.soundCues) beep();
  if (preferences.haptics && "vibrate" in navigator) {
    try { navigator.vibrate([80, 50, 80]); } catch {}
  }
  if (preferences.voiceCues && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const resistance = segment.resistance === "libre" ? "résistance libre" : `niveau ${segment.resistance}`;
      const utterance = new SpeechSynthesisUtterance(`${segment.label}. ${resistance}.`);
      utterance.lang = "fr-FR";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

export async function requestScreenWakeLock() {
  const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<any> } };
  if (!nav.wakeLock) return null;
  try {
    return await nav.wakeLock.request("screen");
  } catch {
    return null;
  }
}
