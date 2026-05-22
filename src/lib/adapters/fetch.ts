import { services } from "../services";
import { getBasicAuth } from "../auth";
import { env } from "../env";

export async function arrFetch(
  serviceId: string,
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const service = services[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  const baseUrl = service.url.replace(/\/$/, "");
  if (!baseUrl) throw new Error(`Missing URL for ${serviceId}`);

  const apiKey = (env as Record<string, string | undefined>)[service.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing API key for ${serviceId}`);

  const url = `${baseUrl}${service.apiEndpoint}${endpoint}`;
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const auth = getBasicAuth(serviceId);
      const headers: Record<string, string> = {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      };
      if (options?.headers) Object.assign(headers, options.headers);
      if (auth) headers.Authorization = auth;

      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
        headers,
        cache: "no-store",
      });
      return res;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const isConfigError = msg.startsWith("Missing") || msg.startsWith("Unknown service");
      if (isConfigError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${serviceId}`);
}
