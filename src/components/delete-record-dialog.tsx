"use client";

import { ModalSheet } from "@/components/modal-sheet";

interface DeleteRecordDialogProps {
  // What is deleted, e.g. "Cierre del día · lun 29 sep".
  description: string;
  // What else goes with it; the dialog always adds that it cannot be undone.
  consequence?: string;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  pending: boolean;
  title: string;
}

// Explicit confirmation before deleting a session or closeout; focus starts on "Cancelar".
export function DeleteRecordDialog({
  consequence,
  description,
  error,
  onClose,
  onConfirm,
  open,
  pending,
  title,
}: DeleteRecordDialogProps) {
  return (
    <ModalSheet
      footer={
        <>
          <button className="rr-modal-secondary" data-autofocus onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="rr-modal-secondary is-danger"
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Eliminando..." : "Eliminar"}
          </button>
        </>
      }
      onClose={onClose}
      open={open}
      title={title}
    >
      <div className="rr-delete-record">
        <strong>{description}</strong>
        <p>
          {consequence ? `${consequence} ` : ""}No se puede deshacer.
        </p>
        {error ? (
          <p className="rr-delete-record-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalSheet>
  );
}
