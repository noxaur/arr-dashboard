import { redirect } from "next/navigation";
import { services } from "@/lib/services";

// Must be a server component — process.env.PROWLARR_URL is not available client-side
export default function ProwlarrPage() {
  redirect(services.prowlarr.url || "/");
}
