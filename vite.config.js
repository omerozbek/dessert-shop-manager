import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// When deploying to GitHub Pages the site lives at /<repo-name>/.
// Set VITE_BASE env var to your repo name, e.g. VITE_BASE=dulci-pwa
// For local dev or a custom domain (apex), leave it unset → base stays '/'.
const base = process.env.VITE_BASE ? `/${process.env.VITE_BASE}/` : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dulci – Dessert Shop Manager',
        short_name: 'Dulci',
        description: 'Manage dessert recipes, ingredients, and orders — works offline',
        theme_color: '#f97316',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
        categories: ['business', 'food'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
