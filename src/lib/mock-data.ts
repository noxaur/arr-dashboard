import type {
  HealthStatus,
  QueueItem,
  ActivityEvent,
  DiskSpace,
  JellyfinSystemInfo,
} from "./types";

export type { HealthStatus, QueueItem, ActivityEvent, DiskSpace, JellyfinSystemInfo };

export const mockJellyfinSystemInfo: JellyfinSystemInfo = {
  os: "Linux",
  version: "10.10.6",
  architecture: "x64",
  startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
  serverName: "Media Server",
};

const now = new Date();

function timeAgo(minutes: number): string {
  return new Date(now.getTime() - minutes * 60000).toISOString();
}

export const mockHealth: Record<string, HealthStatus> = {
  radarr: {
    status: "healthy",
    message: "All systems operational",
    version: "5.18.4.9568",
    responseTime: 42,
  },
  sonarr: {
    status: "healthy",
    message: "All systems operational",
    version: "4.0.12.2829",
    responseTime: 38,
  },
  prowlarr: {
    status: "warning",
    message: "2 indexers experiencing timeouts",
    version: "1.30.1.4928",
    responseTime: 180,
  },
  bazarr: {
    status: "healthy",
    message: "All systems operational",
    version: "1.5.1",
    responseTime: 28,
  },
  jellyseerr: {
    status: "healthy",
    message: "All systems operational",
    version: "2.3.0",
    responseTime: 55,
  },
};

export const mockQueue: QueueItem[] = [
  {
    id: 1,
    title: "Dune: Part Two (2024)",
    progress: 73,
    status: "downloading",
    size: "4.2 GB",
    sizeLeft: "1.1 GB",
    eta: "3 min",
    service: "radarr",
  },
  {
    id: 2,
    title: "The Bear S03E05",
    progress: 45,
    status: "downloading",
    size: "1.8 GB",
    sizeLeft: "990 MB",
    eta: "5 min",
    service: "sonarr",
  },
  {
    id: 3,
    title: "Oppenheimer (2023)",
    progress: 0,
    status: "queued",
    size: "6.1 GB",
    sizeLeft: "6.1 GB",
    eta: "12 min",
    service: "radarr",
  },
  {
    id: 4,
    title: "Shogun S01E08",
    progress: 92,
    status: "importing",
    size: "2.4 GB",
    sizeLeft: "0 MB",
    eta: "30 sec",
    service: "sonarr",
  },
  {
    id: 5,
    title: "Poor Things (2023)",
    progress: 12,
    status: "downloading",
    size: "3.8 GB",
    sizeLeft: "3.3 GB",
    eta: "18 min",
    service: "radarr",
  },
  {
    id: 6,
    title: "True Detective S04E03",
    progress: 0,
    status: "queued",
    size: "1.5 GB",
    sizeLeft: "1.5 GB",
    eta: "8 min",
    service: "sonarr",
  },
];

export const mockActivity: ActivityEvent[] = [
  {
    id: 1,
    service: "radarr",
    type: "import",
    title: "Movie imported",
    message: "Killers of the Flower Moon (2023) imported to /movies",
    timestamp: timeAgo(2),
  },
  {
    id: 2,
    service: "sonarr",
    type: "download",
    title: "Download started",
    message: "The Bear S03E06 grabbed from PTP",
    timestamp: timeAgo(5),
  },
  {
    id: 3,
    service: "jellyseerr",
    type: "request",
    title: "New request",
    message: "User requested: The Substance (2024)",
    timestamp: timeAgo(12),
  },
  {
    id: 4,
    service: "prowlarr",
    type: "error",
    title: "Indexer error",
    message: "IPTorrents: Connection timeout after 30s",
    timestamp: timeAgo(18),
  },
  {
    id: 5,
    service: "bazarr",
    type: "search",
    title: "Subtitle search",
    message: "Searching subtitles for 3 episodes",
    timestamp: timeAgo(25),
  },
  {
    id: 6,
    service: "radarr",
    type: "download",
    title: "Download started",
    message: "Dune: Part Two (2024) grabbed from HDT",
    timestamp: timeAgo(32),
  },
  {
    id: 7,
    service: "sonarr",
    type: "import",
    title: "Episode imported",
    message: "Shogun S01E07 imported to /tv/Shogun",
    timestamp: timeAgo(45),
  },
  {
    id: 8,
    service: "prowlarr",
    type: "error",
    title: "Indexer error",
    message: "AlphaRatio: Rate limit exceeded, retrying in 5m",
    timestamp: timeAgo(52),
  },
  {
    id: 9,
    service: "jellyseerr",
    type: "request",
    title: "Request approved",
    message: "Anora (2024) approved for download",
    timestamp: timeAgo(68),
  },
  {
    id: 10,
    service: "bazarr",
    type: "import",
    title: "Subtitle imported",
    message: "English subtitle imported for The Bear S03E05",
    timestamp: timeAgo(85),
  },
  {
    id: 11,
    service: "sonarr",
    type: "refresh",
    title: "Series refreshed",
    message: "True Detective S04 metadata refreshed",
    timestamp: timeAgo(120),
  },
  {
    id: 12,
    service: "radarr",
    type: "search",
    title: "Automatic search",
    message: "Searching for Poor Things (2023)",
    timestamp: timeAgo(145),
  },
];
