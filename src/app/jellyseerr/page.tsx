import { redirect } from "next/navigation";
import { services } from "@/lib/services";

export default function JellyseerrPage() {
  redirect(services.jellyseerr.url || "/");
}
