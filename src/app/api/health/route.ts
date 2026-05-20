import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/api";
import { mockHealth } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");

  if (!serviceId) {
    return NextResponse.json(mockHealth);
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
