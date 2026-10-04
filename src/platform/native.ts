import { useEffect, useRef } from 'react'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { App } from '@capacitor/app'

/** True inside the Capacitor Android/iOS shell; false for the website and installed PWA. */
export const isNative = Capacitor.isNativePlatform()

/** Newest last: an open dialog registers after its screen, so it handles back first. */
const backHandlers: Array<() => void> = []

export function initNativeShell() {
  if (!isNative) return
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {})
  // Registering a listener replaces the WebView's default back behavior, which would
  // close the app mid-round. With no screen handler (home), back leaves the app.
  void App.addListener('backButton', () => {
    const handler = backHandlers.at(-1)
    if (handler) handler()
    else void App.exitApp()
  })
}

/** Handles the Android back button/gesture. Has no effect on the web or iOS. */
export function useBackButton(handler: () => void, enabled = true) {
  const latest = useRef(handler)
  useEffect(() => { latest.current = handler })
  useEffect(() => {
    if (!enabled) return
    // A stable entry keeps stack order when the handler changes between renders.
    const entry = () => latest.current()
    backHandlers.push(entry)
    return () => { backHandlers.splice(backHandlers.lastIndexOf(entry), 1) }
  }, [enabled])
}
