import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createRoutineRepository } from "@/data/routine-repository";
import { RoutineEditor } from "@/features/routines/routine-editor";

import { loadRoutinePageData } from "../routine-page-data";

export default async function RutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, streak, catalog } = await loadRoutinePageData();
  const routineRepository = await createRoutineRepository();
  const routine = await routineRepository.getRoutine(id);

  if (!routine) {
    notFound();
  }

  return (
    <AppShell pathname="/ejercicios" streak={streak} user={user}>
      <RoutineEditor catalog={catalog} key={routine.updatedAt} routine={routine} />
    </AppShell>
  );
}
