import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return <ErrorBoundary><DashboardContent /></ErrorBoundary>;
}
