import { ErrorBoundary } from "@/components/error-boundary";
import { EventsContent } from "../events-content";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return <ErrorBoundary><EventsContent /></ErrorBoundary>;
}
