import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Pripomen_mi/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/Pripomen_mi/',
        name: 'Připomeň mi',
        short_name: 'Připomeň mi',
        description: 'Rychlé hlasové připomínky',
        theme_color: '#14213d',
        background_color: '#f7f3eb',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/Pripomen_mi/',
        scope: '/Pripomen_mi/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          {
            name: 'Nová hlasová připomínka',
            short_name: 'Mluvit',
            url: '/Pripomen_mi/voice',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
