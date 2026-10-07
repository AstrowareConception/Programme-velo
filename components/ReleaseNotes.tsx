"use client";

import { useEffect, useState } from "react";
import { latestRelease, RELEASE_SEEN_KEY, releases } from "@/lib/releases";

export function ReleaseAnnouncement({ visible, onOpen }: { visible: boolean; onOpen: () => void }) {
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    function sync() {
      try { setUnread(localStorage.getItem(RELEASE_SEEN_KEY) !== latestRelease.id); }
      catch { setUnread(true); }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === RELEASE_SEEN_KEY || event.key === null) sync();
    }
    sync();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function acknowledge() {
    setUnread(false);
    try { localStorage.setItem(RELEASE_SEEN_KEY, latestRelease.id); }
    catch { /* Optional UI preference: dismissal still works until reload. */ }
  }

  if (!visible || !unread) return null;
  return <section className="releaseAnnouncement" aria-label="Dernières nouveautés">
    <div><p className="eyebrow">DU NOUVEAU DANS VÉLOQUEST</p><h2>{latestRelease.title}</h2><p>{latestRelease.summary}</p></div>
    <div className="releaseActions">
      <button type="button" className="secondary" onClick={() => { acknowledge(); onOpen(); }}>Voir les nouveautés</button>
      <button type="button" className="secondary miniButton" aria-label="Masquer l’annonce des nouveautés" onClick={acknowledge}>Plus tard</button>
    </div>
  </section>;
}

function ReleaseContent({ release }: { release: (typeof releases)[number] }) {
  return <><p>{release.summary}</p><ul className="releaseChanges">{release.changes.map(change =>
    <li key={change.title}><strong>{change.title}</strong><p>{change.text}</p></li>
  )}</ul></>;
}

export function ReleaseNotesCard() {
  return <section className="card releaseNotes" aria-labelledby="release-notes-title">
    <p className="eyebrow">L’APPLICATION ÉVOLUE</p>
    <h2 id="release-notes-title" tabIndex={-1}>Quoi de neuf ?</h2>
    <article>
      <time dateTime={latestRelease.date}>{latestRelease.label}</time>
      <h3>{latestRelease.title}</h3>
      <ReleaseContent release={latestRelease} />
    </article>
    {releases.slice(1).map(release => <details key={release.id} className="previousRelease">
      <summary>{release.title} <span>· {release.label}</span></summary>
      <ReleaseContent release={release} />
    </details>)}
    <p className="finePrint">Ces notes décrivent la version ouverte. Si une mise à jour attend, applique-la depuis la carte de mise à jour lorsque tu es prêt.</p>
  </section>;
}
