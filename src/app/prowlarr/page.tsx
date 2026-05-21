import { redirect } from "next/navigation";
import { services } from "@/lib/services";
import Link from "next/link";

export default function ProwlarrPage() {
  const service = services.prowlarr;
  
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
