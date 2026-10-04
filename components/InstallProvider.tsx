"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallResult = "accepted" | "dismissed" | "failed" | "unavailable";
const InstallContext = createContext<{
  available: boolean;
  installed: boolean;
  busy: boolean;
  notice: string;
  install: () => Promise<InstallResult>;
} | null>(null);

// Mounted from the home page, so an invitation received before opening Plus is retained.
export function InstallProvider({ children }: { children: ReactNode }) {
  const invitation = useRef<InstallEvent | null>(null);
  const inFlight = useRef(false);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const updateDisplay = () => {
      if (display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)) setInstalled(true);
    };
    const capture = (event: Event) => {
      if (typeof (event as InstallEvent).prompt !== "function") return;
      event.preventDefault();
      invitation.current = event as InstallEvent;
      setAvailable(true);
    };
    const complete = () => {
      invitation.current = null;
      setAvailable(false);
      setInstalled(true);
      setNotice("");
    };
    updateDisplay();
    display.addEventListener("change", updateDisplay);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => {
      display.removeEventListener("change", updateDisplay);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  async function install(): Promise<InstallResult> {
    const event = invitation.current;
    if (!event || inFlight.current) return "unavailable";
    invitation.current = null; // A browser invitation is consumed even after a dismissal.
    inFlight.current = true;
    setAvailable(false);
    setBusy(true);
    setNotice("");
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      setNotice(outcome === "accepted"
        ? "Installation acceptée. Termine les éventuelles étapes proposées par ton navigateur."
        : "Installation annulée. Tu peux continuer ici ou utiliser le menu de ton navigateur.");
      return outcome;
    } catch {
      setNotice("Le navigateur n’a pas pu ouvrir l’installation. Utilise les étapes ci-dessous.");
      return "failed";
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <InstallContext.Provider value={{ available, installed, busy, notice, install }}>{children}</InstallContext.Provider>;
}

export function useInstallation() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("InstallCard requires InstallProvider");
  return context;
}
