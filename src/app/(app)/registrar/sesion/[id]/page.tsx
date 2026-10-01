import { notFound, redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { PostTherapyForm } from "@/features/check-in/post-therapy/form";
import { loadExerciseLibrary } from "@/lib/exercise-library";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordIdSchema } from "@/lib/validation/recovery";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  const [session, { catalog }] = await Promise.all([
    repository.getRehabSession(id),
    loadExerciseLibrary({ includeRoutines: false }),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <PostTherapyForm
      catalog={catalog}
      defaultOccurredAt={new Date().toISOString()}
      editingSession={session}
      recentSessions={[]}
      routines={[]}
    />
  );
}
