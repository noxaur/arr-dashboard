import { NextResponse } from "next/server";
import { getQueue } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (serviceId && !serviceOrder.includes(serviceId)) {
    return NextResponse.json({ error: `Unknown service: ${serviceId}` }, { status: 400 });
  }

  if (!serviceId) {
    const results: Awaited<ReturnType<typeof getQueue>> = [];
    for (const id of serviceOrder) {
      results.push(...(await getQueue(id)));
    }
    return NextResponse.json(results);
  }

  try {
    const queue = await getQueue(serviceId);
    return NextResponse.json(queue);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch queue for ${serviceId}` },
      { status: 500 }
    );
  }
}
