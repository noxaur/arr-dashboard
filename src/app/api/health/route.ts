import { NextResponse } from "next/server";
import { fetchAllServices } from "@/lib/arr-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  const entries = await fetchAllServices("health", serviceId ? { services: [serviceId] } : undefined);

  if (serviceId && !entries[serviceId]) {
    return NextResponse.json({ error: `Failed to check health for ${serviceId}` }, { status: 500 });
  }

  return NextResponse.json(entries);
}
