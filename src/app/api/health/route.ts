import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (serviceId && !serviceOrder.includes(serviceId)) {
    return NextResponse.json({ error: `Unknown service: ${serviceId}` }, { status: 400 });
  }

  if (!serviceId) {
    const results: Record<string, Awaited<ReturnType<typeof checkHealth>>> = {};
    for (const id of serviceOrder) {
      results[id] = await checkHealth(id);
    }
    return NextResponse.json(results);
  }

  try {
    const health = await checkHealth(serviceId);
    return NextResponse.json({ [serviceId]: health });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to check health for ${serviceId}` },
      { status: 500 }
    );
  }
}
