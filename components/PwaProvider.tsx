"use client";

import { landscapeDownloadBytes } from "@/lib/route-photos";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Availability = { release: string; ready: boolean; photos: number; photoTotal: number };
type PwaContextValue = {
  availability: Availability | null; available: boolean; online: boolean; waiting: boolean; busy: boolean;
  working: boolean; notice: string; setBusy: (value: boolean) => void; locked: () => boolean;
  refresh: () => Promise<void>; preparePhotos: () => Promise<void>; applyUpdate: () => Promise<void>;
};
const PwaContext = createContext<PwaContextValue | null>(null);
function message(worker: ServiceWorker, type: string): Promise<Availability & { error?: string }> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => { channel.port1.close(); reject(new Error("Vérification indisponible. Reconnecte-toi puis réessaie.")); }, 15_000);
    channel.port1.onmessage = event => { window.clearTimeout(timer); channel.port1.close(); resolve(event.data); };
    worker.postMessage({ type }, [channel.port2]);
  });
}
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [available, setAvailable] = useState(false);
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusyState] = useState(true);
  const [working, setWorking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const protectedRef = useRef(true);
  const updateLock = useRef(false);
  const setBusy = useCallback((value: boolean) => { protectedRef.current = value; setBusyState(value); }, []);
  const locked = useCallback(() => updateLock.current, []);
  const inspect = useCallback(async () => {
    const worker = navigator.serviceWorker?.controller;
    if (!worker) { setAvailability(null); return; }
    try { const result = await message(worker, "VQ_STATUS"); setAvailability(!result.error && typeof result.ready === "boolean" ? result : null); }
    catch { setAvailability(null); }
    setWaiting(Boolean(registration.current?.waiting));
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let disposed = false;
    let interval: number | undefined;
    let releaseLockTimer: number | undefined;
    const clearLock = () => { updateLock.current = false; setUpdating(false); if (releaseLockTimer) window.clearTimeout(releaseLockTimer); };
    const connectivity = () => { setOnline(navigator.onLine); void inspect(); };
    const controller = () => { if (updateLock.current && !protectedRef.current) window.location.reload(); else void inspect(); };
    const receive = (event: MessageEvent) => {
      if (event.data?.type === "VQ_CAN_UPDATE" && event.ports[0]) {
        const safe = !protectedRef.current && !updateLock.current && !document.activeElement?.closest("form");
        if (safe) { updateLock.current = true; setUpdating(true); releaseLockTimer = window.setTimeout(clearLock, 12_000); }
        event.ports[0].postMessage({ safe });
      } else if (event.data?.type === "VQ_UPDATE_CANCELLED") clearLock();
    };
    const found = () => {
      const installing = registration.current?.installing;
      installing?.addEventListener("statechange", () => { if (!disposed && installing.state === "installed") { setWaiting(Boolean(registration.current?.waiting)); void inspect(); } });
    };
    setOnline(navigator.onLine);
    navigator.serviceWorker.addEventListener("controllerchange", controller);
    navigator.serviceWorker.addEventListener("message", receive);
    window.addEventListener("online", connectivity); window.addEventListener("offline", connectivity);
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(reg => {
      if (disposed) return;
      registration.current = reg; setAvailable(true); setWaiting(Boolean(reg.waiting));
      reg.addEventListener("updatefound", found); found(); void inspect();
      interval = window.setInterval(() => { void reg.update().catch(() => undefined); }, 60 * 60 * 1000);
    }).catch(() => { if (!disposed) setNotice("Le navigateur n’a pas pu préparer le mode hors connexion."); });
    return () => {
      disposed = true; if (interval) window.clearInterval(interval); if (releaseLockTimer) window.clearTimeout(releaseLockTimer);
      registration.current?.removeEventListener("updatefound", found);
      navigator.serviceWorker.removeEventListener("controllerchange", controller); navigator.serviceWorker.removeEventListener("message", receive);
      window.removeEventListener("online", connectivity); window.removeEventListener("offline", connectivity);
    };
  }, [inspect]);
  async function refresh() {
    setWorking(true); setNotice("");
    try {
      if (online) await registration.current?.update();
      const worker = navigator.serviceWorker?.controller;
      if (worker && online) { const result = await message(worker, "VQ_REPAIR"); if (result.error) throw new Error(result.error); }
      await inspect(); setNotice("Disponibilité vérifiée sur cet appareil.");
    }
    catch { setNotice("Vérification incomplète. Reconnecte-toi puis réessaie."); }
    finally { setWorking(false); }
  }
  async function preparePhotos() {
    const worker = navigator.serviceWorker?.controller;
    if (!worker || !online) return;
    setWorking(true); setNotice("");
    try { const result = await message(worker, "VQ_PHOTOS"); if (result.error) { setNotice(result.error); await inspect(); } else { setAvailability(result); setNotice("Photos préparées sur cet appareil."); } }
    catch (error) { setNotice(error instanceof Error ? error.message : "Photos incomplètes."); await inspect(); }
    finally { setWorking(false); }
  }
  async function applyUpdate() {
    const worker = registration.current?.waiting;
    if (!worker || protectedRef.current || updateLock.current) return;
    setWorking(true); setNotice("");
    try { const result = await message(worker, "VQ_APPLY"); if (result.error) setNotice(result.error); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Mise à jour différée."); }
    finally { setWorking(false); }
  }
  return <PwaContext.Provider value={{ availability, available, online, waiting, busy, working, notice, setBusy, locked, refresh, preparePhotos, applyUpdate }}>
    {children}
    {updating && <div className="pwaUpdateLock" role="alert"><strong>Mise à jour de VéloQuest…</strong><p>La page va se recharger. Tes données locales restent sur cet appareil.</p></div>}
  </PwaContext.Provider>;
}
export function usePwa() { const context = useContext(PwaContext); if (!context) throw new Error("PwaProvider absent"); return context; }
export function PwaStatusCard() {
  const pwa = usePwa();
  return <section className="card pwaStatus" aria-label="Disponibilité hors connexion">
    <div className="sectionHead"><div><p className="eyebrow">APPLICATION · {pwa.online ? "EN LIGNE" : "HORS CONNEXION"}</p><h2>Emporte ta séance</h2></div></div>
    <p role="status">{pwa.availability?.ready ? "Séances et parcours prêts hors connexion sur cet appareil." : pwa.available ? "Préparation à vérifier : garde une connexion et réessaie." : "Mode hors connexion indisponible dans ce navigateur ou cette session."}</p>
    <p>{pwa.availability ? `Photos : ${pwa.availability.photos}/${pwa.availability.photoTotal} disponibles hors connexion.` : "Photos : disponibilité non vérifiée."}</p>
    <p className="muted">Les cartes externes, YouTube et les podcasts ont leurs propres besoins réseau. Les GPX importés et tes historiques restent locaux. Le navigateur peut retirer le cache ; exporte tes données pour les sauvegarder.</p>
    <div className="pwaActions"><button className="btn secondary" onClick={() => void pwa.refresh()} disabled={!pwa.available || pwa.working}>Vérifier la disponibilité</button><button className="btn secondary" onClick={() => void pwa.preparePhotos()} disabled={!pwa.availability?.ready || !pwa.online || pwa.working || pwa.availability.photos === pwa.availability.photoTotal}>Préparer les photos · {Math.ceil(landscapeDownloadBytes / 1000)} Ko</button></div>
    {pwa.waiting && <div className="pwaUpdate"><strong>Une mise à jour est prête</strong><p>{pwa.busy ? "Termine ou mets ta séance de côté, ferme les formulaires et termine le diagnostic ou déconnecte le vélo Bluetooth. Si le stockage est plein, exporte tes données avant toute mise à jour." : "Tu peux l’appliquer maintenant ou continuer et revenir plus tard."}</p><button className="btn primary" onClick={() => void pwa.applyUpdate()} disabled={pwa.busy || pwa.working}>Mettre à jour maintenant</button></div>}
    {pwa.notice && <p role="status">{pwa.notice}</p>}
  </section>;
}
