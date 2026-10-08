"use client";

import { useEffect, useRef, type RefObject } from "react";

// Transfer the original launcher when a picker is replaced by the session reader.
// Only retained until the next effect or focus-restoration animation frame.
let pendingOpener: HTMLElement | null = null;

function focusTitle(dialog: HTMLElement) {
  const title = dialog.querySelector<HTMLElement>("h2");
  if (title) { title.tabIndex = -1; title.focus(); }
  else dialog.focus();
}

/** Keep the same reader mounted through preparation, riding, review and rotation. */
export function useSessionDialog(ref: RefObject<HTMLElement | null>, open: boolean, phase: string, onEscape?: () => void) {
  const escapeHandler = useRef(onEscape);
  useEffect(() => { escapeHandler.current = onEscape; }, [onEscape]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const opener = pendingOpener?.isConnected ? pendingOpener : focused;
    pendingOpener = null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = new Map<HTMLElement, boolean>();
    // Hide siblings of the backdrop/container without hiding the dialog itself.
    let branch: HTMLElement = dialog.parentElement!;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          background.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || !dialog) return;
      // Never lose a review's unsaved inputs or park a running session by accident.
      // The explicit button still uses the existing guarded snapshot write.
      if (event.key === "Escape") {
        event.preventDefault();
        if (escapeHandler.current) escapeHandler.current();
        else dialog.querySelector<HTMLButtonElement>(".close")?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, summary, [tabindex]'
      )).filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[inert]") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
      const first = controls[0];
      const last = controls.at(-1);
      const focused = document.activeElement;
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (focused === first || !controls.includes(focused as HTMLElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (focused === last || !controls.includes(focused as HTMLElement))) { event.preventDefault(); first.focus(); }
    }
    function containFocus(event: FocusEvent) {
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) focusTitle(dialog);
    }
    function repairFocus() {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && dialog?.contains(focused) && !focused.getClientRects().length) focusTitle(dialog);
    }
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", containFocus);
    window.addEventListener("resize", repairFocus);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", containFocus);
      window.removeEventListener("resize", repairFocus);
      for (const [element, previous] of background) element.inert = previous;
      document.body.style.overflow = overflow;
      pendingOpener = opener?.isConnected && opener !== document.body ? opener : null;
      requestAnimationFrame(() => {
        pendingOpener = null;
        if (ref.current?.isConnected) return;
        // A newly mounted dialog owns focus; the old dialog must not steal it.
        if (document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return;
        if (opener?.isConnected && opener !== document.body && !opener.closest("[inert]")) opener.focus();
        else document.querySelector<HTMLElement>(".bottomNav button.active")?.focus();
      });
    };
  }, [open, ref]);

  useEffect(() => { if (open && ref.current) focusTitle(ref.current); }, [open, phase, ref]);
}
