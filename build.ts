import tailwind from 'bun-plugin-tailwind';
import { rm } from 'node:fs/promises';
import path from 'node:path';

const outdir = path.join(process.cwd(), 'dist');
await rm(outdir, { recursive: true, force: true });

const entrypoints = [...new Bun.Glob('src/**/*.html').scanSync()];

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [tailwind],
  minify: true,
  target: 'browser',
  sourcemap: 'none',
  env: 'BUN_PUBLIC_*',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

for (const output of result.outputs) {
  console.log(` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`);
}

/** Bun cannot resolve root-absolute URLs in HTML, so the PWA links are added after bundling. */
const PWA_HEAD_TAGS = `<link rel="manifest" href="/manifest.webmanifest" /><link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

for await (const publicFile of new Bun.Glob('**/*').scan('public')) {
  await Bun.write(path.join(outdir, publicFile), Bun.file(path.join('public', publicFile)));
}

const indexPath = path.join(outdir, 'index.html');
const indexHtml = await Bun.file(indexPath).text();
await Bun.write(indexPath, indexHtml.replace('</head>', `${PWA_HEAD_TAGS}</head>`));
