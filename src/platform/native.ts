import { useEffect, useRef } from 'react'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { App } from '@capacitor/app'

/** True inside the Capacitor Android/iOS shell; false for the website and installed PWA. */
export const isNative = Capacitor.isNativePlatform()

/** Newest last: an open dialog registers after its screen, so it handles back first. */
const backHandlers: Array<() => void> = []

const GUARD = 'spy-back-guard'
/** Whether the current history entry is the guard pushed while a back handler is registered. */
let guarded = false
/** A `history.back()` that drops the guard is in flight; its `popstate` is not a user's back. */
let unguarding = false
let syncQueued = false

function isGuardEntry(state: unknown) {
  return typeof state === 'object' && state !== null && (state as Record<string, unknown>)[GUARD] === true
}

/**
 * The web has no back button event, so while any screen handles back, an extra
 * same-page history entry sits on top. Back pops it (`popstate`) and runs the
 * newest handler instead of leaving; the entry returns while a handler remains.
 * On home nothing is registered, the entry is removed, and back leaves the page.
 */
function syncHistoryGuard() {
  if (unguarding) return
  const wanted = backHandlers.length > 0
  if (wanted && !guarded) {
    history.pushState({ ...(history.state as object | null), [GUARD]: true }, '')
    guarded = true
  } else if (!wanted && guarded) {
    unguarding = true
    guarded = false
    history.back()
  }
}

/** Handler changes come in cleanup/setup pairs within one commit; sync once they settle. */
function queueHistorySync() {
  if (isNative || syncQueued) return
  syncQueued = true
  queueMicrotask(() => {
    syncQueued = false
    syncHistoryGuard()
  })
}

function initWebHistory() {
  // A reload keeps the guard entry, but the app restarts on home without a handler.
  guarded = isGuardEntry(history.state)
  window.addEventListener('popstate', (event) => {
    guarded = isGuardEntry(event.state)
    if (unguarding) {
      unguarding = false
    } else if (!guarded) {
      backHandlers.at(-1)?.()
    }
    // Restore the guard after React commits whatever the handler changed.
    window.setTimeout(syncHistoryGuard)
  })
  queueHistorySync()
}

export function initNativeShell() {
  if (!isNative) {
    initWebHistory()
    return
  }
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {})
  // Registering a listener replaces the WebView's default back behavior, which would
  // close the app mid-round. With no screen handler (home), back leaves the app.
  void App.addListener('backButton', () => {
    const handler = backHandlers.at(-1)
    if (handler) handler()
    else void App.exitApp()
  })
}

/**
 * Handles back: the Android button/gesture in the native app, and browser or
 * system back on the web and installed PWA.
 */
export function useBackButton(handler: () => void, enabled = true) {
  const latest = useRef(handler)
  useEffect(() => { latest.current = handler })
  useEffect(() => {
    if (!enabled) return
    // A stable entry keeps stack order when the handler changes between renders.
    const entry = () => latest.current()
    backHandlers.push(entry)
    queueHistorySync()
    return () => {
      backHandlers.splice(backHandlers.lastIndexOf(entry), 1)
      queueHistorySync()
    }
  }, [enabled])
}
