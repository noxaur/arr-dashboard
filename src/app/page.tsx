import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <ErrorBoundary><DashboardContent /></ErrorBoundary>;
}
