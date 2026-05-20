import { redirect } from "next/navigation";
import { services } from "@/lib/services";

// Must be a server component — process.env.BAZARR_URL is not available client-side
export default function BazarrPage() {
  redirect(services.bazarr.url || "/");
}
