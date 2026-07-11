export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-5 py-6 text-[#18201a] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center rounded-[28px] border border-[#dfe5d8] bg-[#fbfcf7] p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
          Recovery Ritual
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-[#162117] sm:text-4xl">
          No se pudo completar el login.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#526154]">
          Revisa la configuracion de Google OAuth y las redirect URLs en
          Supabase. Luego vuelve a intentar desde la pantalla principal.
        </p>
      </section>
    </main>
  );
}
