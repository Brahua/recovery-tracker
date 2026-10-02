"use client";

import { useState } from "react";

import { applyAppearance } from "@/components/appearance/apply-appearance";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { saveAppearanceAction } from "@/features/settings/actions";
import {
  accentOptions,
  accents,
  themeOptions,
  themes,
  type Accent,
  type Appearance,
  type Theme,
} from "@/lib/appearance";

interface AppearanceSettingsProps {
  appearance: Appearance;
  /** Theme choice, shown once the light palette exists. */
  showTheme?: boolean;
}

// Ajustes → Apariencia: changes apply at once (preview) and are saved to the account; a failed
// save puts the previous appearance back.
export function AppearanceSettings({ appearance, showTheme = false }: AppearanceSettingsProps) {
  const { pending, run } = useActionFeedback();
  const [current, setCurrent] = useState(appearance);
  const [error, setError] = useState<string | null>(null);

  function choose(next: Appearance) {
    const previous = current;
    setCurrent(next);
    applyAppearance(next);
    setError(null);
    run(() => saveAppearanceAction(next), {
      success: "Apariencia guardada",
      fallbackError: "No se pudo guardar la apariencia.",
      onError: (message) => {
        if (!message) return;
        setError(message);
        setCurrent(previous);
        applyAppearance(previous);
      },
    });
  }

  return (
    <div className="rr-appearance">
      {showTheme ? (
        <fieldset className="rr-appearance-group" disabled={pending}>
          <legend>Tema</legend>
          <div className="rr-appearance-themes">
            {themes.map((theme: Theme) => (
              <label className="rr-appearance-theme" key={theme}>
                <input
                  checked={current.theme === theme}
                  name="appearance-theme"
                  onChange={() => choose({ ...current, theme })}
                  type="radio"
                  value={theme}
                />
                <span>{themeOptions[theme].label}</span>
              </label>
            ))}
          </div>
          <p className="rr-settings-hint">
            &quot;Sistema&quot; sigue el modo claro u oscuro de tu celular.
          </p>
        </fieldset>
      ) : null}

      <fieldset className="rr-appearance-group" disabled={pending}>
        <legend>Color principal</legend>
        <div className="rr-appearance-accents">
          {accents.map((accent: Accent) => (
            <label className="rr-appearance-accent" key={accent}>
              <input
                checked={current.accent === accent}
                name="appearance-accent"
                onChange={() => choose({ ...current, accent })}
                type="radio"
                value={accent}
              />
              <span aria-hidden="true" className={`rr-appearance-swatch is-${accent}`} />
              <span>{accentOptions[accent].label}</span>
            </label>
          ))}
        </div>
        <p className="rr-settings-hint">
          Botones, progreso y detalles de la app. Se guarda en tu cuenta.
        </p>
      </fieldset>

      {error ? (
        <p className="rr-settings-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
