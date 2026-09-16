// `vitest/config` re-exports `defineConfig` with the `test` block typed, so the
// whole config is checked. The previous `as never` cast silenced Vite's type for
// that one key and, as a side effect, stopped typechecking everything else.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { fileURLToPath } from 'node:url';
import { searchIndexPlugin } from './scripts/search-index-plugin';

const prettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark-dimmed' },
  keepBackground: false,
  defaultLang: 'text',
};

export default defineConfig({
  base: './',
  plugins: [
    { enforce: 'pre' as const, ...mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }],
        [rehypePrettyCode, prettyCodeOptions],
      ],
    }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    searchIndexPlugin(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Honour PORT so tooling that assigns a free port is respected.
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    target: 'es2022',
    // Mermaid lands in its own ~3.1 MB chunk purely from the dynamic import in
    // Mermaid.tsx, so it exceeds any sane limit while never being on the critical
    // path. The budget that actually matters is enforced in CI against the chunks
    // index.html modulepreloads — see scripts/check-bundle-budget.mjs.
    chunkSizeWarningLimit: 3400,
    rollupOptions: {
      output: {
        // Do NOT name a chunk for a dynamic-only library. Naming `mermaid` here
        // made Rollup merge the shared vendor chunk into that bucket, and because
        // the shared chunk is statically reachable from the entry, all 3.1 MB of
        // mermaid became a static import of the entry and was modulepreloaded on
        // every page — including the home page, which has no diagrams.
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
