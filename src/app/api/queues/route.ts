import { NextResponse } from "next/server";
import { getQueue } from "@/lib/api";
import { mockQueue } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (!serviceId) {
    return NextResponse.json(mockQueue);
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
