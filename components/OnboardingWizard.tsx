"use client";

import { useEffect, useRef, type FormEvent } from "react";
import type { Guidance, Preferences, Profile, WorkoutTemplate } from "@/lib/types";

const titles = ["Bienvenue, commençons simplement.", "Quel rythme te convient ?", "Ton vélo, simplement.", "Ta première séance est prête."];

export function OnboardingWizard({ guide, profile, preferences, firstWorkout, onChange, onProfile, onPreferences, onFinish, onSkip, onImport }: {
  guide: Guidance;
  profile: Profile;
  preferences: Preferences;
  firstWorkout: WorkoutTemplate;
  onChange: (guide: Guidance) => void;
  onProfile: (profile: Profile) => void;
  onPreferences: (preferences: Preferences) => void;
  onFinish: (start: boolean) => void;
  onSkip: () => void;
  onImport: (file?: File) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => { heading.current?.focus(); }, [guide.step]);
  const change = (patch: Partial<Guidance>) => onChange({ ...guide, ...patch });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (guide.step < 3) change({ step: (guide.step + 1) as Guidance["step"] });
    else onFinish(true);
  };
  return (
    <dialog ref={dialog} className="onboardingDialog" aria-labelledby="onboarding-title" onCancel={(event) => { event.preventDefault(); onSkip(); }}>
      <form onSubmit={submit} className="onboardingForm">
        <p className="eyebrow">BIENVENUE DANS VELOQUEST</p>
        <p className="onboardingStep">Étape {guide.step + 1} sur 4 <span>· Tu peux revenir en arrière</span></p>
        <div className="onboardingBar" aria-hidden="true">{titles.map((_, i) => <i key={i} className={i <= guide.step ? "done" : ""} />)}</div>
        <h2 id="onboarding-title" ref={heading} tabIndex={-1}>{titles[guide.step]}</h2>
        {guide.step === 0 && <div className="form">
          <p>Quelques repères, une première séance, puis la suite à ton rythme. Aucun compte à créer : tes données restent sur cet appareil.</p>
          <label>Prénom ou pseudo <span className="optionalLabel">facultatif</span><input name="name" value={profile.name} placeholder="Comment t’appeler ?" maxLength={80} onChange={(event) => onProfile({ ...profile, name: event.target.value })} /></label>
          <label>Ce qui te donne envie<select value={guide.goal} onChange={(event) => change({ goal: event.target.value as Guidance["goal"] })}>
            <option value="habit">Installer une habitude</option><option value="endurance">Gagner en endurance</option><option value="explore">Découvrir des paysages</option>
          </select></label>
          <details><summary>Choisir ma date de départ</summary><label>Date de départ<input type="date" required value={profile.startDate} onChange={(event) => { if (event.target.value) onProfile({ ...profile, startDate: event.target.value }); }} /></label></details>
          <p className="finePrint">Poids, tour de taille et objectifs corporels sont facultatifs. Tu pourras les compléter plus tard dans Plus.</p>
          <label className="secondary fileButton">Restaurer une sauvegarde<input type="file" accept="application/json" onChange={(event) => onImport(event.target.files?.[0])} /></label>
        </div>}
        {guide.step === 1 && <div className="form">
          <p>Ces choix donnent un cap souple. Aucun jour imposé et rien à rattraper.</p>
          <label>Mon point de départ<select value={guide.experience} onChange={(event) => change({ experience: event.target.value as Guidance["experience"] })}>
            <option value="beginner">Je débute ou je reprends doucement</option><option value="regular">Je pratique déjà régulièrement</option>
          </select></label>
          <label>Temps habituel pour une séance<select value={guide.sessionMinutes} onChange={(event) => change({ sessionMinutes: Number(event.target.value) as Guidance["sessionMinutes"] })}>
            <option value="15">15 minutes</option><option value="25">25 minutes</option><option value="30">30 minutes</option>
          </select></label>
          <label>Rendez-vous par semaine<select value={guide.weeklySessions} onChange={(event) => change({ weeklySessions: Number(event.target.value) as Guidance["weeklySessions"] })}>
            <option value="2">2 séances</option><option value="3">3 séances</option><option value="4">4 séances</option>
          </select></label>
          <div className="guideHint">Ton cap de départ : {guide.weeklySessions} séances de {guide.sessionMinutes} minutes, à placer quand cela te convient. La découverte commence par 15 minutes faciles.</div>
        </div>}
        {guide.step === 2 && <div className="form">
          <p>Tu peux commencer sans Bluetooth. Sur le TEB5, règle toi-même les niveaux de résistance de 1 à 32 en suivant le lecteur.</p>
          <div className="guideHint"><strong>Le ressenti passe avant le chiffre.</strong> RPE signifie « ressenti d’effort » : 1 est très facile, 10 est maximal. Pour commencer, vise 2–3 et diminue la résistance si nécessaire.</div>
          <label className="onboardingToggle"><input type="checkbox" checked={preferences.soundCues} onChange={(event) => onPreferences({ ...preferences, soundCues: event.target.checked })} /> Un son aux changements de segment</label>
          <p>À la fin, indique ton ressenti et, si tu le souhaites, les kilomètres ou calories affichés sur ton vélo.</p>
          <p className="finePrint">Les kilomètres de simulation sont distincts des mesures du vélo. La connexion et les autres réglages restent disponibles dans Plus.</p>
        </div>}
        {guide.step === 3 && <div className="form">
          <div className="guideWorkout"><span className="intensity easy">FACILE · 15 MIN</span><h3>{firstWorkout.name}</h3><p>{firstWorkout.tagline}</p><ol>{firstWorkout.segments.map((segment) => <li key={segment.label}><strong>{segment.label}</strong><span>{segment.minutes} min · niveau {segment.resistance}</span></li>)}</ol></div>
          <p>Le lecteur te dira quoi faire. Tu peux mettre en pause et reprendre. En enregistrant ton ressenti à la fin, tu aides le coach à choisir la suite.</p>
          <p className="finePrint">Tes premiers repères : une séance pour découvrir, une pour trouver ton rythme, puis une pour choisir entre entraînement et balade. Le programme se précise avec tes séances enregistrées.</p>
        </div>}
        <div className="onboardingActions">
          {guide.step > 0 && <button type="button" className="secondary" onClick={() => change({ step: (guide.step - 1) as Guidance["step"] })}>Retour</button>}
          <button type="submit" className="primary">{guide.step === 3 ? "Préparer ma première séance" : "Continuer"}</button>
        </div>
        {guide.step === 3 && <button type="button" className="secondary fullWidth" onClick={() => onFinish(false)}>Plus tard, ouvrir ma quête</button>}
        <button type="button" className="onboardingSkip" onClick={onSkip}>Explorer librement</button>
      </form>
    </dialog>
  );
}
