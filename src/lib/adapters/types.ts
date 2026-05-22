import type { HealthStatus, QueueItem, ActivityEvent, DiskSpace, SystemInfo } from "../types";

export interface QuerySpec {
  health?: boolean;
  queue?: boolean;
  disk?: boolean;
  activity?: boolean;
  system?: boolean;
}

export interface QueryResult {
  health?: HealthStatus;
  queue?: QueueItem[];
  disk?: DiskSpace;
  activity?: ActivityEvent[];
  system?: SystemInfo;
}

export interface ServiceAdapter {
  readonly id: string;
  readonly capabilities: Set<keyof QuerySpec>;
  query(spec: QuerySpec): Promise<QueryResult>;
  command(action: string): Promise<{ success: boolean; error?: string }>;
}
