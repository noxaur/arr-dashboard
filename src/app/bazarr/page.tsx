import { redirect } from "next/navigation";
import { services } from "@/lib/services";

export default function BazarrPage() {
  redirect(services.bazarr.url || "/");
}
