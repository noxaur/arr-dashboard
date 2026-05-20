import { redirect } from "next/navigation";
import { services } from "@/lib/services";

// Must be a server component — process.env.RADARR_URL is not available client-side
export default function RadarrPage() {
  redirect(services.radarr.url || "/");
}
