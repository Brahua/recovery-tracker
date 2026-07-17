import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";

const appTabs = [
  { href: "/", label: "Hoy", glyph: "HY", match: "exact" as const },
  {
    href: "/registrar",
    label: "Registrar",
    glyph: "RG",
    match: "startsWith" as const,
  },
  {
    href: "/historial",
    label: "Historial",
    glyph: "HS",
    match: "startsWith" as const,
  },
  {
    href: "/insights",
    label: "Insights",
    glyph: "IN",
    match: "startsWith" as const,
  },
  {
    href: "/reporte",
    label: "Reporte",
    glyph: "RP",
    match: "startsWith" as const,
  },
];

function isTabActive(pathname: string, href: string, match: "exact" | "startsWith") {
  return match === "exact"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function getUserIdentity(user: { email?: string | null }) {
  const email = user.email?.trim();

  if (!email) {
    return { name: "Tu perfil", initial: "R" };
  }

  const localPart = email.split("@")[0] ?? email;
  const firstName = localPart.split(/[._-]/)[0] ?? localPart;
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return { name, initial: name.charAt(0).toUpperCase() };
}

interface AppShellProps {
  pathname: string;
  user: { email?: string | null };
  streak: number;
  children: React.ReactNode;
  immersive?: boolean;
}

export function AppShell({ pathname, user, streak, children, immersive = false }: AppShellProps) {
  const identity = getUserIdentity(user);

  return (
    <main className={`rr-app-shell rr-theme ${immersive ? "is-immersive" : ""}`}>
      <aside className="rr-sidebar">
        <Link className="rr-sidebar-brand" href="/">
          <span aria-hidden="true" className="rr-logo-mark">
            <span />
          </span>
          <span>Recovery Tracker</span>
        </Link>

        <nav aria-label="Navegacion principal" className="rr-sidebar-nav">
          {appTabs.map((tab) => {
            const active = isTabActive(pathname, tab.href, tab.match);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`rr-sidebar-link ${active ? "is-active" : ""}`}
                href={tab.href}
                key={tab.href}
              >
                <span aria-hidden="true" className="rr-nav-glyph">
                  {tab.glyph}
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rr-sidebar-footer">
          <section className="rr-streak-card" aria-label={`Racha de ${streak} dias`}>
            <p>Racha</p>
            <strong>
              {streak} dia{streak === 1 ? "" : "s"} <span aria-hidden="true">●</span>
            </strong>
            <small>La constancia tambien cuenta.</small>
          </section>

          <div className="rr-user-row">
            <span aria-hidden="true" className="rr-avatar">
              {identity.initial}
            </span>
            <div>
              <strong>{identity.name}</strong>
              <span>Tu recuperacion</span>
            </div>
            <form action={signOutAction}>
              <button title="Cerrar sesion" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      <section className="rr-mobile-frame">
        <div className="rr-main-glow" />
        <div className="rr-main-content">{children}</div>
      </section>

      <nav aria-label="Navegacion principal movil" className="rr-mobile-nav">
        {appTabs.map((tab) => {
          const active = isTabActive(pathname, tab.href, tab.match);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : ""}
              href={tab.href}
              key={tab.href}
            >
              <span aria-hidden="true" className="rr-nav-glyph">{tab.glyph}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
