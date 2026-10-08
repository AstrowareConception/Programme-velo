"use client";

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSessionDialog } from "@/components/useSessionDialog";

/** Short, dismissible dialogs share the reader's focus and background protection. */
export function AppDialog({ label, closeLabel, className, onClose, children }: {
  label: string;
  closeLabel: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const helpId = useId();
  useSessionDialog(ref, true, "open", onClose);

  return createPortal(
    <div className="modalBackdrop auxiliaryBackdrop" onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={ref} className={`sessionModal ${className}`} role="dialog" aria-modal="true"
        aria-label={label} aria-describedby={helpId} tabIndex={-1}>
        <p id={helpId} className="visuallyHidden">Tabulation parcourt les commandes. Échap ferme cette fenêtre et revient au bouton d’ouverture.</p>
        <button type="button" className="close" aria-label={closeLabel} onClick={onClose}>×</button>
        {children}
      </div>
    </div>, document.body
  );
}
