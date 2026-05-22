import { NextResponse } from "next/server";
import { pauseQueue, refreshMonitored, searchMissing } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin") || request.headers.get("referer");
    const host = request.headers.get("host");
    if (!origin) {
      return NextResponse.json(
        { error: "Missing origin header" },
        { status: 403 }
      );
    }
    if (!host) {
      return NextResponse.json(
        { error: "Missing host header" },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "Missing required fields: service, action" },
        { status: 400 }
      );
    }

    let result: boolean;

    switch (action) {
      case "pause":
        result = await pauseQueue(service);
        break;
      case "refresh":
        result = await refreshMonitored(service);
        break;
      case "search":
        result = await searchMissing(service);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: result, service, action });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
