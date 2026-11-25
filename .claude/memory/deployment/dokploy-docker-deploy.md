---
name: dokploy-docker-deploy
description: Dokploy deploy of gusto.coders.lt — container port, build-time env, source maps
keywords: [dokploy, docker, nginx, port 8080, build args, BUN_PUBLIC_GOOGLE_CLIENT_ID, sourcemap]
updated: 2026-11-26
---

### Rule / Fact
- Production runs from the `Dockerfile` (bun build, then `nginxinc/nginx-unprivileged`) behind Dokploy/Traefik at https://gusto.coders.lt.
- The container listens on **8080**. Dokploy domain Container Port must be `8080`.
- `BUN_PUBLIC_*` values are inlined at build time. The `Dockerfile` must declare `ARG` + `ENV` for each one.
- Production build has no source maps (`sourcemap: 'none'` in `build.ts`).

### Why
- Container Port `80` gave an unreachable site: nothing listens on 80 in nginx-unprivileged.
- A Dokploy Build-time Argument without a matching `ARG` is ignored. `process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID` then stays unreplaced in the bundle.
- Source maps expose `src/` in browser devtools.

### How to apply
- Add a new `BUN_PUBLIC_*` variable: add `ARG` and `ENV` in the `Dockerfile`, then set it as a Build-time Argument in Dokploy.
- Add the production URL to Google OAuth Authorized JavaScript origins.
