import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { DEFAULT_CONFIG, PREFERENCES_KEY } from '../src/game/preferences'
import { toFa } from '../src/game/logic'

async function prepare(page: Page, patch = {}) {
  await page.addInitScript(({ key, config }) => localStorage.setItem(key, JSON.stringify(config)), {
    key: PREFERENCES_KEY, config: { ...DEFAULT_CONFIG, playerCount: 3, minutes: 1, ...patch },
  })
  await page.goto('/')
}

async function deal(page: Page, count = 3) {
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  const roles: string[] = []
  for (let index = 1; index <= count; index++) {
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).click()
    roles.push(await page.locator('.secret-word').innerText())
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
    await expect(page.locator('.secret-word')).toHaveCount(0)
  }
  await expect(page.getByRole('heading', { name: 'همه آماده‌اید؟' })).toBeVisible()
  return roles
}

/** Waits for every finite animation (entrances, flips, deals) to finish. Several calm
 *  polls in a row skip the gap between one animation ending and the next starting. */
async function settle(page: Page) {
  await page.evaluate(() => { (window as unknown as { calmPolls: number }).calmPolls = 0 })
  await page.waitForFunction(() => {
    const state = window as unknown as { calmPolls: number }
    const busy = document.getAnimations().some((animation) =>
      animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity)
    state.calmPolls = busy ? 0 : state.calmPolls + 1
    return state.calmPolls >= 4
  }, undefined, { polling: 50 })
}

async function startTimer(page: Page) {
  // A paused clock only moves when a test advances it, so slow machines cannot drift.
  await page.clock.install({ time: new Date('2026-10-03T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-03T12:00:01Z'))
  await prepare(page)
  const roles = await deal(page)
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.clock.fastForward(3_000)
  await expect(page.getByRole('timer')).toHaveText('۰۱:۰۰')
  return roles.find((role) => role !== 'جاسوس')!
}

test('settings enforce boundaries, adjust spy count, and survive reloads', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('تعداد بازیکن‌ها').selectOption('30')
  await expect(page.getByLabel('تعداد جاسوس‌ها').locator('option')).toHaveCount(8)
  await page.getByLabel('تعداد جاسوس‌ها').selectOption('8')
  await page.getByLabel('تعداد بازیکن‌ها').selectOption('3')
  await expect(page.getByLabel('تعداد جاسوس‌ها')).toHaveValue('2')
  await expect(page.getByLabel('تعداد جاسوس‌ها').locator('option')).toHaveCount(2)
  await expect(page.getByLabel('تعداد بازیکن‌ها').locator('option').first()).toHaveAttribute('value', '3')
  await expect(page.getByLabel('تعداد بازیکن‌ها').locator('option').last()).toHaveAttribute('value', '30')
  await page.getByLabel('زمان بازی (دقیقه)').selectOption('30')
  await expect(page.getByLabel('زمان بازی (دقیقه)').locator('option')).toHaveCount(30)
  await page.getByText('تنظیمات بیشتر').click()
  await page.getByLabel('موضوع کلمه‌ها').selectOption('غذا')
  await page.getByRole('switch', { name: /راهنما برای جاسوس/ }).click()
  await page.reload()
  await expect(page.locator('.home-options')).not.toHaveAttribute('open', '')
  await expect(page.locator('.home-options > summary')).toContainText('غذا · راهنمای جاسوس')
  await page.getByText('تنظیمات بیشتر').click()
  await expect(page.getByLabel('موضوع کلمه‌ها')).toHaveValue('غذا')
  await expect(page.getByRole('switch', { name: /راهنما برای جاسوس/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel('تعداد بازیکن‌ها')).toHaveValue('3')
  await expect(page.getByLabel('زمان بازی (دقیقه)')).toHaveValue('30')
})

test('corrupt or denied browser storage falls back to a playable game', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), PREFERENCES_KEY)
  await page.goto('/')
  await expect(page.getByLabel('تعداد بازیکن‌ها')).toHaveValue('5')
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied') } })
  })
  await page.reload()
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await expect(page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' })).toBeVisible()
})

test('system motion preferences leave game animations and transitions unchanged', async ({ page }) => {
  await page.clock.install()
  const motion = (selector: string) => page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      animation: style.animationName,
      animationDuration: style.animationDuration,
      transition: style.transitionProperty,
      transitionDuration: style.transitionDuration,
    }
  })
  const results = []
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion })
    await prepare(page)
    const button = await motion('.btn')
    expect(button.transitionDuration.split(',').every((duration) => parseFloat(duration) > 0)).toBe(true)
    await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
    const back = await motion('.card--back')
    await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
    const front = await motion('.card--front')
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
    for (let index = 2; index <= 3; index++) {
      await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).click()
      await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
    }
    await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
    const countdown = await motion('.countdown')
    await page.clock.fastForward(3_000)
    await expect(page.getByRole('timer')).toHaveText('۰۱:۰۰')
    await page.clock.fastForward(50_000)
    await expect(page.getByRole('timer')).toHaveText('۰۰:۱۰')
    const warning = await motion('.stopwatch.is-warn')
    for (const animation of [back, front, countdown, warning]) {
      expect(animation.animation).not.toBe('none')
      expect(parseFloat(animation.animationDuration)).toBeGreaterThan(0)
    }
    results.push({ button, back, front, countdown, warning })
  }
  expect(results[1]).toEqual(results[0])
})

test('reveal handoffs remove secrets immediately and never start the timer automatically', async ({ page }) => {
  await prepare(page, { spyGuide: true, category: 'غذا' })
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  const roles: string[] = []
  for (let index = 1; index <= 3; index++) {
    await expect(page.locator('.secret-word')).toHaveCount(0)
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).dblclick()
    await expect(page.locator('.secret-word')).toBeVisible()
    const role = await page.locator('.secret-word').innerText()
    roles.push(role)
    if (role === 'جاسوس') await expect(page.getByText('راهنمای تو: غذا')).toBeVisible()
    // Tapping a revealed card cannot accidentally deal the next player's role.
    await page.locator('.card--front').click()
    await expect(page.locator('[data-screen-title]')).toHaveText(`نوبت بازیکن ${toFa(index)}`)
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  expect(roles.filter((role) => role === 'جاسوس')).toHaveLength(1)
  expect(new Set(roles.filter((role) => role !== 'جاسوس')).size).toBe(1)
  await expect(page.getByRole('heading', { name: 'همه آماده‌اید؟' })).toBeFocused()
  await expect(page.getByRole('timer')).toHaveCount(0)
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PREFERENCES_KEY)
  expect(Object.keys(stored).sort()).toEqual(['category', 'minutes', 'names', 'playerCount', 'sound', 'spyCount', 'spyGuide', 'vibration'])
})

test('switching away conceals a revealed card without skipping its owner', async ({ page }) => {
  await prepare(page)
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  const role = await page.locator('.secret-word').innerText()
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.secret-word')).toHaveCount(0)
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: false }))
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  await expect(page.locator('.secret-word')).toHaveText(role)
})

test('reference deck shows both roles and opening the guide preserves a private handoff', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 363, height: 692 })
  // A deterministic round gives player 1 the word and player 2 the spy card.
  await page.addInitScript(() => { Math.random = () => 0 })
  await prepare(page)
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await expect(page.locator('.card')).toHaveCSS('transform', 'none')
  const card = await page.locator('.card').boundingBox()
  expect(card!.width).toBeGreaterThan(300)
  expect(card!.height).toBeGreaterThan(450)
  await page.screenshot({ path: testInfo.outputPath('deck-back.png'), fullPage: true })
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  const word = await page.locator('.secret-word').innerText()
  expect(word).not.toBe('جاسوس')
  await expect(page.locator('.card-art--face')).toHaveCount(0)
  await expect(page.locator('.card')).toHaveCSS('transform', 'none')
  await page.screenshot({ path: testInfo.outputPath('deck-citizen.png'), fullPage: true })
  await page.getByRole('button', { name: 'راهنمای بازی' }).click()
  await expect(page.locator('.secret-word')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'راهنمای بازی' })).toBeVisible()
  await page.getByRole('button', { name: 'متوجه شدم' }).click()
  await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۱' })).toBeFocused()
  await expect(page.locator('.secret-word')).toHaveCount(0)
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  await expect(page.locator('.secret-word')).toHaveText(word)
  await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۲' }).click()
  await expect(page.locator('.secret-word')).toHaveText('جاسوس')
  await expect(page.locator('.card-art--face')).toBeVisible()
  await expect(page.locator('.card')).toHaveCSS('transform', 'none')
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('deck-spy.png'), fullPage: true })
})

test('a round can be cancelled safely with keyboard-accessible confirmation', async ({ page }) => {
  await prepare(page)
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await expect(page.locator('.secret-word')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ادامه‌ی بازی' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'لغو دور و رفتن به خانه' }).click()
  await expect(page.getByRole('heading', { name: 'جاسوس', exact: true })).toBeFocused()
})

test('pause, extension, resume, and cancelling an early finish preserve exact time', async ({ page }) => {
  await startTimer(page)
  await page.clock.runFor(1_000)
  await expect(page.getByRole('timer')).toHaveText('۰۰:۵۹')
  await page.getByRole('button', { name: 'مکث بازی' }).click()
  await page.clock.fastForward(20_000)
  await expect(page.getByRole('timer')).toHaveText('۰۰:۵۹')
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await page.getByRole('button', { name: '۱ دقیقه بیشتر' }).click()
  await expect(page.getByRole('timer')).toHaveText('۰۱:۵۹')
  await expect(page.getByRole('progressbar')).toHaveAttribute('max', '120')
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'ادامه‌ی بازی', exact: true }).click()
  await expect(page.getByRole('timer')).toHaveText('۰۱:۵۹')
  await expect(page.getByRole('button', { name: 'ادامه‌ی بازی', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ادامه‌ی بازی', exact: true }).click()
  await page.clock.runFor(2_000)
  await expect(page.getByRole('timer')).toHaveText('۰۱:۵۷')
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await page.clock.fastForward(30_000)
  await page.keyboard.press('Escape')
  await page.clock.runFor(1_000)
  await expect(page.getByRole('timer')).toHaveText('۰۱:۵۶')
})

test('time expiry catches up after a delayed callback and keeps secrets hidden', async ({ page }) => {
  const word = await startTimer(page)
  await page.clock.fastForward(50_000)
  await expect(page.getByRole('timer')).toHaveText('۰۰:۱۰')
  await expect(page.getByRole('status')).toContainText('۱۰ ثانیه')
  await expect(page.getByRole('timer')).toHaveAttribute('aria-live', 'off')
  await page.clock.fastForward(10_000)
  await expect(page.getByRole('heading', { name: 'وقت تصمیمه!' })).toBeFocused()
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
  await expect(page.locator('.end-reveal')).toHaveCount(0)
  await page.getByRole('button', { name: 'نمایش کلمه و نقش‌ها' }).click()
  await expect(page.locator('.end-reveal__value').last()).toHaveText(word)
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row')).toHaveCount(3)
  await page.getByRole('button', { name: 'دوباره بزن بریم!' }).click()
  const roles: string[] = []
  for (let index = 1; index <= 3; index++) {
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).click()
    roles.push(await page.locator('.secret-word').innerText())
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  expect(roles).not.toContain(word)
})

test('early completion goes to the same spoiler-free final discussion', async ({ page }) => {
  const word = await startTimer(page)
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await page.getByRole('button', { name: 'بریم برای تصمیم نهایی' }).click()
  await expect(page.getByRole('heading', { name: 'وقت تصمیمه!' })).toBeVisible()
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
})

test('card handoffs work with the keyboard and announce only safe navigation labels', async ({ page }) => {
  await prepare(page)
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).focus()
  await page.keyboard.press('Enter')
  for (let index = 1; index <= 3; index++) {
    await expect(page.getByRole('heading', { name: `نوبت بازیکن ${toFa(index)}` })).toBeFocused()
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /کارت رو پنهان کن/ })).toBeFocused()
    await expect(page.locator('.secret-word')).toBeVisible()
    await page.keyboard.press('Enter')
  }
  await expect(page.getByRole('heading', { name: 'همه آماده‌اید؟' })).toBeFocused()
  await expect(page.locator('.secret-word')).toHaveCount(0)
})

test('a denied wake lock does not interrupt the timer or pause control', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request: () => Promise.reject(new Error('Power saving mode')) },
  }))
  await startTimer(page)
  await page.getByRole('button', { name: 'مکث بازی' }).click()
  await expect(page.getByRole('button', { name: 'ادامه‌ی بازی', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('core screens pass automated accessibility checks', async ({ page }, testInfo) => {
  const check = async (screen: string) => {
    // Measure settled screens without suppressing their entrance animations.
    await settle(page)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(result.violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`${screen}.png`), fullPage: true })
  }
  await prepare(page)
  await check('home')
  await page.getByText('تنظیمات بیشتر').click()
  await check('home-options')
  await page.getByText('تنظیمات بیشتر').click()
  await page.getByRole('button', { name: 'راهنمای بازی' }).click()
  await check('guide')
  await page.getByRole('button', { name: 'متوجه شدم' }).click()
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await check('card-back')
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  await check('card-front')
  await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  for (let index = 2; index <= 3; index++) {
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).click()
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  await check('ready')
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await expect(page.getByRole('timer')).toBeVisible()
  await page.getByRole('button', { name: 'مکث بازی' }).click()
  await check('timer')
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await check('timer-tools')
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await check('confirm-end')
  await page.getByRole('button', { name: 'بریم برای تصمیم نهایی' }).click()
  await check('resolution')
  await page.getByRole('button', { name: 'نمایش کلمه و نقش‌ها' }).click()
  await check('end')
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await check('end-roles')
})

test('home confirmations pause the countdown and restore the previous timer state', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-03T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-03T12:00:01Z'))
  await prepare(page)
  await deal(page)
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.clock.fastForward(1_000)
  await expect(page.locator('.countdown')).toHaveText('۲')
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await page.clock.fastForward(10_000)
  await expect(page.locator('.countdown')).toHaveText('۲')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.clock.fastForward(2_000)
  await expect(page.getByRole('timer')).toHaveText('۰۱:۰۰')
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await page.clock.fastForward(10_000)
  await expect(page.getByRole('timer')).toHaveText('۰۱:۰۰')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'مکث بازی' })).toBeVisible()
  await page.clock.fastForward(1_000)
  await expect(page.getByRole('timer')).toHaveText('۰۰:۵۹')
  await page.getByRole('button', { name: 'مکث بازی' }).click()
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'ادامه‌ی بازی', exact: true })).toBeVisible()
  await page.clock.fastForward(10_000)
  await expect(page.getByRole('timer')).toHaveText('۰۰:۵۹')
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await page.getByRole('button', { name: 'لغو دور و رفتن به خانه' }).click()
  await expect(page.getByRole('button', { name: 'بزن بریم!', exact: true })).toBeVisible()
})

test('gameplay artboards keep time, instructions, and primary actions readable across screen sizes', async ({ page }, testInfo) => {
  test.setTimeout(180_000)
  await page.clock.install({ time: new Date('2026-10-03T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-03T12:00:01Z'))
  const capture = async (name: string, action?: string) => {
    await settle(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (action && page.viewportSize()!.height >= 568) {
      const bounds = await page.getByRole('button', { name: action, exact: true }).boundingBox()
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    }
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
  }
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 363, height: 692 }, { width: 390, height: 844 }, { width: 740, height: 360 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport)
    await prepare(page, { minutes: 5 })
    const roles = await deal(page)
    const word = roles.find((role) => role !== 'جاسوس')!
    await capture(`ready-${viewport.width}`, 'شروع گفت‌وگو')
    await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
    for (let count = 3; count >= 1; count--) {
      await expect(page.locator('.countdown')).toHaveText(toFa(count))
      if (viewport.width === 363) {
        await expect(page.locator('.countdown')).toHaveCSS('transform', 'none')
        await capture(`countdown-${count}`)
      }
      await page.clock.fastForward(1_000)
    }
    await expect(page.getByRole('timer')).toHaveText('۰۵:۰۰')
    await expect(page.locator('.timer-tools')).not.toHaveAttribute('open', '')
    await capture(`timer-${viewport.width}`, 'پایان گفت‌وگو')
    const pause = await page.getByRole('button', { name: 'مکث بازی' }).boundingBox()
    expect(pause!.x + pause!.width).toBeLessThanOrEqual(viewport.width)
    await page.getByText('زمان و راهنما', { exact: true }).click()
    await capture(`tools-${viewport.width}`, 'پایان گفت‌وگو')
    await page.getByRole('region', { name: 'زمان و راهنمای بازی' }).focus()
    await expect(page.getByRole('region', { name: 'زمان و راهنمای بازی' })).toBeFocused()
    await page.getByText('زمان و راهنما', { exact: true }).click()
    if (viewport.width === 363) {
      await page.clock.fastForward(100_000)
      await expect(page.getByRole('timer')).toHaveText('۰۳:۲۰')
      await capture('timer-middle', 'پایان گفت‌وگو')
      await page.clock.fastForward(190_000)
    } else await page.clock.fastForward(290_000)
    await expect(page.getByRole('timer')).toHaveText('۰۰:۱۰')
    await expect(page.locator('.stopwatch')).toHaveAttribute('src', /watch-red/)
    await capture(`warning-${viewport.width}`, 'پایان گفت‌وگو')
    await page.clock.fastForward(10_000)
    await expect(page.getByText(word, { exact: true })).toHaveCount(0)
    await capture(`decision-${viewport.width}`, 'نمایش کلمه و نقش‌ها')
    await page.getByRole('button', { name: 'نمایش کلمه و نقش‌ها' }).click()
    await expect(page.locator('.end-reveal__value').last()).toHaveText(word)
    await expect(page.locator('.all-roles')).not.toHaveAttribute('open', '')
    await capture(`result-${viewport.width}`, 'دوباره بزن بریم!')
  }
})

test('mobile, landscape, and desktop layouts have reachable actions and no horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 363, height: 692 }, { width: 390, height: 844 }, { width: 740, height: 360 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport)
    await prepare(page, viewport.width === 363 ? { playerCount: 15, spyCount: 2, minutes: 5 } : {})
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const start = await page.getByRole('button', { name: 'بزن بریم!', exact: true }).boundingBox()
    if (viewport.height >= 568) expect(start!.y + start!.height).toBeLessThanOrEqual(viewport.height)
    const lastSetting = await page.locator('.home-screen .setting-row').last().boundingBox()
    const hero = await page.locator('.home-hero').boundingBox()
    expect(hero!.y).toBeGreaterThanOrEqual(lastSetting!.y + lastSetting!.height)
    await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
    await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
    await expect(page.locator('.secret-word')).toBeVisible()
    await expect(page.locator('.card')).toHaveCSS('transform', 'none')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(await page.locator('.card').evaluate((card) => {
      const outer = card.getBoundingClientRect()
      const text = card.querySelector('.card-text')!.getBoundingClientRect()
      const tip = card.querySelector('.card-tip')!.getBoundingClientRect()
      const face = card.querySelector('.card-art--face')?.getBoundingClientRect()
      return text.left >= outer.left && text.right <= outer.right && text.top >= outer.top && text.bottom <= outer.bottom
        && tip.bottom <= outer.bottom && text.bottom < tip.top && (!face || face.bottom <= text.top)
    })).toBe(true)
    const pass = await page.getByRole('button', { name: /کارت رو پنهان کن/ }).boundingBox()
    if (viewport.height >= 568) expect(pass!.y + pass!.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: testInfo.outputPath(`reveal-${viewport.width}.png`), fullPage: true })
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
    await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۲' })).toBeFocused()
  }
  expect(errors).toEqual([])
})

test('a double tap or held Enter cannot pass a card its owner has not seen', async ({ page }) => {
  await prepare(page)
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۱' }).click()
  const pass = (await page.getByRole('button', { name: /کارت رو پنهان کن/ }).boundingBox())!
  await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۲' })).toBeFocused()
  // The second tap of a double tap on the card lands on the hide button.
  await page.mouse.dblclick(pass.x + pass.width / 2, pass.y + pass.height / 2)
  await expect(page.locator('.secret-word')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۲' })).toBeAttached()
  await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۳' })).toBeFocused()
  await page.getByRole('button', { name: 'دیدن کارت بازیکن ۳' }).focus()
  // A second keydown without keyup is an auto-repeat of a held key.
  await page.keyboard.down('Enter')
  await expect(page.getByRole('button', { name: /کارت رو پنهان کن/ })).toBeFocused()
  await page.keyboard.down('Enter')
  await page.keyboard.up('Enter')
  await expect(page.getByRole('heading', { name: 'نوبت بازیکن ۳' })).toBeAttached()
  await expect(page.locator('.secret-word')).toBeVisible()
})

test('a dialog closed by the browser without a cancel event resumes the round', async ({ page }) => {
  await startTimer(page)
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').evaluate((dialog: HTMLDialogElement) => dialog.close())
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'مکث بازی' })).toBeVisible()
  await page.getByRole('button', { name: 'لغو دور و بازگشت به خانه' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

async function axe(page: Page) {
  await settle(page)
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations).toEqual([])
}

test('the in-app vote, last-chance guess, and scoreboard decide and record each round', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  // Deterministic rounds: player 2 is the spy and every guess grid starts with the same order.
  await page.addInitScript(() => { Math.random = () => 0 })
  await page.clock.install()
  await prepare(page)
  const roles = await deal(page)
  const word = roles.find((role) => role !== 'جاسوس')!
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.clock.fastForward(3_000)
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await page.getByRole('button', { name: 'بریم برای تصمیم نهایی' }).click()

  const vote = page.getByRole('button', { name: /^رأی نهایی/ })
  await expect(vote).toBeDisabled()
  await page.getByRole('button', { name: /بازیکن ۲/ }).click()
  await expect(page.getByRole('button', { name: /بازیکن ۲/ })).toHaveAttribute('aria-pressed', 'true')
  // A single-spy ballot swaps the pick instead of growing.
  await page.getByRole('button', { name: /بازیکن ۳/ }).click()
  await expect(page.getByRole('button', { name: /بازیکن ۲/ })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: /بازیکن ۲/ }).click()
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('vote.png'), fullPage: true })
  await vote.click()

  await expect(page.getByText('جاسوس بود!')).toBeAttached()
  await expect(page.getByText('گیر افتاد!')).toBeAttached()
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('verdict-caught.png'), fullPage: true })
  await page.getByRole('button', { name: 'شانس آخر جاسوس' }).click()

  const options = page.getByRole('group', { name: 'گزینه‌های حدس جاسوس' }).getByRole('button')
  await expect(options).toHaveCount(8)
  await expect(page.getByRole('button', { name: word, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ثبت حدس' })).toBeDisabled()
  const wrong = (await options.allInnerTexts()).find((option) => option !== word)!
  await page.getByRole('button', { name: wrong, exact: true }).click()
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('guess.png'), fullPage: true })
  await page.getByRole('button', { name: 'ثبت حدس' }).click()

  await expect(page.getByText('شهروندها بردند!')).toBeVisible()
  await expect(page.locator('.end-reveal__value').last()).toHaveText(word)
  await expect(page.locator('.end-tally')).toHaveText(/شهروندها ۱\s*–\s*۰ جاسوس‌ها/)
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row__delta')).toHaveText(['+۱', '+۱'])
  await expect(page.locator('.role-row__points')).toHaveText(['۱ امتیاز', '۰ امتیاز', '۱ امتیاز'])
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('end-citizens.png'), fullPage: true })

  // Second round: accusing a citizen hands the spies the win at once.
  await page.getByRole('button', { name: 'دوباره بزن بریم!' }).click()
  for (let index = 1; index <= 3; index++) {
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(index)}` }).click()
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.clock.fastForward(3_000)
  await page.clock.fastForward(60_000)
  await expect(page.getByRole('heading', { name: 'وقت تصمیمه!' })).toBeFocused()
  await page.getByRole('button', { name: /بازیکن ۱/ }).click()
  await page.getByRole('button', { name: /^رأی نهایی/ }).click()
  await expect(page.getByText('شهروند بود!')).toBeAttached()
  await expect(page.getByText('اشتباه شد!')).toBeAttached()
  await page.getByRole('button', { name: 'نمایش نتیجه' }).click()
  await expect(page.getByText('جاسوس‌ها بردند!')).toBeVisible()
  await expect(page.locator('.end-tally')).toHaveText(/شهروندها ۱\s*–\s*۱ جاسوس‌ها/)
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row__points')).toHaveText(['۱ امتیاز', '۲ امتیاز', '۱ امتیاز'])
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('end-spies.png'), fullPage: true })
})

test('a spy can stop the discussion to guess, and a right guess wins the bonus', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0 })
  const word = await startTimer(page)
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await page.getByRole('button', { name: 'جاسوسم؛ کلمه رو حدس می‌زنم' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  // Cancelling resumes the clock exactly as it was.
  await page.getByRole('dialog').getByRole('button', { name: 'ادامه‌ی بازی' }).click()
  await expect(page.getByRole('button', { name: 'مکث بازی' })).toBeVisible()
  await page.getByRole('button', { name: 'جاسوسم؛ کلمه رو حدس می‌زنم' }).click()
  await page.getByRole('button', { name: 'آره، حدس می‌زنم' }).click()
  await expect(page.getByRole('heading', { name: 'جاسوس، کلمه چیه؟' })).toBeFocused()
  await page.getByRole('button', { name: word, exact: true }).click()
  await page.getByRole('button', { name: 'ثبت حدس' }).click()
  await expect(page.getByText('جاسوس‌ها بردند!')).toBeVisible()
  await expect(page.getByText('وسط گفت‌وگو کلمه رو درست حدس زد')).toBeVisible()
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row__delta')).toHaveText(['+۳'])
})

test('player names are stored and follow the deal and the vote', async ({ page }, testInfo) => {
  await prepare(page)
  await page.getByText('تنظیمات بیشتر').click()
  await page.getByRole('button', { name: /نام بازیکن‌ها/ }).click()
  await expect(page.getByRole('heading', { name: 'نام بازیکن‌ها' })).toBeFocused()
  await page.getByLabel('نام بازیکن ۱').fill('سارا')
  await page.getByLabel('نام بازیکن ۳').fill('علی')
  await axe(page)
  await page.screenshot({ path: testInfo.outputPath('players.png'), fullPage: true })
  await page.getByRole('button', { name: 'ذخیره' }).click()
  // Returning from the names screen keeps the settings panel open.
  await expect(page.getByRole('button', { name: /نام بازیکن‌ها/ })).toContainText('۲ نام ثبت شده')
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PREFERENCES_KEY)
  expect(stored.names).toEqual(['سارا', '', 'علی'])
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'نوبت سارا' })).toBeFocused()
  for (const name of ['سارا', 'بازیکن ۲', 'علی']) {
    await page.getByRole('button', { name: `دیدن کارت ${name}` }).click()
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.getByRole('button', { name: 'پایان گفت‌وگو', exact: true }).click()
  await page.getByRole('button', { name: 'بریم برای تصمیم نهایی' }).click()
  await expect(page.getByRole('group', { name: 'انتخاب مظنون‌ها' }).getByRole('button'))
    .toHaveText([/سارا/, /بازیکن ۲/, /علی/])
})

test('sound and vibration settings persist and never block play', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  // Desktop Chromium has no vibration motor; record what a phone would receive.
  await page.addInitScript(() => {
    const calls: unknown[] = []
    Object.defineProperty(window, 'vibrations', { value: calls })
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (pattern: unknown) => calls.push(pattern) > 0 })
  })
  const vibrations = () => page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations.length)
  await prepare(page)
  const sound = page.getByRole('button', { name: 'صدای بازی' })
  await expect(sound).toHaveAttribute('aria-pressed', 'true')
  await sound.click()
  await expect(sound).toHaveAttribute('aria-pressed', 'false')
  await page.getByText('تنظیمات بیشتر').click()
  expect(await vibrations()).toBeGreaterThan(0)
  await page.getByRole('switch', { name: 'لرزش گوشی' }).click()
  await expect(page.getByRole('switch', { name: 'لرزش گوشی' })).toHaveAttribute('aria-checked', 'false')
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PREFERENCES_KEY)
  expect(stored).toMatchObject({ sound: false, vibration: false })
  await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations.splice(0))
  await deal(page)
  expect(await vibrations()).toBe(0)
  expect(errors).toEqual([])
})
