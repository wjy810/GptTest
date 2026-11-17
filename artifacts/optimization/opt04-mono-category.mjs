import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const measurements = []
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await page.goto('http://127.0.0.1:4173/fintech/')
    const tabs = page.locator('.asset-tabs')
    const last = tabs.getByRole('button').last()
    await last.focus()
    const m = await tabs.evaluate(e => {
      const box = e.getBoundingClientRect()
      const last = e.querySelector('button:last-child').getBoundingClientRect()
      return { client: e.clientWidth, full: e.scrollWidth, left: e.scrollLeft, containerLeft: box.left, containerRight: box.right, buttonLeft: last.left, buttonRight: last.right }
    })
    expect(m.buttonLeft).toBeGreaterThanOrEqual(m.containerLeft - 1)
    expect(m.buttonRight).toBeLessThanOrEqual(m.containerRight + 1)
    if (width === 320) expect(m.left).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.market-table tbody tr')).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.locator('.market-toolbar').screenshot({ path: `artifacts/optimization/opt04-fintech-${width}-category.png` })
    measurements.push({ width, ...m, pass: true })
    await page.close()
  }
  await fs.writeFile('artifacts/optimization/opt04-fintech-category.json', JSON.stringify(measurements, null, 2))
  console.log(JSON.stringify(measurements))
} finally { await browser.close() }
