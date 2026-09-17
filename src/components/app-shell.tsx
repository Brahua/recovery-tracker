"use client";

import Link from "@/components/app-link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { FormPendingReporter } from "@/components/feedback/form-pending-reporter";
import {
  getUserDisplayName,
  type DisplayNameUser,
} from "@/lib/user-display-name";

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
    glyph: "HI",
    match: "startsWith" as const,
  },
  {
    href: "/ejercicios",
    label: "Ejercicios",
    glyph: "EJ",
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

function getUserIdentity(user: DisplayNameUser) {
  const name = getUserDisplayName(user);

  if (!name) {
    return { name: "Tu perfil", initial: "R" };
  }

  return { name, initial: name.charAt(0).toUpperCase() };
}

interface AppShellProps {
  user: DisplayNameUser;
  streak: number;
  children: React.ReactNode;
}

// Rendered once by the (app) layout so navigation never remounts the shell.
// Pages that need a distraction-free view render <ImmersiveMarker />.
export function AppShell({ user, streak, children }: AppShellProps) {
  const pathname = usePathname();
  const identity = getUserIdentity(user);

  return (
    <main className={`rr-app-shell rr-theme ${pathname === "/historial" ? "is-history" : ""}`}>
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
              <FormPendingReporter />
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

export function ImmersiveMarker() {
  return <span aria-hidden="true" className="rr-immersive-marker" hidden />;
}
