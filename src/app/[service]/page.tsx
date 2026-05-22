import { redirect, notFound } from "next/navigation";
import { services } from "@/lib/services";
import Link from "next/link";
import { SERVICE_IDS } from "@/lib/types";

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: serviceId } = await params;
  if (!SERVICE_IDS.includes(serviceId as never)) notFound();

  const service = services[serviceId];

  if (!service.url) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">{service.name} URL is not configured.</p>
          <Link href="/" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  redirect(service.url);
}
