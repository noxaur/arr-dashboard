import { redirect } from "next/navigation";
import { services } from "@/lib/services";

export default function ProwlarrPage() {
  redirect(services.prowlarr.url || "/");
}
