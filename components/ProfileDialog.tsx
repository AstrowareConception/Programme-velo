"use client";

import Image from "next/image";
import { useState } from "react";
import { AppDialog } from "@/components/AppDialog";
import type { Profile } from "@/lib/types";

export function ProfileDialog({ profile, onSave, onClose }: {
  profile: Profile;
  onSave: (form: FormData) => boolean;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return <AppDialog className="setupModal" label="Profil et objectifs" closeLabel="Fermer le profil" onClose={onClose} dismissible={false}>
    <form onSubmit={event => {
      event.preventDefault();
      setFailed(!onSave(new FormData(event.currentTarget)));
    }}>
      <Image src="/logo.svg" alt="" width={64} height={64} className="setupLogo" />
      <p className="eyebrow">RÉGLAGES PERSONNELS</p>
      <h2>Ton profil, tes objectifs</h2>
      <p>Les mesures corporelles sont facultatives. Tu peux les compléter plus tard.</p>
      <div className="form">
        <label>Prénom ou pseudo<input name="name" defaultValue={profile.name} placeholder="Ton nom" maxLength={80} /></label>
        <label>Date de départ<input name="startDate" type="date" defaultValue={profile.startDate} required /></label>
        <div className="formRow">
          <label>Poids de départ<input name="startWeight" type="number" step="0.1" defaultValue={profile.startWeight} /></label>
          <label>Objectif poids<input name="targetWeight" type="number" step="0.1" defaultValue={profile.targetWeight} /></label>
        </div>
        <div className="formRow">
          <label>Tour de taille départ<input name="startWaist" type="number" step="0.1" defaultValue={profile.startWaist} /></label>
          <label>Objectif tour de taille<input name="targetWaist" type="number" step="0.1" defaultValue={profile.targetWaist} /></label>
        </div>
        {failed && <p className="errorText" role="alert">Le profil n’a pas pu être enregistré. Tes saisies restent ici. Libère du stockage, puis réessaie.</p>}
        <button className="primary" type="submit">{failed ? "Réessayer l’enregistrement du profil" : "Enregistrer mon profil"}</button>
      </div>
    </form>
  </AppDialog>;
}
