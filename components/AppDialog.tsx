"use client";

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSessionDialog } from "@/components/useSessionDialog";

/** Short, dismissible dialogs share the reader's focus and background protection. */
export function AppDialog({ label, closeLabel, className, onClose, dismissible = true, children }: {
  label: string;
  closeLabel: string;
  className: string;
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const helpId = useId();
  useSessionDialog(ref, true, "open", dismissible ? onClose : undefined);

  return createPortal(
    <div className="modalBackdrop auxiliaryBackdrop" onClick={event => {
      if (dismissible && event.target === event.currentTarget) onClose();
    }}>
      <div ref={ref} className={`sessionModal ${className}`} role="dialog" aria-modal="true"
        aria-label={label} aria-describedby={helpId} tabIndex={-1}>
        <p id={helpId} className="visuallyHidden">Tabulation parcourt les commandes. {dismissible ? "Échap ferme cette fenêtre et revient au bouton d’ouverture." : "Échap revient au bouton de fermeture sans fermer le formulaire. Active ce bouton pour quitter."}</p>
        <button type="button" className="close" aria-label={closeLabel} onClick={onClose}>×</button>
        {children}
      </div>
    </div>, document.body
  );
}
