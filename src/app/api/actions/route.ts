import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapters/registry";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin") || request.headers.get("referer");
    const host = request.headers.get("host");
    if (!origin || !host) {
      return NextResponse.json({ error: "Missing origin or host header" }, { status: 403 });
    }
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    if (originHost !== host) {
      return NextResponse.json({ error: "Cross-origin requests not allowed" }, { status: 403 });
    }

    const body = await request.json();
    const { service, action } = body;

    if (!service || !action) {
      return NextResponse.json({ error: "Missing required fields: service, action" }, { status: 400 });
    }

    let adapter;
    try {
      adapter = getAdapter(service);
    } catch {
      return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
    }

    const result = await adapter.command(action);

    return NextResponse.json({ success: result.success, service, action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[actions] Failed to execute action:", message);
    return NextResponse.json({ error: `Failed to execute action: ${message}` }, { status: 500 });
  }
}
