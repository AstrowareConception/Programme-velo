"use client";

import { useId, useRef, useState, type ReactNode } from "react";

type Props = {
  header: ReactNode;
  notice: ReactNode;
  focus: ReactNode;
  visual: ReactNode;
  progress: ReactNode;
  extras: ReactNode;
  controls: ReactNode;
};

/** Layout only: resizing never remounts the reader or changes its session state. */
export function SessionDashboard({ header, notice, focus, visual, progress, extras, controls }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  function closeDetails() {
    setDetailsOpen(false);
    trigger.current?.focus();
  }

  return <div className="sessionDashboard" onKeyDown={event => {
    if (event.key === "Escape" && detailsOpen) { event.preventDefault(); event.stopPropagation(); closeDetails(); }
  }}>
    <header className="dashboardHeader">{header}</header>
    <div className="dashboardNotice">{notice}</div>
    <section className="dashboardFocus" aria-label="Consignes de la séance">{focus}</section>
    <section className="dashboardVisual" aria-label="Parcours et profil de la séance">{visual}</section>
    <section className="dashboardProgress" aria-label="Progression et mesures">{progress}</section>
    <div className="dashboardTools dashboardLandscapeOnly">
      <span>VÉLOQUEST <b>· EN SÉANCE</b></span>
      <button ref={trigger} type="button" className="secondary" aria-expanded={detailsOpen} aria-controls={panelId} onClick={() => {
        if (detailsOpen) closeDetails();
        else { setDetailsOpen(true); requestAnimationFrame(() => close.current?.focus()); }
      }}>Réglages et détails</button>
    </div>
    <section id={panelId} className={`dashboardExtras ${detailsOpen ? "isOpen" : ""}`} aria-label="Réglages et détails de la séance">
      <div className="dashboardPanelHeading dashboardLandscapeOnly"><strong>À ta main</strong><button ref={close} type="button" className="secondary" onClick={closeDetails}>Revenir à la séance</button></div>
      {extras}
    </section>
    {controls}
  </div>;
}
