"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { cloudConfigured } from "@/lib/cloud/config";
import { canonical, cloudData, type Choices, type CloudData } from "@/lib/cloud/model";
import { CLOUD_LINK_KEY, diskData, installCloud, readLink } from "@/lib/cloud/local";
import { accept, propose, type Proposal } from "@/lib/cloud/engine";
import { clearIntent, readIntent, stageIntent } from "@/lib/cloud/outbox";
import type { CloudRemote, Revision } from "@/lib/cloud/remote";
import type { AppState } from "@/lib/types";
import type { ClimbChallenge } from "@/lib/routes";
const ACCESS = "veloquest:cloud-access:v1";
function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "cloud/head-changed") return "Une autre sauvegarde vient d’arriver. Relance la synchronisation pour réunir les changements.";
  if (code?.includes("invalid-credential") || code?.includes("wrong-password") || code?.includes("user-not-found")) return "Connexion refusée. Vérifie l’adresse et le mot de passe, ou demande sa réinitialisation.";
  if (code?.includes("email-already-in-use")) return "Cette adresse possède déjà un compte. Connecte-toi ou réinitialise le mot de passe.";
  if (code?.includes("weak-password")) return "Choisis un mot de passe plus long (au moins 12 caractères).";
  if (code?.includes("permission-denied")) return "Accès cloud refusé. Vérifie ton adresse e-mail et la configuration des règles Firebase.";
  if (code?.includes("too-many-requests") || code?.includes("resource-exhausted")) return "Le service a atteint une limite. Tes données restent locales ; réessaie plus tard.";
  if (code?.includes("network") || code?.includes("unavailable")) return "Réseau indisponible. Tes données restent sur cet appareil ; réessaie une fois connecté.";
  return code ? "Le service cloud n’a pas terminé l’opération. Tes données locales sont conservées ; réessaie." : error instanceof Error ? error.message : "L’opération n’a pas abouti. Réessaie.";
}
export type CloudProps = { state: AppState; customClimbs: ClimbChallenge[]; hydrated: boolean; blocked: boolean; locked: () => boolean; onInstall: (value: { state: AppState; customClimbs: ClimbChallenge[] }) => void };
export function useCloudSync(props: CloudProps) {
  const live = useRef(props); live.current = props;
  const [user, setUser] = useState<User | null>(null);
  const [authEpoch, setAuthEpoch] = useState(0);
  const [opened, setOpened] = useState(false), [working, setWorking] = useState(false), [formDirty, setFormDirty] = useState(false);
  const [status, setStatus] = useState("Cloud désactivé. Les données restent sur cet appareil.");
  const [pending, setPending] = useState<Proposal | null>(null), [history, setHistory] = useState<Revision[]>([]);
  const [linked, setLinked] = useState(false);
  const userRef = useRef<User | null>(null), remoteRef = useRef<CloudRemote | null>(null), running = useRef(false), generation = useRef(0);
  const pendingRef = useRef<Proposal | null>(null); pendingRef.current = pending;
  const lastError = useRef(false), disposed = useRef(false);
  const syncRef = useRef<(manual?: boolean, restore?: string) => Promise<void>>(async () => {});
  function fresh(): CloudData | null {
    const p = live.current;
    if (disposed.current || p.blocked || p.locked() || !p.hydrated || document.visibilityState === "hidden") return null;
    // Never upload a stale tab over newer local data written by another tab.
    if (document.activeElement?.matches("input, textarea, select, [contenteditable=true]")) return null;
    const data = cloudData(p.state, p.customClimbs);
    return canonical(diskData()) === canonical(data) ? data : null;
  }
  async function connect() {
    if (!cloudConfigured) return;
    try { localStorage.setItem(ACCESS, "true"); setOpened(true); } catch { setStatus("Le stockage de cet appareil est indisponible. Le cloud n’a pas été activé."); }
  }
  useEffect(() => { disposed.current = false; try { if (cloudConfigured && localStorage.getItem(ACCESS) === "true") setOpened(true); } catch { setStatus("Le stockage de cet appareil n’est pas disponible pour le cloud."); } return () => { disposed.current = true; generation.current++; }; }, []);
  useEffect(() => {
    if (!opened) return;
    let cancelled = false, stopAuth: (() => void) | undefined, stopWatch: (() => void) | undefined;
    void Promise.all([import("@/lib/cloud/firebase"), import("firebase/auth"), import("@/lib/cloud/remote")]).then(([client, auth, remote]) => {
      if (cancelled) return;
      stopAuth = auth.onAuthStateChanged(client.firebase().auth, next => {
        generation.current++; stopWatch?.(); remoteRef.current = null; userRef.current = next; setUser(next); setPending(null); setHistory([]); lastError.current = false;
        const belongs = Boolean(next && readLink()?.uid === next.uid); setLinked(belongs);
        if (!next) { setStatus("Connecte-toi pour retrouver tes sauvegardes."); return; }
        if (!next.emailVerified) { setStatus("Vérifie ton adresse e-mail avant d’activer la sauvegarde."); return; }
        const store = new remote.CloudRemote(client.firebase().db, next.uid); remoteRef.current = store;
        setStatus(belongs ? "Vérification de la sauvegarde distante…" : "Compte connecté. Vérifie les données avant d’associer cet appareil.");
        stopWatch = store.watch(() => { if (readLink()?.uid === next.uid) void syncRef.current(); }, error => { lastError.current = true; setStatus(errorMessage(error)); });
      });
    }).catch(error => { if (!cancelled) setStatus(errorMessage(error)); });
    return () => { cancelled = true; generation.current++; stopAuth?.(); stopWatch?.(); remoteRef.current = null; };
  }, [opened, authEpoch]);
  async function withLock(task: () => Promise<void>) {
    if (running.current) return;
    if (!navigator.locks) { setStatus("Ce navigateur ne permet pas de sécuriser la synchronisation entre onglets. Utilise un navigateur récent ou l’export JSON."); return; }
    running.current = true; setWorking(true);
    try { await navigator.locks.request("veloquest-cloud", { ifAvailable: true }, async lock => { if (!lock) throw new Error("Un autre onglet synchronise les données. Réessaie dans un instant."); await task(); }); }
    catch (error) { lastError.current = true; setStatus(errorMessage(error)); }
    finally { running.current = false; if (!disposed.current) setWorking(false); }
  }
  async function commit(proposal: Proposal, choices: Choices) {
    const remote = remoteRef.current, epoch = generation.current;
    if (!remote || !userRef.current?.emailVerified) return;
    const originalUid = remote.uid;
    const guarded = () => generation.current === epoch && userRef.current?.uid === originalUid ? fresh() : null;
    setStatus("Synchronisation en cours…");
    await accept(remote, proposal, choices, guarded, (data, revision) => {
      const changed = canonical(data) !== canonical(cloudData(live.current.state, live.current.customClimbs));
      if (changed || readLink()?.revision !== revision || readLink()?.uid !== originalUid) {
        const installed = installCloud(data, { uid: originalUid, revision });
        if (changed) live.current.onInstall(installed);
      }
      setLinked(true); setPending(null); lastError.current = false;
    }, stageIntent);
    await clearIntent();
    setStatus(`Synchronisé à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Copie confirmée en ligne.`);
  }
  async function sync(manual = false, restore?: string) {
    if (!manual && (lastError.current || pendingRef.current)) return;
    const remote = remoteRef.current, epoch = generation.current;
    if (!remote) return;
    const link = readLink(), belongs = link?.uid === remote.uid;
    setLinked(belongs);
    if (!manual && !belongs) return;
    if (!navigator.onLine) { setStatus("Hors connexion · modifications locales en attente d’envoi."); return; }
    const local = fresh();
    if (!local) { if (manual) setStatus("Synchronisation différée : termine la séance ou la saisie. Si un autre onglet a modifié les données, recharge cette page."); return; }
    await withLock(async () => {
      let recoveryBase: CloudData | undefined;
      const intent = await readIntent();
      if (intent) {
        if (intent.uid !== remote.uid) throw new Error("Un envoi attend sa confirmation pour un autre compte. Reconnecte ce compte avant d’associer de nouvelles données.");
        try {
          await remote.commit(intent.expected, intent.data, intent.before, intent.kind, intent.id);
          recoveryBase = intent.local;
        } catch (error) {
          if ((error as { code?: string }).code !== "cloud/head-changed") throw error;
          await clearIntent();
        }
      }
      const proposal = await propose(remote, local, belongs ? link!.revision : null, restore, recoveryBase);
      if (generation.current !== epoch) return;
      if (canonical(fresh()) !== canonical(local)) throw new Error("Les données ont changé pendant la lecture. Relance la synchronisation.");
      if (!belongs || proposal.conflicts.length || restore) { setPending(proposal); setStatus(restore ? "Vérifie la version à restaurer. L’état actuel sera archivé avant remplacement." : "Vérifie la fusion avant de synchroniser cet appareil."); }
      else await commit(proposal, {});
    });
  }
  syncRef.current = sync;
  useEffect(() => {
    if (!opened) return;
    const online = () => { lastError.current = false; void syncRef.current(); };
    const visibility = () => { if (document.visibilityState === "visible") void syncRef.current(); };
    const storage = (e: StorageEvent) => { if (e.key === CLOUD_LINK_KEY) { setLinked(readLink()?.uid === userRef.current?.uid); setPending(null); } };
    const timer = window.setInterval(() => void syncRef.current(), 30_000);
    window.addEventListener("online", online); document.addEventListener("visibilitychange", visibility); window.addEventListener("storage", storage);
    return () => { clearInterval(timer); window.removeEventListener("online", online); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("storage", storage); };
  }, [opened]);
  useEffect(() => {
    if (!linked) return;
    setStatus("Modifications locales · vérification de la synchronisation en attente.");
    const timer = setTimeout(() => void syncRef.current(), 3000); return () => clearTimeout(timer);
  }, [props.state, props.customClimbs, props.blocked, linked]);
  async function account(action: "signin" | "signup" | "reset" | "verify" | "refresh" | "signout", email = "", password = "") {
    if (running.current || live.current.locked()) return;
    running.current = true; setWorking(true);
    try {
      const [{ firebase }, a] = await Promise.all([import("@/lib/cloud/firebase"), import("firebase/auth")]); const auth = firebase().auth;
      if (action === "signin") await a.signInWithEmailAndPassword(auth, email.trim(), password);
      if (action === "signup") { const result = await a.createUserWithEmailAndPassword(auth, email.trim(), password); await a.sendEmailVerification(result.user); setStatus("Compte créé. Un e-mail de vérification a été envoyé."); }
      if (action === "reset") { await a.sendPasswordResetEmail(auth, email.trim()); setStatus("Si un compte correspond à cette adresse, un e-mail de réinitialisation sera envoyé."); }
      if (action === "verify" && auth.currentUser) { await a.sendEmailVerification(auth.currentUser); setStatus("E-mail de vérification envoyé. Consulte aussi les indésirables."); }
      if (action === "refresh" && auth.currentUser) { await a.reload(auth.currentUser); await auth.currentUser.getIdToken(true); setAuthEpoch(value => value + 1); }
      if (action === "signout") { generation.current++; await a.signOut(auth); setStatus("Déconnecté. Les données de cet appareil et les sauvegardes en ligne sont conservées."); }
    } catch (e) { setStatus(errorMessage(e)); }
    finally { running.current = false; setWorking(false); }
  }
  async function loadHistory() { const remote = remoteRef.current, epoch = generation.current; if (remote) await withLock(async () => { const rows = await remote.history(); if (generation.current === epoch) setHistory(rows); }); }
  return { configured: cloudConfigured, opened, connect, user, linked, working, formDirty, setFormDirty, status, pending, history, account, sync,
    confirm: (choices: Choices) => pending ? withLock(() => commit(pending, choices)) : Promise.resolve(),
    cancel: () => { setPending(null); lastError.current = true; setStatus("Fusion suspendue. Les données locales sont conservées. Utilise Synchroniser pour reprendre."); }, loadHistory };
}
