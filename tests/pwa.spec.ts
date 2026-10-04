import { test, expect } from '@playwright/test'

test('the installed app works offline without third-party requests', async ({ page, context, baseURL }) => {
  const external: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (/^https?:/.test(url) && !url.startsWith(baseURL!)) external.push(url)
  })

  await page.goto('/')
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ lang: 'fa', dir: 'rtl', display: 'standalone', start_url: '/' })
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192' }),
    expect.objectContaining({ sizes: '512x512' }),
    expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
  ]))
  await page.evaluate(() => navigator.serviceWorker.ready)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'بزن بریم!', exact: true })).toBeVisible()
  const loadedFaces = await page.evaluate(async () => (await document.fonts.load('700 16px Vazirmatn', 'جاسوس')).length)
  expect(loadedFaces).toBeGreaterThan(0)

  // Rounds are generated locally, so dealing cards needs no network.
  await page.getByRole('button', { name: 'بزن بریم!', exact: true }).click()
  await expect(page.getByRole('button', { name: /دیدن کارت بازیکن/ })).toBeVisible()
  expect(external).toEqual([])
})
