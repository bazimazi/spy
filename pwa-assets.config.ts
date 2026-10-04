import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const background = '#4C3A51'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // The round badge fills the maskable safe zone (the central 80% circle).
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0.15, resizeOptions: { background } },
  },
  images: ['public/favicon.svg'],
})
