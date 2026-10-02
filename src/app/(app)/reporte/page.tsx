import { redirect } from "next/navigation";

import { createGoalsRepository } from "@/data/goals-repository";
import { MedicalReport } from "@/features/reports/medical-report";
import { parseCondition } from "@/lib/validation/condition";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReportePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedRange = resolvedSearchParams.range;
  const windowDays = requestedRange === "7" ? 7 : requestedRange === "14" ? 14 : 30;
  const { supabaseEnv, user, recentSessions, recentCloseouts } = await loadRecoveryPageData({
    limit: null,
  });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const goals = await (await createGoalsRepository()).listGoals();

  return (
    <MedicalReport
      goals={goals}
      condition={parseCondition(user.user_metadata?.condition)}
      now={new Date().toISOString()}
      recentCloseouts={recentCloseouts}
      recentSessions={recentSessions}
      windowDays={windowDays}
    />
  );
}
