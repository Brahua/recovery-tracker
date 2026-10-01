import { redirect } from "next/navigation";

import { createRemindersRepository } from "@/data/reminders-repository";
import { RemindersSettings } from "@/features/reminders/reminders-settings";
import { InstallGuide } from "@/features/settings/install-guide";
import { ProfileForm } from "@/features/settings/profile-form";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { getChosenDisplayName, getUserDisplayName } from "@/lib/user-display-name";

export default async function AjustesPage() {
  const { supabaseEnv, user } = await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const reminderSettings = await (await createRemindersRepository()).getSettings();
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
        <h1 className="rr-display">Ajustes</h1>
        <p>Cómo te llama la app, cómo tenerla en tu celular y cuándo avisarte.</p>
      </header>

      <section aria-labelledby="ajustes-perfil" className="rr-settings-card">
        <h2 id="ajustes-perfil">Perfil</h2>
        <ProfileForm chosenName={getChosenDisplayName(identity)} fallbackName={fallbackName} />
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
    </section>
  );
}
