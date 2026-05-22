import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (!serviceId) {
    const results = await Promise.all(
      serviceOrder.map((id) => checkHealth(id))
    );
    return NextResponse.json(
      Object.fromEntries(serviceOrder.map((id, i) => [id, results[i]]))
    );
  }

  if (!serviceOrder.includes(serviceId)) {
    return NextResponse.json(
      { error: `Invalid service: ${serviceId}` },
      { status: 400 }
    );
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
