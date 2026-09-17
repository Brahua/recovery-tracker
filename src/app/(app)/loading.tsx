import { PageSkeleton } from "@/components/page-skeleton";

// Shown inside the persistent shell while a route's server data streams in.
export default function Loading() {
  return <PageSkeleton />;
}
