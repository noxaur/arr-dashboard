import { NextResponse } from "next/server";
import { getQueue } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (!serviceId) {
    const results = await Promise.all(
      serviceOrder.map((id) => getQueue(id))
    );
    return NextResponse.json(results.flat());
  }

  if (!serviceOrder.includes(serviceId)) {
    return NextResponse.json(
      { error: `Invalid service: ${serviceId}` },
      { status: 400 }
    );
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
