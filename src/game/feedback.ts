import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from '../platform/native'

/**
 * Synthesized sound effects and haptics. Everything is generated with Web Audio,
 * so the game ships no audio files and works offline.
 *
 * Privacy rule: a role reveal must sound and feel identical for spies and
 * citizens, otherwise the table could hear who is the spy.
 */

export type Cue =
  | 'tap' | 'select' | 'flip' | 'deal' | 'beep' | 'go' | 'tick' | 'alarm'
  | 'drumroll' | 'stamp' | 'win' | 'lose' | 'ding' | 'error'

type Haptic = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'none'

const HAPTICS: Record<Cue, Haptic> = {
  tap: 'light',
  select: 'light',
  flip: 'medium',
  deal: 'light',
  beep: 'medium',
  go: 'heavy',
  tick: 'light',
  alarm: 'warning',
  drumroll: 'none',
  stamp: 'heavy',
  win: 'success',
  lose: 'error',
  ding: 'medium',
  error: 'error',
}

const settings = { sound: true, vibration: true }

export function setFeedbackPreferences(next: { sound: boolean; vibration: boolean }) {
  settings.sound = next.sound
  settings.vibration = next.vibration
}

let context: AudioContext | null = null
let master: GainNode | null = null

function audio(): AudioContext | null {
  try {
    if (!context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      context = new Ctor()
      master = context.createGain()
      master.gain.value = 0.5
      master.connect(context.destination)
    }
    if (context.state === 'suspended') void context.resume().catch(() => {})
    return context
  } catch {
    return null
  }
}

/** Browsers only start audio after a gesture; unlock on the first touch. */
export function unlockAudio() {
  if (settings.sound) audio()
}

function tone(ctx: AudioContext, {
  freq, to, start = 0, duration, type = 'sine', gain = 0.3, attack = 0.005,
}: { freq: number; to?: number; start?: number; duration: number; type?: OscillatorType; gain?: number; attack?: number }) {
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + duration)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(amp).connect(master!)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

let noiseBuffer: AudioBuffer | null = null

function noise(ctx: AudioContext, {
  start = 0, duration, gain = 0.25, from = 800, to = 3000, q = 0.8, tremolo = 0,
}: { start?: number; duration: number; gain?: number; from?: number; to?: number; q?: number; tremolo?: number }) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const t = ctx.currentTime + start
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + duration)
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.04, duration / 3))
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  let chain: AudioNode = src.connect(filter).connect(amp)
  if (tremolo) {
    const trem = ctx.createGain()
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = tremolo
    depth.gain.value = 0.5
    trem.gain.value = 0.5
    lfo.connect(depth).connect(trem.gain)
    lfo.start(t)
    lfo.stop(t + duration)
    chain = chain.connect(trem)
  }
  chain.connect(master!)
  src.start(t)
  src.stop(t + duration + 0.05)
}

const SOUNDS: Record<Cue, (ctx: AudioContext) => void> = {
  tap: (ctx) => tone(ctx, { freq: 520, to: 380, duration: 0.06, type: 'triangle', gain: 0.18 }),
  select: (ctx) => tone(ctx, { freq: 660, to: 880, duration: 0.08, type: 'triangle', gain: 0.2 }),
  flip: (ctx) => {
    noise(ctx, { duration: 0.16, from: 600, to: 4000, gain: 0.22 })
    tone(ctx, { freq: 300, to: 620, start: 0.05, duration: 0.14, type: 'triangle', gain: 0.14 })
  },
  deal: (ctx) => noise(ctx, { duration: 0.3, from: 3500, to: 500, gain: 0.2, q: 0.6 }),
  beep: (ctx) => tone(ctx, { freq: 587, duration: 0.18, type: 'square', gain: 0.1 }),
  go: (ctx) => {
    tone(ctx, { freq: 880, duration: 0.42, type: 'square', gain: 0.1 })
    tone(ctx, { freq: 1320, start: 0.02, duration: 0.4, type: 'triangle', gain: 0.12 })
  },
  tick: (ctx) => tone(ctx, { freq: 1500, to: 900, duration: 0.035, type: 'square', gain: 0.07 }),
  alarm: (ctx) => {
    for (let i = 0; i < 6; i++) tone(ctx, { freq: i % 2 ? 784 : 988, start: i * 0.16, duration: 0.14, type: 'square', gain: 0.09 })
  },
  drumroll: (ctx) => noise(ctx, { duration: 1.3, from: 180, to: 420, gain: 0.35, q: 1.2, tremolo: 22 }),
  stamp: (ctx) => {
    tone(ctx, { freq: 140, to: 45, duration: 0.3, type: 'sine', gain: 0.6 })
    noise(ctx, { duration: 0.12, from: 1200, to: 300, gain: 0.3 })
  },
  win: (ctx) => {
    ;[523, 659, 784, 1047].forEach((freq, i) => tone(ctx, { freq, start: i * 0.11, duration: 0.32, type: 'triangle', gain: 0.2 }))
    tone(ctx, { freq: 1568, start: 0.44, duration: 0.6, type: 'sine', gain: 0.12 })
  },
  lose: (ctx) => {
    ;[392, 370, 349, 262].forEach((freq, i) => tone(ctx, { freq, start: i * 0.18, duration: i === 3 ? 0.7 : 0.2, type: 'sawtooth', gain: 0.07 }))
  },
  ding: (ctx) => {
    tone(ctx, { freq: 1046, duration: 0.5, type: 'sine', gain: 0.22 })
    tone(ctx, { freq: 1568, start: 0.01, duration: 0.4, type: 'sine', gain: 0.1 })
  },
  error: (ctx) => tone(ctx, { freq: 200, to: 140, duration: 0.2, type: 'sawtooth', gain: 0.1 }),
}

function vibrate(kind: Haptic) {
  if (kind === 'none') return
  if (isNative) {
    const run = kind === 'success' || kind === 'warning' || kind === 'error'
      ? Haptics.notification({ type: {
        success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error,
      }[kind] })
      : Haptics.impact({ style: { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }[kind] })
    void run.catch(() => {})
    return
  }
  const patterns: Record<Exclude<Haptic, 'none'>, number | number[]> = {
    light: 8, medium: 16, heavy: 30, success: [12, 60, 24], warning: [30, 80, 30], error: [40, 60, 40, 60, 40],
  }
  try {
    navigator.vibrate?.(patterns[kind])
  } catch {
    // Vibration is optional.
  }
}

/** Plays the cue's sound and haptic according to the player's settings. */
export function cue(name: Cue) {
  if (settings.vibration) vibrate(HAPTICS[name])
  if (!settings.sound) return
  const ctx = audio()
  if (!ctx || !master) return
  try {
    SOUNDS[name](ctx)
  } catch {
    // Audio is decorative; a failed node must never interrupt a round.
  }
}
