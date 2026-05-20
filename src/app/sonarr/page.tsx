import { redirect } from "next/navigation";
import { services } from "@/lib/services";

export default function SonarrPage() {
  redirect(services.sonarr.url || "/");
}
