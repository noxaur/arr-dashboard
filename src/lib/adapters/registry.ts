import type { ServiceAdapter } from "./types";
import { ArrAdapter } from "./arr-adapter";
import { ProwlarrAdapter } from "./prowlarr-adapter";
import { BazarrAdapter } from "./bazarr-adapter";
import { JellyseerrAdapter } from "./jellyseerr-adapter";

const adapters = new Map<string, ServiceAdapter>();

export function getAdapter(serviceId: string): ServiceAdapter {
  let adapter = adapters.get(serviceId);
  if (adapter) return adapter;

  switch (serviceId) {
    case "radarr":
    case "sonarr":
      adapter = new ArrAdapter(serviceId);
      break;
    case "prowlarr":
      adapter = new ProwlarrAdapter();
      break;
    case "bazarr":
      adapter = new BazarrAdapter();
      break;
    case "jellyseerr":
      adapter = new JellyseerrAdapter();
      break;
    default:
      throw new Error(`No adapter for service: ${serviceId}`);
  }

  adapters.set(serviceId, adapter);
  return adapter;
}
