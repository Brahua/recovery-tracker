import Link from "@/components/app-link";

// notFound() from a page, e.g. editing a record that was deleted or belongs to someone else.
export default function AppNotFound() {
  return (
    <div className="rr-history">
      <section className="rr-card rr-history-empty">
        <strong>No encontramos ese registro</strong>
        <p>Puede que se haya eliminado. Tus demás registros siguen en Historial.</p>
        <Link className="rr-button rr-button--secondary rr-history-more" href="/historial">
          Ir a Historial
        </Link>
      </section>
    </div>
  );
}
