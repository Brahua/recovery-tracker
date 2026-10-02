import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import Link from "@/components/app-link";
import { FormPendingReporter } from "@/components/feedback/form-pending-reporter";
import { createAccessRepository } from "@/data/access-repository";
import { createRemindersRepository } from "@/data/reminders-repository";
import { AccessSettings } from "@/features/access/access-settings";
import { AppearanceSettings } from "@/features/appearance/appearance-settings";
import { RemindersSettings } from "@/features/reminders/reminders-settings";
import { InstallGuide } from "@/features/settings/install-guide";
import { ProfileForm } from "@/features/settings/profile-form";
import { isAppAdmin } from "@/lib/access";
import { appearanceFromMetadata } from "@/lib/appearance";
import { ONBOARDING_REPLAY_PATH } from "@/lib/onboarding";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { getChosenDisplayName, getUserDisplayName } from "@/lib/user-display-name";

export default async function AjustesPage() {
  const { supabaseEnv, user } = await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const reminderSettings = await (await createRemindersRepository()).getSettings();
  // The database checks the admin role again on every access call.
  const accessOverview = isAppAdmin(user)
    ? await (await createAccessRepository()).getOverview()
    : null;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
  const identity = { email: user.email, user_metadata: user.user_metadata };
  // The placeholder shows what the app would use if the chosen name is cleared.
  const fallbackName = getUserDisplayName({
    ...identity,
    user_metadata: { ...user.user_metadata, display_name: null },
  });

  return (
    <section className="rr-settings">
      <header className="rr-settings-header">
        <p className="rr-kicker">Tu cuenta</p>
        <h1 className="rr-page-title">Ajustes</h1>
        <p>Cómo te llama la app, cómo se ve, cómo tenerla en tu celular y cuándo avisarte.</p>
      </header>

      <section aria-labelledby="ajustes-perfil" className="rr-settings-card">
        <h2 id="ajustes-perfil">Perfil</h2>
        <ProfileForm chosenName={getChosenDisplayName(identity)} fallbackName={fallbackName} />
      </section>

      <section aria-labelledby="ajustes-apariencia" className="rr-settings-card">
        <h2 id="ajustes-apariencia">Apariencia</h2>
        <AppearanceSettings appearance={appearanceFromMetadata(user.user_metadata)} showTheme />
      </section>

      <section aria-labelledby="ajustes-instalar" className="rr-settings-card">
        <h2 id="ajustes-instalar">Instalar en tu celular</h2>
        <p className="rr-settings-hint">
          Con la app en la pantalla de inicio se abre a pantalla completa, como cualquier otra app.
        </p>
        <InstallGuide />
      </section>

      <section aria-labelledby="ajustes-recordatorios" className="rr-settings-card">
        <h2 id="ajustes-recordatorios">Recordatorios</h2>
        <RemindersSettings settings={reminderSettings} vapidPublicKey={vapidPublicKey} />
      </section>

      <section aria-labelledby="ajustes-cuenta" className="rr-settings-card">
        <h2 id="ajustes-cuenta">Cuenta</h2>
        <Link className="rr-settings-link" href={ONBOARDING_REPLAY_PATH}>
          Ver el recorrido de la app otra vez
        </Link>
        {user.email ? (
          <p className="rr-settings-hint">
            Entraste con <strong>{user.email}</strong>.
          </p>
        ) : null}
        <form action={signOutAction}>
          <FormPendingReporter />
          <button className="rr-button rr-button--secondary rr-settings-signout" type="submit">
            Cerrar sesión
          </button>
        </form>
      </section>

      {accessOverview ? (
        <section aria-labelledby="ajustes-acceso" className="rr-settings-card">
          <h2 id="ajustes-acceso">Acceso</h2>
          <AccessSettings overview={accessOverview} />
        </section>
      ) : null}
    </section>
  );
}
