import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bazimazi.spy',
  appName: 'Spy',
  webDir: 'dist',
  backgroundColor: '#4C3A51',
  plugins: {
    SystemBars: {
      // index.html uses viewport-fit=cover; the CSS pads with env(safe-area-inset-*).
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
}

export default config
