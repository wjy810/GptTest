import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const results = []
const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:5180'
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
async function check(name, condition) {
  if (!condition) throw new Error(name)
  results.push({ name, passed: true })
}
await page.goto(baseURL, { waitUntil: 'networkidle' })
await check('initial six menu dishes', (await page.locator('.dish-card').count()) === 6)
await page.getByRole('button', { name: '田园', exact: true }).click()
await check('garden filter shows two dishes', (await page.locator('.dish-card').count()) === 2)
await check(
  'garden includes pumpkin',
  await page.getByRole('heading', { name: '炭火慢烤南瓜' }).isVisible(),
)
await page.getByRole('button', { name: '甜点', exact: true }).click()
await check('dessert filter shows two dishes', (await page.locator('.dish-card').count()) === 2)
await page.getByRole('button', { name: '全部 / ALL' }).click()
await page.getByRole('button', { name: '生成预约意向' }).click()
await check(
  'empty date prevents confirmation',
  (await page.locator('.booking-success').count()) === 0,
)
await page.locator('#booking-date').fill('2026-01-01')
await check(
  'past date rejected by browser',
  await page.locator('#booking-date').evaluate((el) => !el.checkValidity()),
)
await page.locator('#booking-date').evaluate((el) => el.removeAttribute('min'))
await page.getByRole('button', { name: '生成预约意向' }).click()
await check(
  'submit independently rejects past date',
  (await page.getByRole('alert').innerText()).includes('今天或之后'),
)
const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const candidate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
let futureDate = calendar.format(candidate)
if (new Date(`${futureDate}T00:00:00Z`).getUTCDay() === 1) {
  candidate.setTime(candidate.getTime() + 24 * 60 * 60 * 1000)
  futureDate = calendar.format(candidate)
}
const monday = new Date(`${futureDate}T12:00:00Z`)
monday.setUTCDate(monday.getUTCDate() + ((8 - monday.getUTCDay()) % 7))
await page.locator('#booking-date').fill(monday.toISOString().slice(0, 10))
await page.getByRole('button', { name: '生成预约意向' }).click()
await check(
  'Monday closure matches published opening days',
  (await page.getByRole('alert').innerText()).includes('周一休息'),
)
await page.locator('#booking-date').fill(futureDate)
await page.locator('#booking-time').selectOption('19:30')
await page.getByRole('button', { name: '增加人数' }).click()
await page.getByRole('button', { name: '生成预约意向' }).click()
await check(
  'booking includes chosen date time guests',
  (await page.locator('.booking-success').innerText()).includes(`${futureDate} · 19:30 · 3 位`),
)
await check(
  'confirmation has modal semantics',
  await page.locator('dialog').evaluate((el) => el.matches(':modal')),
)
await page.keyboard.press('Escape')
await check(
  'Escape closes and restores submit focus',
  await page
    .getByRole('button', { name: '生成预约意向' })
    .evaluate((el) => el === document.activeElement),
)
await page.getByRole('button', { name: '减少人数' }).click()
await check(
  'editing guests clears stale confirmation',
  (await page.locator('.booking-success').count()) === 0,
)
await page.getByRole('button', { name: '减少人数' }).click()
await check(
  'guest lower bound is one',
  await page.getByRole('button', { name: '减少人数' }).isDisabled(),
)
for (let i = 0; i < 7; i++) await page.getByRole('button', { name: '增加人数' }).click()
await check(
  'guest upper bound is eight',
  await page.getByRole('button', { name: '增加人数' }).isDisabled(),
)
await page.getByRole('button', { name: '生成预约意向' }).click()
await check(
  'booking explicitly local demo',
  (await page.locator('.booking-success').innerText()).includes('真实订位需直接联系餐厅'),
)
await page.keyboard.press('Tab')
await check(
  'keyboard focus stays inside modal',
  await page.locator('dialog').evaluate((el) => el.contains(document.activeElement)),
)
await page.getByRole('button', { name: '返回修改' }).click()
await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.keyboard.press('Tab')
await check(
  'skip link is first keyboard stop',
  await page.locator('.skip').evaluate((el) => el === document.activeElement),
)
await page.keyboard.press('Enter')
await check('skip link targets menu', page.url().endsWith('#menu'))
await check(
  'reduced motion disables smooth scrolling',
  await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'),
)
await page.goto(baseURL, { waitUntil: 'networkidle' })
for (const width of [1440, 390, 320]) {
  await page.setViewportSize({ width, height: 900 })
  await check(
    `no horizontal overflow ${width}`,
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  )
  await page.screenshot({
    path: `/workspace/GptTest/artifacts/reviews/restaurant-${width}.png`,
    fullPage: true,
  })
}
await check('no browser exceptions', errors.length === 0)
await fs.writeFile(
  '/workspace/GptTest/artifacts/reviews/restaurant-results.json',
  JSON.stringify({ site: 'restaurant', results, errors }, null, 2),
)
console.log(JSON.stringify({ passed: results.length, errors }, null, 2))
await browser.close()
