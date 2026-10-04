import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A waiting worker never reloads the page mid-round; updates apply on the next launch.
      registerType: 'prompt',
      injectRegister: false,
      // Icons and head links are generated from public/favicon.svg (pwa-assets.config.ts).
      pwaAssets: { config: true, overrideManifestIcons: true, injectThemeColor: false },
      manifest: {
        id: '/',
        name: 'جاسوس - Spy',
        short_name: 'جاسوس',
        description: 'بازی گروهی جاسوس؛ گوشی را دست‌به‌دست کنید و جاسوس را پیدا کنید.',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#4C3A51',
        background_color: '#4C3A51',
        categories: ['games', 'entertainment'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
