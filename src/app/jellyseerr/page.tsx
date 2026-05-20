import { redirect } from "next/navigation";
import { services } from "@/lib/services";

// Must be a server component — process.env.JELLYSEERR_URL is not available client-side
export default function JellyseerrPage() {
  redirect(services.jellyseerr.url || "/");
}
