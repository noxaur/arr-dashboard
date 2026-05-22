import { NextResponse } from "next/server";
import { fetchAllServices } from "@/lib/arr-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  const entries = await fetchAllServices<unknown[]>("queue", serviceId ? { services: [serviceId] } : undefined);

  const results = Object.values(entries).flat();

  if (serviceId && !entries[serviceId]) {
    return NextResponse.json({ error: `Failed to fetch queue for ${serviceId}` }, { status: 500 });
  }

  return NextResponse.json(results);
}
