import { AppShell } from "@/components/app-shell";
import { RoutineEditor } from "@/features/routines/routine-editor";

import { loadRoutinePageData } from "../routine-page-data";

export default async function NuevaRutinaPage() {
  const { user, streak, catalog } = await loadRoutinePageData();

  return (
    <AppShell pathname="/ejercicios" streak={streak} user={user}>
      <RoutineEditor catalog={catalog} />
    </AppShell>
  );
}
