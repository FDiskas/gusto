---
name: pwa-setup
description: How the PWA (manifest, service worker, icons) is wired with the Bun bundler
keywords: [pwa, manifest, service worker, sw.js, public, icons, build.ts, bun html]
updated: 2026-11-26
---

### Rule / Fact
- Static PWA files live in `public/` (`manifest.webmanifest`, `sw.js`, PNG icons). `build.ts` copies them to `dist/` root and injects the manifest and apple-touch-icon `<link>` tags into `dist/index.html`.
- `src/frontend.tsx` registers `/sw.js` only when `process.env.NODE_ENV === 'production'`.
- `sw.js` is network-first for same-origin GET, with cache fallback offline.

### Why
- Bun's HTML bundler fails with `Could not resolve` on root-absolute URLs (`/manifest.webmanifest`) in `src/index.html`. Relative URLs get hashed, which breaks the fixed names the manifest and service worker need.
- Dev server (`bun --hot`) has no manifest or service worker. Test the PWA with `bun run build` and a static server.

### How to apply
- Change `sw.js`: bump `CACHE_NAME`.
- New icon or static file: put it in `public/` and reference it with an absolute path.
