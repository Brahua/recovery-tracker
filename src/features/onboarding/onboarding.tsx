"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { applyAppearance } from "@/components/appearance/apply-appearance";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { completeOnboardingAction } from "@/features/onboarding/actions";
import { tourSteps, type TourIcon } from "@/features/onboarding/tour-steps";
import { accentOptions, accents, themeOptions, themes, type Appearance } from "@/lib/appearance";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

interface OnboardingProps {
  appearance: Appearance;
  chosenName: string | null;
  fallbackName: string | null;
  /** "replay" comes from Ajustes: tour only, back to Ajustes at the end. */
  mode: "first" | "replay";
}

function TourGlyph({ icon }: { icon: TourIcon }) {
  const paths: Record<TourIcon, React.ReactNode> = {
    today: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 8 8" strokeWidth="3" />
      </>
    ),
    session: <path d="M5 12h14M8 8v8M16 8v8M3 10v4M21 10v4" />,
    closeout: <path d="M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z" />,
    history: (
      <>
        <path d="M6.5 4.5h11v15h-11z" />
        <path d="M9.5 9h5M9.5 12.5h5M9.5 16h3" />
      </>
    ),
    insights: (
      <>
        <path d="M4 17.5 9 12l3.3 3.2L20 7.5" />
        <path d="M16 7.5h4v4" />
      </>
    ),
    install: (
      <>
        <path d="M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z" />
        <path d="M12 8v6M9.5 11.5 12 14l2.5-2.5" />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[icon]}
    </svg>
  );
}

export function Onboarding({ appearance, chosenName, fallbackName, mode }: OnboardingProps) {
  const router = useRouter();
  const { pending, run } = useActionFeedback();
  const trackRef = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<"tour" | "setup">("tour");
  const [name, setName] = useState(chosenName ?? "");
  const [current, setCurrent] = useState(appearance);
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  const errorId = useId();
  const setupHeadingRef = useRef<HTMLHeadingElement>(null);
  const last = tourSteps.length - 1;

  // Swiping scrolls the track; the visible card becomes the current step.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = [...track.children] as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(cards.indexOf(entry.target as HTMLElement));
        }
      },
      { root: track, threshold: 0.6 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [stage]);

  useEffect(() => {
    if (stage === "setup") setupHeadingRef.current?.focus();
  }, [stage]);

  function goTo(next: number) {
    const card = trackRef.current?.children[next] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
    setIndex(next);
  }

  function finishTour() {
    if (mode === "replay") {
      router.push("/ajustes");
      return;
    }
    setStage("setup");
  }

  function previewAppearance(next: Appearance) {
    setCurrent(next);
    applyAppearance(next);
  }

  function complete(input: Parameters<typeof completeOnboardingAction>[0]) {
    setError(null);
    run(() => completeOnboardingAction(input), {
      success: "Todo listo. Tu ritual empieza hoy.",
      fallbackError: "No se pudo guardar.",
      onSuccess: () => router.replace("/"),
      onError: (message) => setError(message || null),
    });
  }

  function skip() {
    if (mode === "replay") {
      router.push("/ajustes");
      return;
    }
    // Skipping keeps the current appearance and the Google name.
    applyAppearance(appearance);
    complete({ kind: "skip" });
  }

  function submitSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    complete({ kind: "setup", name, appearance: current, acceptedNotice });
  }

  return (
    <main className="rr-onboarding">
      <header className="rr-onboarding-header">
        <span className="rr-onboarding-brand">Recovery Tracker</span>
        {stage === "tour" ? (
          <button className="rr-onboarding-skip" disabled={pending} onClick={skip} type="button">
            {mode === "replay" ? "Cerrar" : "Saltar"}
          </button>
        ) : null}
      </header>

      {stage === "tour" ? (
        <section
          aria-labelledby="onboarding-title"
          aria-roledescription="carrusel"
          className="rr-onboarding-tour"
        >
          <h1 className="rr-onboarding-title" id="onboarding-title">
            {mode === "replay" ? "Cómo funciona la app" : "Te damos la bienvenida a tu ritual"}
          </h1>
          <ol className="rr-onboarding-track" ref={trackRef}>
            {tourSteps.map((step, stepIndex) => (
              <li
                aria-hidden={stepIndex !== index}
                aria-label={`${stepIndex + 1} de ${tourSteps.length}`}
                aria-roledescription="diapositiva"
                className="rr-onboarding-card"
                key={step.kicker}
                role="group"
              >
                <span className="rr-onboarding-glyph">
                  <TourGlyph icon={step.icon} />
                </span>
                <p className="rr-kicker">{step.kicker}</p>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="rr-onboarding-controls">
            <p aria-live="polite" className="rr-onboarding-progress">
              <span className="rr-onboarding-dots" aria-hidden="true">
                {tourSteps.map((step, stepIndex) => (
                  <i className={stepIndex === index ? "is-current" : ""} key={step.kicker} />
                ))}
              </span>
              <span className="rr-visually-hidden">
                Paso {index + 1} de {tourSteps.length}
              </span>
            </p>
            <div className="rr-onboarding-buttons">
              <button
                className="rr-button rr-button--secondary rr-onboarding-back"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                type="button"
              >
                Atrás
              </button>
              <button
                className="rr-button rr-button--primary rr-onboarding-next"
                onClick={() => (index === last ? finishTour() : goTo(index + 1))}
                type="button"
              >
                {index === last ? (mode === "replay" ? "Terminar" : "Configurar") : "Siguiente"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <form className="rr-onboarding-setup" noValidate onSubmit={submitSetup}>
          <h1 className="rr-onboarding-title" ref={setupHeadingRef} tabIndex={-1}>
            Déjala a tu gusto
          </h1>
          <p className="rr-settings-hint">Puedes cambiar todo después en Ajustes.</p>

          <div className="rr-settings-form">
            <label htmlFor={nameId}>¿Cómo quieres que te llamemos?</label>
            <input
              autoComplete="nickname"
              id={nameId}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder={fallbackName ?? "Tu nombre"}
              type="text"
              value={name}
            />
          </div>

          <fieldset className="rr-appearance-group">
            <legend>Tema</legend>
            <div className="rr-appearance-themes">
              {themes.map((theme) => (
                <label className="rr-appearance-theme" key={theme}>
                  <input
                    checked={current.theme === theme}
                    name="onboarding-theme"
                    onChange={() => previewAppearance({ ...current, theme })}
                    type="radio"
                    value={theme}
                  />
                  <span>{themeOptions[theme].label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rr-appearance-group">
            <legend>Color principal</legend>
            <div className="rr-appearance-accents">
              {accents.map((accent) => (
                <label className="rr-appearance-accent" key={accent}>
                  <input
                    checked={current.accent === accent}
                    name="onboarding-accent"
                    onChange={() => previewAppearance({ ...current, accent })}
                    type="radio"
                    value={accent}
                  />
                  <span aria-hidden="true" className={`rr-appearance-swatch is-${accent}`} />
                  <span>{accentOptions[accent].label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="rr-onboarding-notice">
            <input
              aria-describedby={error ? errorId : undefined}
              checked={acceptedNotice}
              onChange={(event) => setAcceptedNotice(event.target.checked)}
              type="checkbox"
            />
            <span>
              Entiendo que Recovery Tracker me ayuda a registrar mi recuperación y{" "}
              <strong>no sustituye el consejo médico</strong> de mi fisioterapeuta o médico.
            </span>
          </label>

          {error ? (
            <p className="rr-settings-error" id={errorId} role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="rr-button rr-button--primary rr-onboarding-start"
            disabled={pending || !acceptedNotice}
            type="submit"
          >
            {pending ? "Guardando…" : "Empezar"}
          </button>
        </form>
      )}
    </main>
  );
}
