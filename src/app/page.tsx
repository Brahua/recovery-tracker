import { signInWithGoogleAction, signOutAction } from "@/app/auth/actions";
import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { NightlyCloseoutForm } from "@/features/check-in/nightly-closeout/form";
import { PostTherapyForm } from "@/features/check-in/post-therapy/form";
import { signInAnonymouslyForTestingAction } from "@/features/check-in/test-auth/actions";
import { RecoveryDashboard } from "@/features/dashboard/overview";
import { MedicalReport } from "@/features/reports/medical-report";
import { TodayOverview } from "@/features/today/overview";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getRecentDateRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

const foundationItems = [
  "Login con Google via Supabase",
  "Persistencia real con RLS",
  "Repositorio desacoplado de la UI",
  "UI mobile-first en espanol",
];

function getUserDisplayName(user: { email?: string | null }) {
  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email;
  }

  return "usuario autenticado";
}

export default async function Home(props: PageProps<"/">) {
  const supabaseEnv = getSupabaseEnv();
  const supabase = supabaseEnv ? await createServerSupabaseClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const searchParams = await props.searchParams;
  const sessionSuccessMessage =
    typeof searchParams.sessionSummary === "string"
      ? searchParams.sessionSummary
      : undefined;
  const sessionErrorMessage =
    typeof searchParams.sessionError === "string"
      ? searchParams.sessionError
      : undefined;
  const nightlySuccessMessage =
    typeof searchParams.nightlySummary === "string"
      ? searchParams.nightlySummary
      : undefined;
  const nightlyErrorMessage =
    typeof searchParams.nightlyError === "string"
      ? searchParams.nightlyError
      : undefined;
  const repository = user ? await createRecoveryLogRepository() : null;
  const recentRange = getRecentDateRange();
  const recentSessions = repository
    ? (await repository.listRehabSessions(recentRange)).slice(0, 4)
    : [];
  const recentCloseouts = repository
    ? (await repository.listNightlyCloseouts(recentRange)).slice(0, 4)
    : [];

  return (
    <main className="app-shell min-h-screen px-5 py-6 text-[#18201a] sm:px-8">
      <section className="page-frame mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-10 rounded-[28px] border border-[#dfe5d8] p-6 sm:p-10">
        <header className="flex items-center justify-between gap-4">
          <p className="section-kicker text-sm font-semibold uppercase">
            Recovery Ritual
          </p>
          <span className="status-chip rounded-full px-3 py-1 text-sm text-[#4d5e50]">
            MVP
          </span>
        </header>

        {!supabaseEnv || !user ? (
          <div className="grid gap-10 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div className="space-y-6">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.02em] text-[#162117] sm:text-6xl">
                Recuperacion de rodilla con datos, foco y motivacion.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#526154]">
                Recovery Ritual ya tiene auth, persistencia y los dos rituales
                base listos para empezar un seguimiento real.
              </p>
              {!supabaseEnv ? (
                <div className="max-w-2xl rounded-2xl border border-[#d8c97e] bg-[#fff8d6] p-4 text-sm leading-7 text-[#66551a]">
                  Falta configurar <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                  <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> en{" "}
                  <code>.env.local</code>. El scaffold ya esta listo para conectar
                  el proyecto de Supabase y Google OAuth.
                </div>
              ) : (
                <div className="soft-panel max-w-2xl rounded-2xl border border-[#dfe5d8] p-4 text-sm leading-7 text-[#526154]">
                  Inicia sesion para ver la pantalla de hoy, registrar tu sesion
                  y cerrar el dia con datos reales.
                </div>
              )}
            </div>

            <div className="section-card soft-panel grid gap-3 rounded-2xl border p-4">
              {foundationItems.map((item) => (
                <div
                  className="rounded-xl border border-[#dce6d4] bg-[#eef4e8] px-4 py-3 text-sm font-medium text-[#263b29]"
                  key={item}
                >
                  {item}
                </div>
              ))}
              <div className="metric-panel mt-2 rounded-xl border border-[#dfe5d8] p-3">
                {!supabaseEnv ? (
                  <p className="text-sm text-[#5d6b5f]">
                    Configura Supabase para habilitar login y repositorio real.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    <form action={signInWithGoogleAction}>
                      <button
                        className="primary-button w-full rounded-xl bg-[#18201a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243026]"
                        type="submit"
                      >
                        Entrar con Google
                      </button>
                    </form>
                    {process.env.NODE_ENV !== "production" ? (
                      <form action={signInAnonymouslyForTestingAction}>
                        <button
                          className="secondary-button w-full rounded-xl border border-[#d6ddd0] bg-white px-4 py-3 text-sm font-semibold text-[#263b29] hover:bg-[#f1f5ed]"
                          type="submit"
                        >
                          Entrar anonimo para pruebas
                        </button>
                      </form>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <TodayOverview
              recentCloseouts={recentCloseouts}
              recentSessions={recentSessions}
            />

            <RecoveryDashboard
              recentCloseouts={recentCloseouts}
              recentSessions={recentSessions}
            />

            <MedicalReport
              recentCloseouts={recentCloseouts}
              recentSessions={recentSessions}
            />

            <div className="completion-panel section-card soft-panel rounded-[28px] border p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="section-kicker text-sm font-semibold uppercase">
                    Sesion activa
                  </p>
                  <p className="text-sm leading-7 text-[#526154]">
                    Conectado como <strong>{getUserDisplayName(user)}</strong>. Los
                    datos que registres aqui ya quedan persistidos en este entorno.
                  </p>
                </div>
                <form action={signOutAction}>
                  <button
                    className="primary-button rounded-2xl bg-[#18201a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243026]"
                    type="submit"
                  >
                    Cerrar sesion
                  </button>
                </form>
              </div>
            </div>

            <div className="section-card metric-panel grid gap-3 rounded-[28px] border p-5 sm:grid-cols-4 sm:p-6">
              {foundationItems.map((item) => (
                <div
                  className="rounded-2xl border border-[#d8e1d3] bg-white px-4 py-3 text-sm font-medium text-[#263b29]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>

            <div id="post-therapy">
              <PostTherapyForm
                errorMessage={sessionErrorMessage}
                recentSessions={recentSessions}
                successMessage={sessionSuccessMessage}
              />
            </div>

            <div id="nightly-closeout">
              <NightlyCloseoutForm
                errorMessage={nightlyErrorMessage}
                recentCloseouts={recentCloseouts}
                successMessage={nightlySuccessMessage}
              />
            </div>
          </>
        )}

        <footer className="grid gap-3 border-t border-[#dfe5d8] pt-5 text-sm text-[#5d6b5f] sm:grid-cols-3">
          <p>Task 2 cerrada: dominio, constantes y validaciones.</p>
          <p>Task 3 lista: auth, SQL inicial y repositorio.</p>
          <p>Task 12 lista: revision real de navegador y ajuste responsive final.</p>
        </footer>
      </section>
    </main>
  );
}
