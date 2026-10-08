import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { DEFAULT_CONFIG, PREFERENCES_KEY } from '../src/game/preferences'
import { toFa } from '../src/game/logic'
import type { GameConfig } from '../src/game/types'

async function prepare(page: Page, patch: Partial<GameConfig> = {}) {
  await page.addInitScript(({ key, config }) => {
    localStorage.setItem(key, JSON.stringify(config))
    Math.random = () => 0
  }, { key: PREFERENCES_KEY, config: { ...DEFAULT_CONFIG, playerCount: 3, minutes: 1, ...patch } })
  await page.clock.install()
  await page.goto('/')
}

async function discuss(page: Page) {
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  let word = ''
  for (let seat = 1; seat <= 3; seat++) {
    await page.getByRole('button', { name: `دیدن کارت بازیکن ${toFa(seat)}` }).click()
    const role = await page.locator('.secret-word').innerText()
    if (role !== 'جاسوس') word = role
    await page.getByRole('button', { name: /کارت رو پنهان کن/ }).click()
  }
  await page.getByRole('button', { name: 'شروع گفت‌وگو' }).click()
  await page.clock.fastForward(3_000)
  await expect(page.getByRole('timer')).toBeVisible()
  return word
}

async function earlyGuess(page: Page) {
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await page.getByRole('button', { name: 'جاسوسم؛ کلمه رو حدس می‌زنم' }).click()
  await page.getByRole('button', { name: 'آره، حدس می‌زنم' }).click()
}

async function accessibility(page: Page) {
  await page.waitForFunction(() => !document.getAnimations().some((animation) =>
    animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity))
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations).toEqual([])
}

test('legacy preferences retain classic play and the challenge setting survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(({ key, config }) => {
    const { guessMode: _guessMode, ...legacy } = config
    localStorage.setItem(key, JSON.stringify(legacy))
  }, { key: PREFERENCES_KEY, config: DEFAULT_CONFIG })
  await page.reload()
  await page.getByText('تنظیمات بیشتر').click()
  const challenge = page.getByRole('switch', { name: /چالش حرفه‌ای/ })
  await expect(challenge).toHaveAttribute('aria-checked', 'false')
  await challenge.click()
  await page.reload()
  await expect(page.locator('.home-options > summary')).toContainText('چالش حرفه‌ای')
  await page.getByText('تنظیمات بیشتر').click()
  await expect(challenge).toHaveAttribute('aria-checked', 'true')
  await accessibility(page)
})

test('challenge guessing keeps the answer hidden, supports editing and scores a keyboard-equivalent answer once', async ({ page }, testInfo) => {
  await prepare(page, { guessMode: 'challenge', category: 'مکان' })
  const word = await discuss(page)
  expect(word).toBe('کتابخانه')
  await earlyGuess(page)
  await expect(page.locator('.guess-grid')).toHaveCount(0)
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
  const submit = page.getByRole('button', { name: 'ثبت حدس', exact: true })
  const input = page.getByRole('textbox', { name: 'حدس جاسوس', exact: true })
  await expect(submit).toBeDisabled()
  await input.fill(' ‌ ')
  await expect(submit).toBeDisabled()
  await input.fill('مدرسه')
  await submit.click()
  await expect(page.getByRole('dialog')).toContainText('مدرسه')
  await expect(page.getByRole('button', { name: 'تغییر حدس' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(submit).toBeFocused()
  await input.fill('كِتاب خانه')
  await input.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'تغییر حدس' }).click()
  await expect(input).toHaveValue('كِتاب خانه')
  await accessibility(page)
  await page.screenshot({ path: testInfo.outputPath('challenge-guess.png'), fullPage: true })
  await submit.click()
  await accessibility(page)
  await page.getByRole('button', { name: 'ثبت حدس نهایی' }).dblclick()
  await expect(page.getByText('جاسوس‌ها بردند!')).toBeVisible()
  await expect(page.locator('.end-tally')).toHaveText(/شهروندها ۰\s*–\s*۱ جاسوس‌ها/)
  await expect(page.locator('.end-reveal--guess .is-right')).toHaveText('كِتاب خانه')
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row__delta')).toHaveText(['+۳'])
})

test('a caught spy has one free-form last chance and a wrong answer awards citizens', async ({ page }) => {
  await prepare(page, { guessMode: 'challenge' })
  const word = await discuss(page)
  await page.clock.fastForward(60_000)
  await page.getByRole('button', { name: /بازیکن ۲/ }).click()
  await page.getByRole('button', { name: 'رأی نهایی', exact: true }).click()
  await page.getByRole('button', { name: 'شانس آخر جاسوس' }).click()
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'حدس جاسوس', exact: true }).fill('پاسخ اشتباه')
  await page.getByRole('button', { name: 'ثبت حدس', exact: true }).click()
  await page.getByRole('button', { name: 'ثبت حدس نهایی' }).click()
  await expect(page.getByText('شهروندها بردند!')).toBeVisible()
  await page.getByText('نقش همه‌ی بازیکن‌ها').click()
  await expect(page.locator('.role-row__delta')).toHaveText(['+۱', '+۱'])
})

test('revealing secrets requires confirmation and cancelling keeps the ballot and answer hidden', async ({ page }) => {
  await prepare(page)
  const word = await discuss(page)
  await page.clock.fastForward(60_000)
  await page.getByRole('button', { name: /بازیکن ۲/ }).click()
  const reveal = page.getByRole('button', { name: 'نمایش کلمه و نقش‌ها' })
  await reveal.click()
  await expect(page.getByText(word, { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'برگشت به رأی‌گیری' })).toBeFocused()
  await accessibility(page)
  await page.getByRole('button', { name: 'برگشت به رأی‌گیری' }).click()
  await expect(reveal).toBeFocused()
  await expect(page.getByRole('button', { name: /بازیکن ۲/ })).toHaveAttribute('aria-pressed', 'true')
  await reveal.click()
  await page.getByRole('button', { name: 'نمایش رازها و پایان دور' }).click()
  await expect(page.locator('.end-reveal__value').last()).toHaveText(word)
  await expect(page.locator('.end-tally')).toHaveCount(0)
})

test('public question prompts do not repeat, survive folding the tools, and keep time running', async ({ page }, testInfo) => {
  await prepare(page, { minutes: 5 })
  const word = await discuss(page)
  await page.getByText('زمان و راهنما', { exact: true }).click()
  const prompt = page.locator('.question-prompt__text')
  const seen = new Set<string>()
  for (let step = 0; step < 18; step++) {
    const text = await prompt.innerText()
    expect(seen.has(text)).toBe(false)
    expect(text).not.toContain(word)
    seen.add(text)
    if (step < 17) await page.getByRole('button', { name: 'یک سؤال دیگه' }).click()
  }
  const last = await prompt.innerText()
  await page.getByRole('button', { name: 'یک سؤال دیگه' }).click()
  const next = await prompt.innerText()
  expect(next).not.toBe(last)
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await page.clock.fastForward(5_000)
  await page.getByText('زمان و راهنما', { exact: true }).click()
  await expect(prompt).toHaveText(next)
  const remaining = await page.getByRole('timer').innerText()
  await page.clock.fastForward(5_000)
  await expect(page.getByRole('timer')).not.toHaveText(remaining)
  await accessibility(page)
  await prompt.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('question-help.png'), fullPage: true })
})

test('challenge entry and its confirmation fit small phones, landscape and desktop', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await prepare(page, { guessMode: 'challenge' })
  await discuss(page)
  await earlyGuess(page)
  await accessibility(page)
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 740, height: 360 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport)
    const input = page.getByRole('textbox', { name: 'حدس جاسوس', exact: true })
    await input.fill('کتابخانه')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`challenge-${viewport.width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'ثبت حدس', exact: true }).click()
    await accessibility(page)
    const dialog = await page.getByRole('dialog').boundingBox()
    expect(dialog!.x).toBeGreaterThanOrEqual(0)
    expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(viewport.width)
    await page.getByRole('button', { name: 'تغییر حدس' }).click()
    await expect(input).toBeEditable()
  }
})
