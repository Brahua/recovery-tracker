import { notFound, redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { NightlyCloseoutForm } from "@/features/check-in/nightly-closeout/form";
import { getCloseoutDateError } from "@/lib/closeout-date";
import { getRecoveryDateKey } from "@/lib/recovery-date";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordIdSchema } from "@/lib/validation/recovery";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EditCloseoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  if (!recordIdSchema.safeParse(id).success) {
    notFound();
  }

  // Same guard as Registrar: no Supabase or no user goes back to the landing.
  if (!getSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const repository = await createRecoveryLogRepository();
  const closeout = await repository.getNightlyCloseout(id);

  if (!closeout) {
    notFound();
  }

  // Changing the date reloads the page with ?date= to check that day.
  const requestedDate = resolvedSearchParams.date;
  const selectedDate =
    typeof requestedDate === "string" && !getCloseoutDateError(requestedDate)
      ? requestedDate
      : closeout.date;
  const dayData = await loadRecoveryPageData({
    from: selectedDate,
    limit: null,
    to: selectedDate,
  });
  const otherCloseout = dayData.recentCloseouts.find(
    (item) => item.date === selectedDate && item.id !== closeout.id,
  );
  const selectedSession = dayData.recentSessions.find(
    (session) => getRecoveryDateKey(session.occurredAt) === selectedDate,
  );

  return (
    <NightlyCloseoutForm
      defaultOccurredAt={new Date().toISOString()}
      editingCloseout={closeout}
      recentCloseouts={[]}
      selectedCloseout={otherCloseout}
      selectedDate={selectedDate}
      selectedSession={selectedSession}
    />
  );
}
