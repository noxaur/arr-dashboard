export type EventType = "download" | "import" | "search" | "refresh" | "error" | "request";

export interface ActivityEvent {
  id: number;
  service: string;
  type: EventType;
  title: string;
  message: string;
  timestamp: string;
  quality?: string;
  qualityVersion?: number;
  indexer?: string;
  downloadClient?: string;
  size?: string;
  score?: number;
  user?: string;
  source?: string;
  protocol?: "usenet" | "torrent";
  movie?: { title: string; year?: number };
  series?: { title: string; season?: number; episode?: number; episodeTitle?: string };
  subtitle?: { language: string; type?: string };
  duration?: string;
}

export interface EventGroup {
  events: ActivityEvent[];
  count: number;
}

export interface HealthStatus {
  status: "healthy" | "warning" | "error" | "offline";
  message: string;
  version: string;
  responseTime: number;
}

export interface QueueItem {
  id: number;
  title: string;
  progress: number;
  status: "downloading" | "queued" | "importing" | "failed";
  size: string;
  sizeLeft: string;
  eta: string;
  service: string;
}

export interface DiskSpace {
  used: string;
  total: string;
  percent: number;
  usedBytes?: number;
  mounts?: Array<{ path: string; used: string; total: string }>;
}

export interface SystemInfo {
  os: string;
  version: string;
  docker: boolean;
  uptime: string;
}

export interface JellyfinSystemInfo {
  os: string;
  version: string;
  architecture: string;
  startTime: string | null;
  serverName: string;
}

export interface DashboardServiceData {
  id: string;
  health: HealthStatus;
  queue: QueueItem[];
  disk: DiskSpace;
  activity: ActivityEvent[];
  system: SystemInfo;
}

export interface DashboardResponse {
  services: DashboardServiceData[];
  jellyfin: JellyfinSystemInfo | null;
  activeStreams: number;
  totalQueue: number;
  activeDownloads: number;
  healthAlerts: number;
  totalDiskUsed: number;
  allActivity: ActivityEvent[];
}

export interface EventsResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const SERVICE_IDS = ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  apiEndpoint: string;
  icon: string;
  color: string;
  apiKeyEnv: string;
}
