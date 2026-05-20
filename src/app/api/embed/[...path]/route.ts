import { NextRequest, NextResponse } from "next/server";
import { getBasicAuth } from "@/lib/auth";

const SERVICES: Record<string, string> = {
  radarr: process.env.RADARR_URL || "https://jellyradarr-admin.opsec.rent",
  sonarr: process.env.SONARR_URL || "https://jellysonarr-admin.opsec.rent",
  prowlarr: process.env.PROWLARR_URL || "https://jellyprowlarr-admin.opsec.rent",
  bazarr: process.env.BAZARR_URL || "https://jellybazarr.opsec.rent",
  jellyseerr: process.env.JELLYSEERR_URL || "https://jellyseerr.opsec.rent",
};

const SERVICE_API_ROOTS: Record<string, string> = {
  radarr: "/api/v3",
  sonarr: "/api/v3",
  prowlarr: "/api/v1",
  bazarr: "/api",
  jellyseerr: "/api/v1",
};

function rewriteSetCookie(header: string, service: string): string {
  return header
    .replace(/; SameSite=Lax/gi, "; SameSite=None; Secure")
    .replace(/; SameSite=Strict/gi, "; SameSite=None; Secure")
    .replace(/; Domain=[^;]+/gi, "")
    .replace(/; Path=\/(;|$)/gi, `; Path=/api/embed/${service}/$1`);
}

async function proxyRequest(req: NextRequest, service: string, path: string) {
  const target = SERVICES[service];
  if (!target) {
    return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }

  const baseUrl = target.replace(/\/$/, "");
  const upstreamUrl = path ? `${baseUrl}/${path}${req.nextUrl.search}` : `${baseUrl}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("origin");
  headers.delete("referer");
  headers.set("Authorization", getBasicAuth(service));

  let body: BodyInit | undefined;
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  const upstreamRes = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  // Handle redirects - rewrite Location to stay within proxy
  if ([301, 302, 303, 307, 308].includes(upstreamRes.status)) {
    const location = upstreamRes.headers.get("location");
    if (location) {
      const url = new URL(location, baseUrl);
      const newPath = `/api/embed/${service}${url.pathname}${url.search}`;
      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: { Location: newPath },
      });
    }
  }

  const responseHeaders = new Headers();
  for (const [key, value] of upstreamRes.headers.entries()) {
    const lower = key.toLowerCase();

    if (lower === "x-frame-options") continue;
    if (lower === "content-security-policy") {
      const cleaned = value.replace(/frame-ancestors[^;]*;?/gi, "").replace(/x-frame-options[^;]*;?/gi, "");
      if (cleaned.trim()) responseHeaders.set(key, cleaned);
      continue;
    }
    if (lower === "set-cookie") {
      const rewritten = rewriteSetCookie(value, service);
      responseHeaders.append(key, rewritten);
      continue;
    }
    if (["transfer-encoding", "connection", "content-length", "content-encoding"].includes(lower)) continue;

    responseHeaders.set(key, value);
  }

  // Add headers to allow iframe embedding
  responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
  responseHeaders.delete("Content-Security-Policy");

  const responseBody = await upstreamRes.arrayBuffer();

  const contentType = responseHeaders.get("content-type") || "";

  // Rewrite initialize.json to fix urlBase and apiRoot
  if (path.endsWith("initialize.json") && contentType.includes("json")) {
    try {
      const json = JSON.parse(new TextDecoder().decode(responseBody));
      const proxyRoot = `/api/embed/${service}`;
      const apiRoot = SERVICE_API_ROOTS[service] || "/api";
      const rewritten = JSON.stringify({
        ...json,
        urlBase: proxyRoot,
        apiRoot: `${proxyRoot}${apiRoot}`,
        enableUpdateCheck: false,
        branch: json.branch || "master",
        version: json.version || "",
        instanceName: json.instanceName || service,
      });
      return new NextResponse(rewritten, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: responseHeaders,
      });
    } catch {
      // If JSON parse fails, fall through to return original
    }
  }

  // Rewrite HTML: inject <base> tag + fix inline urlBase assignments + rewrite absolute URLs
  if (contentType.includes("text/html")) {
    const text = new TextDecoder().decode(responseBody);
    const proxyRoot = `/api/embed/${service}`;
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

    let rewritten = text;

    // 1. Remove upstream inline scripts that set window.ServiceName = { urlBase: '' }
    rewritten = rewritten.replace(
      new RegExp(`<script>window\\.${serviceName}\\s*=\\s*\\{[\\s\\S]*?\\};?\\s*<\\/script>`, "gi"),
      ""
    );

    // 2. Rewrite root-relative URLs BEFORE injecting <base> (avoids double-rewriting the <base> href)
    rewritten = rewritten
      .replace(/(src|href)="\/([^/"' ])/g, `$1="${proxyRoot}/$2`)
      .replace(/url\('\/([^')]+)/g, `url('${proxyRoot}/$1`)
      .replace(/url\("\/([^")]+)/g, `url("${proxyRoot}/$1`)
      .replace(/url\(\/([^')")]+)/g, `url(${proxyRoot}/$1`);

    // 3. Inject window.ServiceName override as the FIRST <script> in <head>, BEFORE any other scripts
    rewritten = rewritten.replace(
      /<script/,
      `<script>(function(){var n="${serviceName}";if(!window[n])window[n]={};window[n].urlBase="${proxyRoot}";window[n].apiRoot="${proxyRoot}${SERVICE_API_ROOTS[service] || "/api"}";})();</script><script`
    );

    // 4. Inject <base> tag as first child of <head>
    rewritten = rewritten.replace("<head>", `<head><base href="${proxyRoot}/">`);

    return new NextResponse(rewritten, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });
  }

  // Rewrite CSS url() references
  if (contentType.includes("text/css")) {
    const text = new TextDecoder().decode(responseBody);
    const rewritten = text
      .replace(/url\('\/([^')]+)/g, `url('/api/embed/${service}/$1`)
      .replace(/url\("\/([^")]+)/g, `url("/api/embed/${service}/$1`)
      .replace(/url\(\/([^')")]+)/g, `url(/api/embed/${service}/$1`);
    return new NextResponse(rewritten, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });
  }

  return new NextResponse(responseBody, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const [service, ...rest] = resolved.path;
  return proxyRequest(req, service, rest.join("/"));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const [service, ...rest] = resolved.path;
  return proxyRequest(req, service, rest.join("/"));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const [service, ...rest] = resolved.path;
  return proxyRequest(req, service, rest.join("/"));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const [service, ...rest] = resolved.path;
  return proxyRequest(req, service, rest.join("/"));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const [service, ...rest] = resolved.path;
  return proxyRequest(req, service, rest.join("/"));
}
