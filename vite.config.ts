import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    /* The OS-style portfolio is retired to meetluka.com/os/. The domain root is
       now served by the static site in `site/`, which the Pages workflow copies
       over the top of this build. */
    base: '/os/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      mdx({
        jsxImportSource: 'react',
        // GFM = tables, strikethrough, task lists. Frontmatter (YAML --- block) is
        // exposed as a named `frontmatter` export per .mdx file via remark-mdx-frontmatter.
        remarkPlugins: [
          remarkGfm,
          [remarkFrontmatter, ['yaml']],
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
      }),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: false, // we already ship /public/manifest.json
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
      isAnalyze &&
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // built into a subdirectory so `site/` can own the artifact root
      outDir: 'dist/os',
      emptyOutDir: true,
      chunkSizeWarningLimit: 200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            'react-router': ['react-router'],
          },
        },
      },
    },
  };
});
