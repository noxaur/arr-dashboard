# Cross-Origin Iframe Authentication & Embedding

## Purpose

Embed HTTPS web applications that require login into a parent web app via `<iframe>`, maintaining
auth state across multi-page navigation and handling browser popup dialogs. Designed for the
*arr ecosystem dashboard embedding SonarQube, Jellyfin, or other self-hosted services.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ Parent App (https://dashboard.example.com)          │
│  Next.js + React                                    │
│  ┌───────────────────────────────────────────────┐  │
│  │ <iframe> (https://sonar.example.com)          │  │
│  │  ┌───────────────────────────────────────┐   │  │
│  │  │ SonarQube App (multi-page, has auth)  │   │  │
│  │  │ - Login page                           │   │  │
│  │  │ - Dashboard (after login)              │   │  │
│  │  │ - Project pages                        │   │  │
│  │  │ - native alert() on login failure      │   │  │
│  │  └───────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Challenges

| Challenge | Root Cause | Solution |
|-----------|-----------|----------|
| Embedding refused | Target app sets `X-Frame-Options: SAMEORIGIN` | Reverse proxy strips header, adds `frame-ancestors` CSP |
| Auth cookies not sent | Third-party cookie blocking, missing `SameSite=None` | Set `SameSite=None; Secure` on session cookies |
| Login popup/alert | Cross-origin iframe blocks `window.alert()` | `sandbox="allow-modals"` + override with styled overlay |
| Session lost on navigation | CSRF tokens stale after back/forward | `postMessage` token bridge |
| Native performance | Heavy SPA loading inside iframe | Lazy loading, preconnect, aggressive caching |
| Safari/Firefox blocking | Intelligent Tracking Prevention | Storage Access API fallback + click-to-enable overlay |

---

## 2. Security Headers

### 2.1. Target App (via Reverse Proxy)

The embedded app **must** serve these headers. If the app hardcodes `X-Frame-Options`
(like SonarQube), strip it via reverse proxy (NGINX, Caddy, Apache).

```nginx
# nginx.conf snippet
server {
    listen 443 ssl;
    server_name sonar.example.com;

    # Strip the app's hardcoded X-Frame-Options
    proxy_hide_header X-Frame-Options;

    # Add modern framing policy
    add_header Content-Security-Policy "frame-ancestors https://dashboard.example.com;";

    # Cookie rewrite for cross-origin
    # CAUTION: proxy_cookie_path assumes 'Path' is the last attribute in the upstream
    # Set-Cookie header. If SonarQube adds attributes after Path, this hack silently
    # produces malformed cookies. For production, use proxy_cookie_flags (NGINX Plus/R3)
    # or a Lua/OpenResty-based cookie transformer.
    proxy_cookie_path / "/; Secure; SameSite=None; Partitioned";

    # Delegate permissions to the embedding page
    add_header Permissions-Policy "storage-access=(self \"https://dashboard.example.com\"), identity-credentials-get=(self \"https://dashboard.example.com\")";

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2.2. Parent App Headers

The parent dashboard must also permit being framed by itself (default behavior) and must
delegate capabilities to the iframe.

```nginx
# On dashboard.example.com
add_header Content-Security-Policy "frame-src https://sonar.example.com https://jellyfin.example.com;";
```

---

## 3. Cookie Configuration

### 3.1. SameSite=None + Secure

Every session/auth cookie from the embedded app **must** have these attributes:

```http
Set-Cookie: sonar_session=abc123; Path=/; Secure; HttpOnly; SameSite=None
```

`SameSite=None` tells the browser "I am intentionally cross-origin". `Secure` is
mandatory when `SameSite=None`. `HttpOnly` prevents XSS token theft.

### 3.2. CHIPS (Partitioned Cookies) — Optional Isolation

For apps that don't need cross-site state sharing (i.e., the iframe session is
independent from the top-level session), add `Partitioned`:

```http
Set-Cookie: sonar_session=abc123; Path=/; Secure; HttpOnly; SameSite=None; Partitioned
```

This creates a separate cookie jar per top-level site. The iframe session for
`sonar.example.com` inside `dashboard.example.com` is isolated from a direct
`sonar.example.com` tab session.

**Trade-off:** Partitioned cookies work without user interaction in most browsers,
but the session inside the iframe won't carry over if the user opens the same app
in a new tab.

### 3.3. Configuring SonarQube (sonar.properties)

SonarQube doesn't natively expose cookie attributes. Use the reverse proxy to
rewrite `Set-Cookie` headers:

```nginx
proxy_cookie_path / "/; Secure; SameSite=None";
```

---

## 4. Parent Page Implementation (Next.js)

### 4.1. Iframe Component with Timeout & Safari Support

```tsx
// src/components/EmbeddedApp.tsx
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface EmbeddedAppProps {
  src: string;
  title: string;
  allowedFeatures?: string;
  sandbox?: string;
}

const ALLOWED_ORIGINS = [
  'https://sonar.example.com',
  'https://jellyfin.example.com',
  'https://radarr.example.com',
];

const LOAD_TIMEOUT_MS = 30000;

type IframeState = 'initial' | 'loading' | 'active' | 'navigating' | 'error';

export function EmbeddedApp({
  src,
  title,
  allowedFeatures = 'storage-access identity-credentials-get',
  sandbox = 'allow-scripts allow-same-origin allow-forms allow-modals allow-storage-access-by-user-activation',
}: EmbeddedAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<IframeState>('loading');
  const [needsSafariClick, setNeedsSafariClick] = useState(false);

  const startLoadTimer = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setState('error');
    }, LOAD_TIMEOUT_MS);
  }, []);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const attemptStorageAccess = useCallback(async () => {
    // Safari/ITP: try to request unpartitioned storage for the iframe's origin.
    // NOTE: requestStorageAccess() must be called from within the iframe document,
    // not the parent. This is achieved via the injected Storage Access bootstrap
    // script in the reverse proxy config (section 9). The parent should detect
    // Safari and show a click-to-enable overlay.
    try {
      await document.requestStorageAccess();
    } catch {
      setNeedsSafariClick(true);
    }
  }, []);

  const handleSafariRetry = useCallback(async () => {
    try {
      await document.requestStorageAccess();
      setNeedsSafariClick(false);
      if (iframeRef.current) {
        iframeRef.current.src = src;
      }
    } catch {
      // Still denied, keep showing overlay
    }
  }, [src]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;

      if (typeof event.data !== 'object' || event.data === null) return;

      switch (event.data.type) {
        case 'auth-success':
        case 'navigation-complete':
          clearLoadTimer();
          setState('active');
          break;
        case 'navigating':
          setState('navigating');
          break;
        case 'iframe-ready':
          // Iframe signals it has loaded and injected scripts are running
          attemptStorageAccess();
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [clearLoadTimer, attemptStorageAccess]);

  const handleLoad = useCallback(() => {
    clearLoadTimer();
    setState('active');
  }, [clearLoadTimer]);

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface rounded-lg border border-border">
        <p className="text-muted mb-4">
          {title} could not be loaded in this browser.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Open {title} in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {state !== 'active' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            {state === 'navigating' && (
              <span className="text-sm text-muted">Navigating...</span>
            )}
          </div>
        </div>
      )}

      {needsSafariClick && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-20">
          <div className="text-center space-y-4 p-8">
            <p className="text-muted">
              Click to enable embedded view of {title}
            </p>
            <button
              onClick={handleSafariRetry}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90"
            >
              Enable Embedded View
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        allow={allowedFeatures}
        sandbox={sandbox}
        loading="lazy"
        className="w-full h-full border-0"
        onLoad={handleLoad}
      />
    </div>
  );
}
```

### 4.2. Using the Component

```tsx
// Usage in a dashboard page
import { EmbeddedApp } from '@/components/EmbeddedApp';

export default function SonarPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <EmbeddedApp
        src="https://sonar.example.com/dashboard"
        title="SonarQube"
      />
    </div>
  );
}
```

**IMPORTANT:** `allow-modals` is a sandbox token, not a Permissions Policy feature.
It belongs in the `sandbox` attribute, not `allow`. The component above includes it
in the default `sandbox` string.

---

## 5. Handling the Login Popup (alert/dialog)

### Problem

SonarQube (and many legacy apps) use `window.alert()` to show login error messages.
In a cross-origin iframe, browsers silently block `window.alert()` calls unless you:

1. Set `sandbox="allow-modals"` on the iframe
2. Override `window.alert` via injected script (requires same-origin via proxy)

### 5.1. Solution A: allow-modals on Iframe

Simplest fix — just add `allow-modals` to the iframe `sandbox`:

```html
<iframe
  src="https://sonar.example.com"
  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-storage-access-by-user-activation"
  allow="storage-access identity-credentials-get"
>
</iframe>
```

**Caveat:** `sandbox` with `allow-same-origin` treats the iframe as same-origin with
its own server, which is what you want. But `allow-scripts` without `allow-popups`
will block `window.open()` calls.

### 5.2. Solution B: Override alert() via Proxy Injection

For a polished UX, inject a script via the reverse proxy that replaces `window.alert`
with a styled overlay. Uses `textContent` to avoid XSS from unsanitized alert messages:

```javascript
// Injected via proxy (served as same-origin to the embedded app)
(function() {
  window.alert = function(message) {
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:rgba(0,0,0,0.5);display:flex;',
      'align-items:center;justify-content:center;z-index:99999'
    ].join('');
    var box = document.createElement('div');
    box.style.cssText = [
      'background:#fff;padding:24px;border-radius:8px;',
      'max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,0.2);',
      'font-family:system-ui,sans-serif'
    ].join('');
    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 16px;color:#333;font-size:14px;line-height:1.5';
    p.textContent = message; // SAFE: textContent, not innerHTML
    box.appendChild(p);
    var btn = document.createElement('button');
    btn.style.cssText = [
      'padding:8px 16px;background:#4caf50;color:#fff;',
      'border:none;border-radius:4px;cursor:pointer'
    ].join('');
    btn.textContent = 'OK';
    btn.onclick = function() { overlay.remove(); };
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    window.parent.postMessage(
      { type: 'alert-shown', message: String(message) },
      'https://dashboard.example.com'
    );
  };
})();
```

Inject this via NGINX `sub_filter`. **Important:** sub_filter does not work on
compressed responses — you must disable gzip before the filter runs:

```nginx
# Disable compression so sub_filter can find/replace
proxy_set_header Accept-Encoding "";
sub_filter '</head>' '<script>/* alert override script */</script></head>';
sub_filter_once on;
sub_filter_types text/html;
```

---

## 6. Multi-Page Navigation & Session Continuity

### 6.1. The Problem

When the iframe navigates between pages (login → dashboard → project view):

1. CSRF tokens refresh — back/forward can cause 403 errors
2. Loading state resets — the parent needs to know
3. Browser back/forward inside iframe is invisible to the parent

### 6.2. postMessage Token Bridge with Cleanup

The embedded app must notify the parent on navigation. Inject via proxy:

```javascript
// Injected via reverse proxy
(function() {
  var ALLOWED_PARENT = 'https://dashboard.example.com';
  var lastHref = location.href;
  var navObserver, readyObserver;

  function cleanup() {
    if (navObserver) navObserver.disconnect();
    if (readyObserver) readyObserver.disconnect();
  }

  // Notify parent on navigation (URL changes)
  navObserver = new MutationObserver(function() {
    if (location.href !== lastHref) {
      lastHref = location.href;
      window.parent.postMessage(
        { type: 'navigating', url: location.href },
        ALLOWED_PARENT
      );
    }
  });
  navObserver.observe(document, { subtree: true, childList: true });

  // popstate — only notify if URL actually changed
  window.addEventListener('popstate', function() {
    if (location.href !== lastHref) {
      lastHref = location.href;
      window.parent.postMessage(
        { type: 'navigating', url: location.href, trigger: 'popstate' },
        ALLOWED_PARENT
      );
    }
  });

  // Notify parent when DOM is ready after navigation
  function onReady() {
    if (document.readyState === 'complete') {
      cleanup();
      window.parent.postMessage(
        { type: 'navigation-complete', url: location.href },
        ALLOWED_PARENT
      );
    }
  }
  readyObserver = new MutationObserver(onReady);
  readyObserver.observe(document, { subtree: true, childList: true });
  onReady();

  // Notify parent that injected scripts are alive
  window.parent.postMessage(
    { type: 'iframe-ready' },
    ALLOWED_PARENT
  );

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
})();
```

### 6.3. Syncing CSRF Tokens

```javascript
// In the embedded app (injected via proxy)
(function() {
  var ALLOWED_PARENT = 'https://dashboard.example.com';
  var csrfObserver;

  function getCsrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  }

  function syncCsrf() {
    var token = getCsrfToken();
    if (token) {
      window.parent.postMessage(
        { type: 'csrf-token', token: token },
        ALLOWED_PARENT
      );
    }
  }

  csrfObserver = new MutationObserver(syncCsrf);
  csrfObserver.observe(document, { subtree: true, childList: true });
  syncCsrf();

  window.addEventListener('beforeunload', function() {
    if (csrfObserver) csrfObserver.disconnect();
  });
})();
```

---

## 7. Browser Compatibility Matrix

| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| `SameSite=None; Secure` | ✅ Full support | ✅ Supported | ✅ Supported |
| CHIPS (`Partitioned`) | ✅ v114+ | ✅ v17+ | 🔄 In dev |
| Storage Access API | ✅ | ✅ (per-page model) | ✅ (per-page model) |
| FedCM | ✅ v128+ | 🔄 Experimental | 🔄 In dev |
| CSP `frame-ancestors` | ✅ | ✅ | ✅ |
| `X-Frame-Options` stripping via proxy | ✅ | ✅ | ✅ |
| `postMessage` cross-origin | ✅ | ✅ | ✅ |
| `alert()` in iframe with `allow-modals` | ✅ | ✅ | ✅ |
| `alert()` in iframe without `allow-modals` | ❌ Blocked | ❌ Blocked | ❌ Blocked |

### Per-Browser Strategy

| Browser | Strategy |
|---------|----------|
| **Chrome/Edge** | `SameSite=None; Secure` + proxy header rewrite. Works with no user interaction. |
| **Safari** | Must call `document.requestStorageAccess()` after user gesture. The component above shows a "Click to enable embedded view" overlay when access is denied. |
| **Firefox** | Strict third-party cookie blocking by default. Use Storage Access API + fallback "Open in new tab" link (shown after timeout). |
| **Brave/Vivaldi** | Same as Chrome. Brave's Shields may need per-site disabling. |

---

## 8. Performance Optimization

### 8.1. Preconnect to Embedded Origin

```html
<!-- In parent app <head> -->
<link rel="preconnect" href="https://sonar.example.com">
<link rel="dns-prefetch" href="https://sonar.example.com">
```

### 8.2. Lazy Loading

```html
<iframe loading="lazy" ...>
```

### 8.3. Iframe Sizing for SPAs

Set explicit height to prevent layout shifts:

```tsx
<iframe
  style={{ height: 'calc(100vh - 4rem)', width: '100%' }}
  ...
/>
```

### 8.4. Cache Static Assets

On the reverse proxy:

```nginx
location ~* \.(js|css|png|jpg|woff2)$ {
    proxy_pass http://localhost:9000;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 8.5. Avoid Double Login on Refresh

Store auth state in `sessionStorage` (same-origin in iframe) or use a
`postMessage`-based bridge where the parent sends existing credentials
to the iframe on load.

---

## 9. SonarQube-Specific Configuration

SonarQube is the hardest case because it:

1. Hardcodes `X-Frame-Options: SAMEORIGIN`
2. Uses `window.alert()` on login failure
3. Has CSRF tokens that refresh on navigation
4. Uses session cookies without `SameSite` override

### Required Changes

| Layer | Change | Location |
|-------|--------|----------|
| **Reverse proxy** | Strip `X-Frame-Options`, add `frame-ancestors` | NGINX/Apache config |
| **Reverse proxy** | Rewrite `Set-Cookie` to add `SameSite=None; Secure` | NGINX/Apache config |
| **Reverse proxy** | Disable gzip compression for sub_filter to work | `proxy_set_header Accept-Encoding "";` |
| **Reverse proxy** | Inject alert override + navigation bridge + SAA bootstrap scripts | NGINX `sub_filter` |
| **Parent app** | Set `sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-storage-access-by-user-activation"` on iframe | Next.js component |
| **Parent app** | Show click-to-enable overlay for Safari | Client-side JS |
| **Parent app** | Handle `postMessage` for navigation state + timeout | Client-side JS |

### Storage Access API Bootstrap (injected into iframe)

The SAA call must be made from **inside** the iframe document (not the parent), because
it's the iframe's origin that needs unpartitioned cookie access. Inject this into every page:

```javascript
// Injected via reverse proxy — runs inside the iframe
(function() {
  var ALLOWED_PARENT = 'https://dashboard.example.com';

  async function bootstrapStorageAccess() {
    try {
      await document.requestStorageAccess();
      window.parent.postMessage(
        { type: 'storage-access-granted' },
        ALLOWED_PARENT
      );
    } catch {
      // Storage access denied; parent will show click-to-enable overlay
    }
  }

  bootstrapStorageAccess();
})();
```

### Full NGINX Config for SonarQube

```nginx
server {
    listen 443 ssl;
    server_name sonar.example.com;

    ssl_certificate /etc/ssl/certs/example.pem;
    ssl_certificate_key /etc/ssl/private/example.key;

    # Strip app's restrictive framing header ONLY
    # Do NOT strip X-Content-Type-Options — nosniff is a security best practice
    proxy_hide_header X-Frame-Options;

    # Add secure framing policy
    add_header Content-Security-Policy "frame-ancestors https://dashboard.example.com;";
    add_header Permissions-Policy "storage-access=(self \"https://dashboard.example.com\"), identity-credentials-get=(self \"https://dashboard.example.com\")";

    # Rewrite cookies for cross-origin
    # CAUTION: This assumes 'Path' is the last attribute in SonarQube's Set-Cookie.
    # If SonarQube adds attributes after Path, this will produce malformed cookies.
    # Test this thoroughly. For a robust solution, use proxy_cookie_flags (NGINX Plus)
    # or an OpenResty Lua script that does proper header parsing.
    proxy_cookie_path / "/; Secure; SameSite=None";

    # sub_filter requires uncompressed HTML
    proxy_set_header Accept-Encoding "";

    # Inject all required scripts
    sub_filter '</head>' '<script>
(function(){
  var ALLOWED_PARENT="https://dashboard.example.com";
  var lastHref=location.href,navObserver,readyObserver,csrfObserver;

  // ===== Storage Access Bootstrap =====
  (async function(){
    try{
      await document.requestStorageAccess();
      window.parent.postMessage({type:"storage-access-granted"},ALLOWED_PARENT);
    }catch(e){}
  })();

  // ===== alert() Override (textContent-safe) =====
  window.alert=function(m){
    var o=document.createElement("div");
    o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999";
    var b=document.createElement("div");
    b.style.cssText="background:#fff;padding:24px;border-radius:8px;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,0.2);font-family:system-ui,sans-serif";
    var p=document.createElement("p");
    p.style.cssText="margin:0 0 16px;color:#333;font-size:14px;line-height:1.5";
    p.textContent=String(m);
    b.appendChild(p);
    var btn=document.createElement("button");
    btn.style.cssText="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer";
    btn.textContent="OK";
    btn.onclick=function(){o.remove()};
    b.appendChild(btn);
    o.appendChild(b);
    document.body.appendChild(o);
    window.parent.postMessage({type:"alert-shown",message:String(m)},ALLOWED_PARENT);
  };

  // ===== Navigation Observer =====
  navObserver=new MutationObserver(function(){
    if(location.href!==lastHref){
      lastHref=location.href;
      window.parent.postMessage({type:"navigating",url:location.href},ALLOWED_PARENT);
    }
  });
  navObserver.observe(document,{subtree:true,childList:true});

  window.addEventListener("popstate",function(){
    if(location.href!==lastHref){
      lastHref=location.href;
      window.parent.postMessage({type:"navigating",url:location.href,trigger:"popstate"},ALLOWED_PARENT);
    }
  });

  // ===== DOM Ready Notification =====
  function onReady(){
    if(document.readyState==="complete"){
      if(navObserver)navObserver.disconnect();
      if(readyObserver)readyObserver.disconnect();
      window.parent.postMessage({type:"navigation-complete",url:location.href},ALLOWED_PARENT);
    }
  }
  readyObserver=new MutationObserver(onReady);
  readyObserver.observe(document,{subtree:true,childList:true});
  onReady();

  // ===== CSRF Token Sync =====
  function syncCsrf(){
    var meta=document.querySelector("meta[name=csrf-token]");
    if(meta){
      window.parent.postMessage({type:"csrf-token",token:meta.getAttribute("content")},ALLOWED_PARENT);
    }
  }
  csrfObserver=new MutationObserver(syncCsrf);
  csrfObserver.observe(document,{subtree:true,childList:true});
  syncCsrf();

  // ===== Signal Ready =====
  window.parent.postMessage({type:"iframe-ready"},ALLOWED_PARENT);

  // ===== Cleanup =====
  window.addEventListener("beforeunload",function(){
    if(navObserver)navObserver.disconnect();
    if(readyObserver)readyObserver.disconnect();
    if(csrfObserver)csrfObserver.disconnect();
  });
})();
</script></head>';
    sub_filter_once on;
    sub_filter_types text/html;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|gif|woff2)$ {
        proxy_pass http://localhost:9000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 10. Parent Component State Machine

```
                    ┌──────────┐
                    │  LOADING │◄──── postMessage 'navigating'
                    └────┬─────┘
                         │
                    iframe onLoad
                    OR postMessage 'navigation-complete'
                         │
                    ┌────▼─────┐
                    │  ACTIVE  │────────► postMessage 'navigating'
                    └────┬─────┘
                         │
                    ┌────▼──────┐
                    │ NAVIGATING│◄──── postMessage 'navigation-complete'
                    └────┬──────┘
                         │
                    ┌────▼─────┐
                    │  ACTIVE  │
                    └──────────┘

  Error states:
    LOADING ──► ERROR (timeout after 30s)
    ACTIVE  ──► ERROR (if detected via heartbeat)
    ERROR   ──► shows "Open in new tab" fallback link

  Safari state:
    LOADING ──► needsSafariClick=true (Storage Access denied)
             ──► user clicks "Enable Embedded View"
             ──► LOADING again
```

---

## 11. Testing Checklist

### Functional Tests

- [ ] Iframe loads in Chrome with no console errors
- [ ] Iframe loads in Safari (click "Enable Embedded View" to grant storage access)
- [ ] Iframe loads in Firefox (or shows fallback link after 30s timeout)
- [ ] Login flow completes inside iframe
- [ ] alert() popups display as styled overlays (not native browser dialogs)
- [ ] Navigation between pages maintains auth
- [ ] Browser back/forward works inside iframe (no 403 CSRF errors)
- [ ] Session persists on iframe reload
- [ ] Session persists across parent page navigations (if same tab)
- [ ] Iframe fails gracefully after network timeout (shows fallback link)
- [ ] verify sub_filter worked: inspect response HTML in browser DevTools

### Security Tests

- [ ] `frame-ancestors` allows only the parent domain
- [ ] Clickjacking not possible (no wildcard `frame-ancestors`)
- [ ] `postMessage` origin filtering rejects unknown origins
- [ ] Cookies have `Secure; HttpOnly` flags
- [ ] `SameSite=None` only on cross-origin required cookies
- [ ] CSP violation reports monitored
- [ ] No `X-Content-Type-Options` removal (verify `nosniff` still present)
- [ ] Alert override uses `textContent` (not `innerHTML`) — no XSS vector

### Performance Tests

- [ ] Preconnect reduces time-to-interactive
- [ ] Lazy loading doesn't block initial page paint
- [ ] Static assets served with long cache times
- [ ] Iframe load doesn't block parent page LCP

---

## 12. Fallback Strategy

When embedding is not possible (old browser, strict privacy settings,
corporate firewall blocking, timeout):

The `EmbeddedApp` component above automatically transitions to error state
after 30 seconds if no `postMessage` signals arrive. It renders a fallback UI
with an "Open in new tab" link. You can also use this standalone component:

```tsx
export function EmbeddedAppFallback({ src, title }: { src: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-surface rounded-lg border border-border">
      <p className="text-muted mb-4">
        {title} could not be loaded in this browser.
      </p>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
      >
        Open {title} in new tab
      </a>
    </div>
  );
}
```

---

## 13. References

- [CSP frame-ancestors (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [Storage Access API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API)
- [Third-party cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies)
- [CHIPS explainer (Google)](https://github.com/explainers-by-googlers/CHIPS-spec)
- [FedCM (Chrome Developers)](https://developer.chrome.com/docs/privacy-sandbox/fedcm/)
- [postMessage security (GitHub Gist)](https://gist.github.com/juan-gunawan/bc5c6617e05ae6620fe9850eb4502db2)
- [X-Frame-Options (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [SonarQube iframe embedding (Community)](https://community.sonarsource.com/t/how-to-embed-sonarqube-page-in-html-iframe/10420)
- [SameSite cookies explained (web.dev)](https://web.dev/articles/samesite-cookies-explained)
