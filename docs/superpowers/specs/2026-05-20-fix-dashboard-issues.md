# Implementation Spec: Fix Dashboard Issues

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Fix disk space calculation — dedup mounts by `totalSpace`; dedup cross-service by `total` | ✅ Implemented |
| 6 | Top bar disk stat uses deduplicated calculation; "No disk data" for services without disk API | ✅ Implemented |
| 2 | Wire up action buttons (refresh, search) | 🔲 Not implemented |
| 3 | Add auto-refresh (polling or revalidate) | 🔲 Not implemented |
| 4 | Add Jellyfin system info integration | 🔲 Not implemented |
| 5 | Fix Jellyseerr activity endpoint | 🔲 Not implemented |

## Problem Statement

After removing iframes, the dashboard has several critical issues:

1. **Disk space is wrong** — Shows 1.5 TB used / 1.9 TB total (83%). Reality: ~200 GB used. The API returns multiple mount points (`/`, `/config`, `/downloads`, `/movies`) all pointing to the same underlying disk. The code sums them as separate disks, multiplying the total by 4x.

2. **Action buttons don't work** — Refresh and Search buttons are plain `<button>` elements with no `onClick` handlers. They do nothing.

3. **No auto-refresh** — Dashboard is a server component that fetches once on page load. Data is stale immediately. No polling or revalidation.

4. **System info shows "alpine" and "Docker"** — This is technically correct (the services run in Docker on Alpine), but it's not useful information for the user. They want to know about the host machine.

5. **Bazarr card missing disk space** — Bazarr doesn't have a disk space API endpoint.

6. **Jellyseerr shows "No recent activity"** — The API endpoint may not be returning data correctly.

7. **Top bar disk stat is wrong** — Same calculation bug as #1.

## Root Cause Analysis

### Disk Space Bug
The `/api/v3/diskspace` endpoint returns an array of mount points:
```json
[
  {"path": "/", "freeSpace": 42636525568, "totalSpace": 249845608448},
  {"path": "/config", "freeSpace": 42636525568, "totalSpace": 249845608448},
  {"path": "/downloads", "freeSpace": 42636525568, "totalSpace": 249845608448},
  {"path": "/movies", "freeSpace": 42636525568, "totalSpace": 249845608448}
]
```

All 4 entries have the same `totalSpace` because they're the same disk (Docker volume mount). The current code sums all `totalSpace` values: 4 × 249 GB = 996 GB ≈ 1 TB. Then it sums all `freeSpace` and calculates used. This is fundamentally wrong.

**Fix:** Deduplicate by `totalSpace` value. Only count unique disk sizes. Or better: use the `/` mount point as the canonical disk, and show per-mount breakdown.

### Action Buttons Bug
The buttons are rendered as plain `<button className="btn-ghost">` with no event handlers. The API route `/api/actions` exists and works, but nothing calls it.

**Fix:** Convert the page to a client component or add client-side action handlers that POST to `/api/actions`.

### No Auto-Refresh
Server components fetch once. No revalidation interval.

**Fix:** Add a client-side polling component that re-fetches every 30 seconds, or use Next.js `revalidate` with ISR.

## Jellyfin API Integration

The user offered Jellyfin API access. Jellyfin runs on the same host machine as the *arr services, so its system info reflects the actual host.

### Relevant Jellyfin Endpoints
| Endpoint | Auth | Returns |
|---|---|---|
| `GET /System/Info/Public` | None | Server name, version, OS, architecture |
| `GET /System/Info` | Token | Full system info including paths, transcoding info |
| `GET /System/Logs` | Token | Recent log entries |
| `GET /Sessions` | Token | Active user sessions |
| `GET /Items/Counts` | Token | Library item counts (movies, shows, episodes) |

Jellyfin auth uses `X-Emby-Token` header or `Authorization: MediaBrowser Token="..."`.

## Implementation Plan

### Phase 1: Fix Disk Space Calculation

**File:** `src/lib/api.ts` — `getDiskSpace()`

**Change:** Instead of summing all mount points, deduplicate by `totalSpace`. Use the unique disk sizes to calculate real totals.

```typescript
// Group mounts by totalSpace (same disk = same totalSpace)
const uniqueDisks = new Map<number, { freeSpace: number; totalSpace: number }>();
for (const mount of data) {
  if (!uniqueDisks.has(mount.totalSpace)) {
    uniqueDisks.set(mount.totalSpace, { freeSpace: mount.freeSpace, totalSpace: mount.totalSpace });
  }
}
// Sum unique disks only
let totalBytes = 0;
let freeBytes = 0;
for (const disk of uniqueDisks.values()) {
  totalBytes += disk.totalSpace;
  freeBytes += disk.freeSpace;
}
```

Also return per-mount breakdown for display:
```typescript
return {
  used: formatBytes(usedBytes),
  total: formatBytes(totalBytes),
  percent,
  mounts: data.map(m => ({ path: m.path, used: formatBytes(m.totalSpace - m.freeSpace), total: formatBytes(m.totalSpace) })),
};
```

### Phase 2: Wire Up Action Buttons

**File:** `src/app/page.tsx`

**Change:** Convert action buttons to call `/api/actions` via fetch. Since the page is a server component, extract the action buttons into a client component.

Create `src/components/service-actions.tsx`:
```tsx
"use client";
export function ServiceActions({ serviceId, hasQueue }: { serviceId: string; hasQueue: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: serviceId, action }),
    });
    setLoading(null);
    // Trigger revalidation
    window.location.reload(); // or use router.refresh()
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {hasQueue && <button onClick={() => handleAction("pause")} disabled={loading === "pause"}>Pause</button>}
      <button onClick={() => handleAction("refresh")} disabled={loading === "refresh"}>Refresh</button>
      {(serviceId === "radarr" || serviceId === "sonarr") && (
        <button onClick={() => handleAction("search")} disabled={loading === "search"}>Search</button>
      )}
    </div>
  );
}
```

### Phase 3: Add Auto-Refresh

**Option A:** Next.js `revalidate` — Add `export const revalidate = 30;` to the page. This re-renders the page every 30 seconds server-side.

**Option B:** Client-side polling — Create a client component that fetches API routes every 30 seconds and updates state.

**Recommendation:** Option A is simpler and works with the current server component architecture. Add `export const revalidate = 30;` to `src/app/page.tsx`.

### Phase 4: Add Jellyfin System Info

**New env vars:**
```
JELLYFIN_URL=https://jellyfin.opsec.rent
JELLYFIN_API_KEY=your-token
```

**New API route:** `src/app/api/jellyfin/route.ts`
- `GET /api/jellyfin/system` → calls Jellyfin `/System/Info` for host OS, CPU, RAM info
- `GET /api/jellyfin/sessions` → active streams
- `GET /api/jellyfin/library` → item counts

**Dashboard integration:** Add a "Host System" card showing:
- OS name and version (from Jellyfin, not Alpine)
- CPU architecture
- Server uptime
- Active streams (if any)

### Phase 5: Fix Jellyseerr Activity

Check the Jellyseerr activity endpoint. The current code calls `/api/v1/request` but may need `/api/v1/activity` or similar.

### Phase 6: Clean Up UI

- Show disk mount breakdown on hover/click
- Fix top bar disk stat to use deduplicated calculation
- Show "No disk data" for services without disk API (Prowlarr, Bazarr, Jellyseerr)
- Add loading states for action buttons

## Execution Order

1. **Agent 1:** Fix disk space calculation (deduplicate mounts)
2. **Agent 2:** Wire up action buttons (client component)
3. **Agent 3:** Add auto-refresh (revalidate)
4. **Agent 4:** Add Jellyfin integration (new env vars, new API routes, new dashboard card)
5. **Agent 5:** Fix Jellyseerr activity + UI cleanup

## Success Criteria

1. Disk space shows correct values (~200 GB used, not 1.5 TB)
2. Refresh button triggers a library refresh via API
3. Search button triggers a missing items search via API
4. Dashboard auto-refreshes every 30 seconds
5. Host system info shows real OS (not "alpine")
6. All 5 service cards show accurate data
7. Docker build succeeds
8. No console errors
