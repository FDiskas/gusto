---

name: landing-prerender
description: Landing page is prerendered to static HTML at build time for SEO, then hydrated; no SSR server
keywords: [seo, prerender, hydration, renderToString, landing, localStorage, build.ts]
updated: 2026-11-26
---

### Rule / Fact

- `build.ts` calls `renderSignedOutAppHtml()` (`src/prerender.tsx`) and writes the result into `<div id="root" data-prerendered>` in `dist/index.html`.
- `src/frontend.tsx` uses `hydrateRoot` only when the root has `data-prerendered` AND no Google session is stored in localStorage. Otherwise it uses `createRoot`.
- Only the landing page is public. The rest of the app stays a SPA behind login.

### Why

- Production is static nginx, so a real SSR server is not needed. One public page means one prerendered file.
- The prerendered HTML is the signed-out page. A returning user's first render would differ (`authLoading` starts true from localStorage), which would cause a hydration mismatch.
- The session localStorage read must stay. It restores the login. Do not move it into the prerender path.

### How to apply

- `BUN_PUBLIC_GOOGLE_CLIENT_ID` must be set at build time, so the prerendered HTML matches the client bundle. Without it, a stored client ID causes a hydration warning in dev-like setups.
- Dev server (`bun --hot`) does not prerender.
- Production domain is `https://gusto.coders.lt/`. It is hardcoded in `src/index.html` (`canonical`, `og:url`, `og:image`), `public/robots.txt` and `public/sitemap.xml`. Change all four places if the domain changes.
- The hero image is `public/landing-hero.jpg` (1000x600), also used as `og:image`. `src/index.ts` serves `public/` files in dev.

Related: [[pwa-setup]]
