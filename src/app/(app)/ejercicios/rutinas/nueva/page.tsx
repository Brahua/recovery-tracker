import { RoutineEditor } from "@/features/routines/routine-editor";

import { loadRoutinePageData } from "../routine-page-data";

export default async function NuevaRutinaPage() {
  const { catalog } = await loadRoutinePageData();

  return (
    <RoutineEditor catalog={catalog} />
  );
}
