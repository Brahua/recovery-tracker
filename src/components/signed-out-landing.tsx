import Image from "next/image";

import { signInWithGoogleAction } from "@/app/auth/actions";
import { signInAnonymouslyForTestingAction } from "@/features/check-in/test-auth/actions";

const benefits = [
  {
    icon: "session",
    title: "Registrar sesion",
    description: "Ejercicios del dia en dos toques.",
  },
  {
    icon: "moon",
    title: "Cierre nocturno",
    description: "Dolor, rigidez y animo antes de dormir.",
  },
  {
    icon: "insights",
    title: "Insights",
    description: "Tu progreso semanal, sin ruido.",
  },
  {
    icon: "report",
    title: "Reporte para consulta",
    description: "Resumen listo para tu fisio.",
  },
] as const;

type BenefitIcon = (typeof benefits)[number]["icon"];

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.4 3.2 1.04 4.55l3.35-2.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function BenefitIcon({ name }: { name: BenefitIcon }) {
  if (name === "moon") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z" />
      </svg>
    );
  }

  if (name === "insights") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 17.5 9 12l3.3 3.2L20 7.5" />
        <path d="M16 7.5h4v4" />
      </svg>
    );
  }

  if (name === "report") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6.5 3.5h8l3 3v14h-11z" />
        <path d="M14.5 3.5v4h3M9.5 12h5M9.5 15.5h5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M8 8v8M16 8v8M3 10v4M21 10v4" />
    </svg>
  );
}

type SignedOutLandingProps = {
  errorMessage?: string;
  showDemo: boolean;
  supabaseEnv: boolean;
};

export function SignedOutLanding({
  errorMessage,
  showDemo,
  supabaseEnv,
}: SignedOutLandingProps) {
  return (
    <main className="rr-landing-shell">
      <div className="rr-landing-photo" aria-hidden="true">
        <Image
          alt=""
          fill
          preload
          sizes="(min-width: 64rem) 44vw, 100vw"
          src="/images/recovery-athlete-hero.webp"
        />
      </div>

      <header className="rr-landing-header">
        <a className="rr-landing-brand" href="#inicio" aria-label="Recovery Tracker, inicio">
          Recovery Tracker
        </a>
        <span className="rr-landing-beta">Beta</span>
      </header>

      <section className="rr-landing-body" id="inicio">
        <div className="rr-landing-copy">
          <p className="rr-landing-eyebrow">Rehabilitacion de rodilla</p>
          <h1>
            Vuelve
            <span>mas fuerte.</span>
          </h1>
          <p className="rr-landing-subhead">
            Tu ritual diario de recuperacion: claro, medible y a tu ritmo.
          </p>
        </div>

        <div className="rr-landing-actions" aria-label="Opciones de acceso">
          <form action={signInWithGoogleAction}>
            <button className="rr-landing-google" disabled={!supabaseEnv} type="submit">
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>
          {showDemo ? (
            <form action={signInAnonymouslyForTestingAction}>
              <button className="rr-landing-demo" disabled={!supabaseEnv} type="submit">
                Explorar en modo demo <span aria-hidden="true">→</span>
              </button>
            </form>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="rr-landing-notice rr-landing-notice--error" role="alert">
            No pudimos iniciar la sesion: {errorMessage}
          </p>
        ) : null}
        {!supabaseEnv ? (
          <p className="rr-landing-notice" role="alert">
            Configura las variables publicas de Supabase para habilitar el acceso.
          </p>
        ) : null}

        <aside className="rr-landing-peek" aria-label="Vista previa del progreso">
          <div className="rr-landing-progress">
            <svg aria-hidden="true" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="24" />
              <circle cx="29" cy="29" r="24" pathLength="100" />
            </svg>
            <strong>68%</strong>
          </div>
          <div className="rr-landing-peek-copy">
            <span>Dia 24 · Semana 4</span>
            <strong>Asi se ve<br />tu progreso</strong>
          </div>
          <span className="rr-landing-streak">Racha de 6 dias <i /></span>
        </aside>

        <section className="rr-landing-benefits" aria-label="Lo que puedes hacer">
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <span className="rr-landing-benefit-icon">
                <BenefitIcon name={benefit.icon} />
              </span>
              <h2>{benefit.title}</h2>
              <p>{benefit.description}</p>
            </article>
          ))}
        </section>
      </section>

      <footer className="rr-landing-footer">
        Disenado junto a fisioterapeutas <span aria-hidden="true">·</span> No sustituye consejo medico
      </footer>
    </main>
  );
}
