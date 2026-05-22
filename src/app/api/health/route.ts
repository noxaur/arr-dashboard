import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (!serviceId) {
    const results = await Promise.all(serviceOrder.map(async (id) => ({ [id]: await checkHealth(id) })));
    return NextResponse.json(Object.assign({}, ...results));
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
