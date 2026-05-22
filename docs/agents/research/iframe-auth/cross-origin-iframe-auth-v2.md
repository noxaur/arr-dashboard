# SonarQube & Multi-Page Iframe Embedding: Deep-Dive Research

## Executive Summary

Embedding SonarQube within cross-origin iframes presents significant security and architectural
challenges. SonarQube blocks framing by default via `X-Frame-Options: SAMEORIGIN` and uses
`window.alert()` for login errors. Multi-page navigation within iframes requires careful CSRF token
management. This document covers the advanced topics: login popup handling, session continuity
across navigation, and browser-specific workarounds.

---

## 1. SonarQube's Native Embedding Controls

SonarQube hardcodes `X-Frame-Options: SAMEORIGIN`. Community confirms modifying this requires
server-side intervention — a reverse proxy to strip the header. SonarQube does not natively emit
the more flexible `frame-ancestors` directive.

### Session & CSRF Mechanics

SonarQube uses session cookies and CSRF tokens. It offers a JWT token (HS256 key, base64-encoded)
for session persistence across server restarts, but this is distinct from browser cookie sessions
required for iframe authentication.

## 2. Making Iframe Authentication Work

Three-step architectural adjustment:

1. **Header-rewrite proxy** (NGINX): strip `X-Frame-Options`, inject `frame-ancestors`
2. **Cookie `SameSite` adjustment**: ensure `SameSite=None; Secure` on auth cookies
3. **Storage Access API bootstrap**: call `document.requestStorageAccess()` before loading iframe

## 3. Session Continuity & Navigation

Maintaining session across pages is critical:

- **postMessage token bridge**: sync CSRF tokens between iframe and parent
- **Form submission resilience**: inject script via proxy to retrieve latest token on navigation
- **Navigation observer**: MutationObserver + popstate listener to notify parent of page changes

## 4. UI Dialogs & Alerts

### 4.1. Sandbox attribute

If using `sandbox`, must include `allow-modals` alongside `allow-scripts` and `allow-same-origin`.
Without this, `alert()` calls are silently blocked.

### 4.2. Override window.alert

Inject a script via reverse proxy that replaces `window.alert()` with a styled HTML/CSS overlay.
Notify parent via `postMessage` when an alert fires.

## 5. Performance Optimization

| Technique | Implementation |
|-----------|---------------|
| Lazy loading | `<iframe loading="lazy">` |
| Preconnect | `<link rel="preconnect" href="https://sonar.example.com">` |
| DNS prefetch | `<link rel="dns-prefetch" href="https://sonar.example.com">` |
| Static asset caching | `Cache-Control: public, immutable, max-age=2592000` on JS/CSS/fonts |
| Loading indicator | Show spinner until iframe fires `onLoad` |

## 6. Browser Compatibility

| Browser | SameSite=None | Storage Access API | Typical Outcome |
|---------|--------------|-------------------|-----------------|
| Chrome/Edge | ✅ | ✅ | Works with SameSite=None; Secure |
| Safari | ✅ | ✅ | Requires SAA; ITP blocks otherwise |
| Firefox | ✅ | Experimental | Often fails; needs fallback link |

## 7. Risks & Mitigations

- **Clickjacking**: removing `X-Frame-Options` removes clickjacking defense. Must add strict `frame-ancestors` whitelist.
- **Cookie partitioning**: CHIPS isolates iframe session from top-level tab session.

## References

- [SonarQube iframe embedding (Stack Overflow)](https://stackoverflow.com/questions/41804429/how-do-i-configure-x-frames-option-in-sonarqube)
- [SonarQube iframe embedding (Community)](https://community.sonarsource.com/t/how-to-embed-sonarqube-page-in-html-iframe/10420)
- [SonarQube JWT config](https://docs.sonarsource.com/sonarqube-server/server-installation/pre-installation/jwt-token)
