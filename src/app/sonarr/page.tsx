import { redirect } from "next/navigation";
import { services } from "@/lib/services";

// Must be a server component — process.env.SONARR_URL is not available client-side
export default function SonarrPage() {
  redirect(services.sonarr.url || "/");
}
