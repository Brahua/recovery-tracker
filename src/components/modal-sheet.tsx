"use client";

import { useEffect, useId, useRef } from "react";

interface ModalSheetProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

// Native <dialog>: bottom sheet on mobile, centered panel on desktop.
export function ModalSheet({ children, footer, onClose, open, title }: ModalSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      // React's autoFocus runs before the dialog opens, so focus the marked field here.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    const returnFocus = returnFocusRef.current;
    returnFocusRef.current = null;

    if (open) onClose();
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    // The sheet can live inside another form: Enter must not submit it.
    if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement &&
      event.target.type !== "checkbox"
    ) {
      event.preventDefault();
    }
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="rr-modal-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      {open ? (
        <div className="rr-modal-sheet-panel">
          <header className="rr-modal-sheet-header">
            <h2 id={titleId}>{title}</h2>
            <button aria-label="Cerrar" onClick={onClose} type="button">
              <span aria-hidden="true">✕</span>
            </button>
          </header>
          <div className="rr-modal-sheet-body">{children}</div>
          {footer ? <footer className="rr-modal-sheet-footer">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
