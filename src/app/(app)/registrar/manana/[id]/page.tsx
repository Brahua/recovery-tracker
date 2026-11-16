import { notFound, redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { MorningCheckinForm } from "@/features/check-in/morning-checkin/form";
import { getMorningCheckinDateError } from "@/lib/morning-checkin-date";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseCondition } from "@/lib/validation/condition";
import { recordIdSchema } from "@/lib/validation/recovery";

type SearchParams = Record<string, string | string[] | undefined>;

// Correct a saved "¿Cómo amaneciste?" (from Historial).
export default async function EditMorningCheckinPage({
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
  const checkin = await repository.getMorningCheckin(id);

  if (!checkin) {
    notFound();
  }

  const today = getRecoveryDateKey();
  // Changing the date reloads the page with ?date= to check that day.
  const requestedDate = resolvedSearchParams.date;
  const selectedDate =
    typeof requestedDate === "string" && !getMorningCheckinDateError(requestedDate, today)
      ? requestedDate
      : checkin.date;
  const dayBefore = addRecoveryDays(selectedDate, -1);
  const around = await loadRecoveryPageData({ from: dayBefore, to: selectedDate, limit: null });

  return (
    <MorningCheckinForm
      condition={parseCondition(user.user_metadata?.condition)}
      editingCheckin={checkin}
      existingCheckin={around.rangeCheckins.find((item) => item.date === selectedDate)}
      hadSessionsDayBefore={around.rangeSessions.some(
        (session) => getRecoveryDateKey(session.occurredAt) === dayBefore,
      )}
      selectedDate={selectedDate}
      today={today}
    />
  );
}
