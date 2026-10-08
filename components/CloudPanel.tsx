"use client";
import { useEffect, useState } from "react";
import { workouts } from "@/lib/data";
import { counts, type Choices } from "@/lib/cloud/model";
import type { useCloudSync } from "./useCloudSync";
type Controller = ReturnType<typeof useCloudSync>;
export function CloudPanel({ cloud }: { cloud: Controller }) {
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [signup, setSignup] = useState(false), [consent, setConsent] = useState(false);
  const [choices, setChoices] = useState<Choices>({}), [confirm, setConfirm] = useState(false);
  useEffect(() => { setChoices({}); setConfirm(false); }, [cloud.pending]);
  useEffect(() => { cloud.setFormDirty(Boolean(password || email)); return () => cloud.setFormDirty(false); }, [email, password, cloud.setFormDirty]);
  useEffect(() => { if (cloud.user) { setPassword(""); setEmail(""); setSignup(false); } }, [cloud.user]);
  const disabled = cloud.working;
  function label(path: string) {
    const fields: Record<string, string> = { name: "Nom", startDate: "Début du programme", targetWeight: "Objectif de poids", startWeight: "Poids initial", targetWaist: "Objectif de tour de taille", startWaist: "Tour de taille initial", points: "Points", duration: "Durée", date: "Date", weight: "Poids", waist: "Tour de taille", abdomen: "Tour abdominal", xp: "Expérience" };
    const match = path.match(/^state\.(sessions|measurements)\[([^\]]+)\](?:\.(.*))?$/);
    if (match && cloud.pending) {
      const collection = match[1] as "sessions" | "measurements";
      const item = cloud.pending.local.state[collection].find(x => x.id === match[2]) ?? cloud.pending.remote?.state[collection].find(x => x.id === match[2]);
      const name = item && "templateId" in item ? workouts.find(w => w.id === item.templateId)?.name ?? "Séance" : "Mesure";
      return `${name}${item ? ` · ${new Date(item.date).toLocaleDateString("fr-FR")}` : ""}${match[3] ? ` · ${fields[match[3]] ?? "Détails"}` : " · modification ou suppression"}`;
    }
    const key = path.split(".").at(-1)!;
    return path.startsWith("state.profile") ? `Profil · ${fields[key] ?? "Réglage"}` : path.startsWith("customClimbs") ? "Parcours personnel modifié" : "Programme ou suivi modifié";
  }
  function value(v: unknown) { return v === undefined ? "Supprimé / absent" : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v); }
  return <section className="card cloudPanel" aria-labelledby="cloud-title">
    <p className="eyebrow">TES DONNÉES, SUR TES APPAREILS</p><h2 id="cloud-title">Sauvegarde et synchronisation</h2>
    <p>Retrouve ton historique sur téléphone et tablette. Le cloud est facultatif ; l’export JSON reste disponible.</p>
    {!cloud.configured ? <p>Le cloud n’est pas encore activé sur cette installation. En attendant, conserve une sauvegarde JSON en dehors de cet appareil.</p> : <>
      {!cloud.opened ? <><p>En activant le cloud, tes séances, mesures corporelles, objectifs et parcours personnels seront transmis à Firebase (Google) après ta confirmation. Les réglages de son, de vélo et d’affichage restent propres à cet appareil.</p><label className="cloudCheck"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Je souhaite utiliser la sauvegarde cloud pour mes données personnelles.</label><button type="button" className="primary" disabled={!consent} onClick={() => void cloud.connect()}>Configurer mon compte cloud</button></> : <>
        {!cloud.user ? <form onSubmit={e => { e.preventDefault(); void cloud.account(signup ? "signup" : "signin", email, password); }}>
          <label>Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={disabled} /></label>
          <label>Mot de passe<input type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : undefined} required value={password} onChange={e => setPassword(e.target.value)} disabled={disabled} /></label>
          {signup && <p>Au moins 12 caractères. Un e-mail permettra de vérifier ton adresse.</p>}
          <div className="backupButtons"><button className="primary" disabled={disabled}>{signup ? "Créer mon compte" : "Me connecter"}</button><button type="button" className="secondary" disabled={disabled} onClick={() => setSignup(v => !v)}>{signup ? "J’ai déjà un compte" : "Créer un compte"}</button><button type="button" className="secondary" disabled={disabled || !email.trim()} onClick={() => void cloud.account("reset", email)}>Mot de passe oublié</button></div>
        </form> : <>
          <p>Compte : <strong>{cloud.user.email}</strong></p>
          {!cloud.user.emailVerified ? <div className="backupButtons"><button className="secondary" disabled={disabled} onClick={() => void cloud.account("verify")}>Renvoyer l’e-mail de vérification</button><button className="primary" disabled={disabled} onClick={() => void cloud.account("refresh")}>J’ai vérifié mon adresse</button></div> : <div className="backupButtons"><button className="primary" disabled={disabled} onClick={() => void cloud.sync(true)}>{cloud.linked ? "Synchroniser maintenant" : "Associer cet appareil — vérifier les données"}</button><button className="secondary" disabled={disabled} onClick={() => void cloud.loadHistory()}>Voir les versions sauvegardées</button></div>}
          <button type="button" className="secondary" disabled={disabled} onClick={() => void cloud.account("signout")}>Déconnecter le compte cloud</button>
          <p className="finePrint">La déconnexion garde les données sur cet appareil. Sur un appareil partagé, déconnecte-toi puis utilise la réinitialisation locale. Le cloud synchronise quand l’application est ouverte et disponible.</p>
        </>}
      </>}
    </>}
    <p role="status" aria-live="polite">{cloud.status}</p>
    {cloud.pending && <div className="cloudReview">
      <h3>{cloud.pending.kind === "restore" ? "Restaurer une version antérieure" : "Vérifier la fusion"}</h3>
      <p>Sur cet appareil : {counts(cloud.pending.local)}.</p><p>Dans le cloud : {cloud.pending.remote ? counts(cloud.pending.remote) : "aucune sauvegarde"}.</p>
      {cloud.pending.kind === "restore" && <p>Version à restaurer : {counts(cloud.pending.data)}. Elle remplacera le suivi et sera synchronisée vers tes autres appareils. La version actuelle sera conservée dans l’historique cloud.</p>}
      {!cloud.pending.remote && <p>Une première copie sera créée. L’historique local est conservé.</p>}
      {cloud.pending.conflicts.map(conflict => <fieldset key={conflict.path}><legend>{label(conflict.path)}</legend><div className="cloudConflict"><label><input type="radio" name={conflict.path} checked={choices[conflict.path] === "local"} onChange={() => setChoices(v => ({ ...v, [conflict.path]: "local" }))} disabled={disabled} />Garder cet appareil<pre>{value(conflict.local)}</pre></label><label><input type="radio" name={conflict.path} checked={choices[conflict.path] === "remote"} onChange={() => setChoices(v => ({ ...v, [conflict.path]: "remote" }))} disabled={disabled} />Garder le cloud<pre>{value(conflict.remote)}</pre></label></div></fieldset>)}
      <p>Les ajouts indépendants sont réunis. Les versions d’avant fusion restent récupérables dans l’historique.</p>
      <label className="cloudCheck"><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} disabled={disabled} />J’ai vérifié le compte, les données et mes choix.</label>
      <div className="backupButtons"><button type="button" className="primary" disabled={disabled || !confirm || cloud.pending.conflicts.some(c => !choices[c.path])} onClick={() => void cloud.confirm(choices)}>{cloud.pending.kind === "restore" ? "Confirmer la restauration" : "Confirmer la synchronisation"}</button><button type="button" className="secondary" disabled={disabled} onClick={cloud.cancel}>Annuler la fusion</button></div>
    </div>}
    {cloud.history.length > 0 && <details open><summary>Versions récupérables — 30 dernières</summary><p>Pour retrouver une séance supprimée, restaure une version qui la contient. Les archives restent conservées jusqu’à une suppression administrative.</p><ul>{cloud.history.map(item => <li key={item.id}><span>{item.createdAt ? new Date(item.createdAt).toLocaleString("fr-FR") : "Date indisponible"} · {item.summary} {item.kind === "before-merge" ? "· avant fusion" : item.kind === "restore" ? "· restauration" : ""}</span><button type="button" className="secondary" disabled={disabled} onClick={() => void cloud.sync(true, item.id)}>Examiner cette version</button></li>)}</ul></details>}
  </section>;
}
