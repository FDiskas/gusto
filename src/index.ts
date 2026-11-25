import { serve } from 'bun';
import index from './index.html';

/** Files in `public/` are served at the site root, like the production build copies them to `dist/` */
const publicFileRoutes = Object.fromEntries(
  [...new Bun.Glob('*').scanSync('public')].map((fileName) => [
    `/${fileName}`,
    () => new Response(Bun.file(`public/${fileName}`)),
  ])
);

const server = serve({
  routes: {
    ...publicFileRoutes,
    // Serve index.html for all unmatched routes.
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
