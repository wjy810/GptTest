import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'
const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  timezoneId: 'America/Los_Angeles',
})
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5183'
const results = [],
  errors = [],
  posts = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('request', (r) => {
  if (r.method() === 'POST') posts.push(r.url())
})
async function focused(locator) {
  await expect(locator).toBeFocused()
  return true
}
async function check(name, condition) {
  if (!condition) throw new Error(name)
  results.push({ name, passed: true })
}
await page.clock.install({ time: new Date('2026-11-17T16:30:00Z') })
await page.goto(url, { waitUntil: 'networkidle' })
await check(
  'portal is centered and has no marketing illustration',
  (await page.locator('.hero').evaluate((el) => getComputedStyle(el).display === 'block')) &&
    (await page.locator('.hero svg.city-scene').count()) === 0,
)
await check(
  'directory appears early',
  await page.locator('#services').evaluate((el) => el.getBoundingClientRect().top < 700),
)
await check('six initial services', (await page.locator('.service-card').count()) === 6)
await check(
  'date uses UTC+8 even in US browser',
  (await page.locator('input[name=date]').getAttribute('min')) === '2026-11-18',
)
await page.getByLabel('搜索城市服务', { exact: true }).fill('健康')
await check('search matches one service', (await page.locator('.service-card').count()) === 1)
await page.getByRole('button', { name: '查找服务', exact: true }).click()
await check('search moves focus to directory', await focused(page.locator('#services')))
await page.getByRole('button', { name: '教育文化', exact: true }).click()
await check(
  'category and search use intersection',
  (await page.locator('.service-card').count()) === 0,
)
await check(
  'empty result offers recovery',
  await page.getByRole('heading', { name: '暂时没有找到这项服务' }).isVisible(),
)
await page.getByRole('button', { name: '查看全部服务', exact: true }).click()
await check(
  'reset restores both filters',
  (await page.locator('.service-card').count()) === 6 &&
    (await page.getByLabel('搜索城市服务', { exact: true }).inputValue()) === '',
)
await page.getByRole('button', { name: '教育文化', exact: true }).click()
await check(
  'education category has two services',
  (await page.locator('.service-card').count()) === 2,
)
await page
  .locator('.service-card')
  .filter({ has: page.getByRole('heading', { name: '学习与成长' }) })
  .click()
await check(
  'service preselected in form',
  (await page.locator('select[name=service]').inputValue()) === 'learning',
)
await check('service choice receives focus', await focused(page.locator('select[name=service]')))
await check(
  'required instructions visible',
  (await page.locator('#form-guidance').innerText()).includes('所有字段均为必填'),
)
await page.getByRole('button', { name: '生成演示预约', exact: true }).click()
await check('empty required form prevented', (await page.locator('.booking-success').count()) === 0)
await page.locator('input[name=name]').fill('示例小林')
await page.locator('input[name=email]').fill('demo@example.com')
await page.locator('input[name=date]').fill('2026-11-17')
await page.locator('select[name=time]').selectOption('14:00 – 15:00')
await page.locator('input[name=acknowledge]').check()
await check(
  'past date invalid in native form',
  await page.locator('input[name=date]').evaluate((el) => !el.checkValidity()),
)
await page.locator('input[name=date]').evaluate((el) => el.removeAttribute('min'))
await page.getByRole('button', { name: '生成演示预约', exact: true }).click()
await check(
  'submit independently validates date',
  (await page.getByRole('alert').innerText()).includes('不能早于'),
)
await check('error receives focus', await focused(page.getByRole('alert')))
await page.locator('input[name=date]').fill('2026-11-20')
await check('editing clears obsolete error', (await page.getByRole('alert').count()) === 0)
await page.getByRole('button', { name: '生成演示预约', exact: true }).click()
await check(
  'summary includes selected service',
  (await page.locator('.booking-success').innerText()).includes('学习与成长'),
)
await check(
  'summary includes date time and local status',
  (await page.locator('.booking-success').innerText()).includes('2026-11-20') &&
    (await page.locator('.booking-success').innerText()).includes('14:00 – 15:00') &&
    (await page.locator('.booking-success').innerText()).includes('仅本地确认 · 未发送'),
)
await check('summary receives focus', await focused(page.locator('.booking-success')))
await page.getByRole('button', { name: '重新安排', exact: true }).click()
await check('rearrange restores form focus', await focused(page.locator('select[name=service]')))
await page.locator('.update-card').first().getByRole('button').click()
await check('notice expands actual content', (await page.locator('.update-detail').count()) === 1)
await page.locator('.update-card').first().getByRole('button').click()
await check('notice collapses', (await page.locator('.update-detail').count()) === 0)
await page.getByText('这些服务是真实的城市服务吗？', { exact: true }).click()
await check(
  'FAQ expands',
  (await page.locator('.faq-list details').first().getAttribute('open')) !== null,
)
await page.reload({ waitUntil: 'networkidle' })
await check(
  'reload keeps no booking data',
  (await page.locator('.booking-success').count()) === 0 &&
    (await page.locator('input[name=name]').inputValue()) === '',
)
await page.keyboard.press('Tab')
await check(
  'skip link first',
  await page.locator('.skip-link').evaluate((el) => el === document.activeElement),
)
await check(
  'reduced motion respects system',
  await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'),
)
for (const width of [1440, 390, 320]) {
  await page.setViewportSize({ width, height: 900 })
  await check(
    `no horizontal overflow ${width}`,
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  )
  await page.evaluate(() => {
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(100)
  await page.screenshot({
    path: `/workspace/GptTest/artifacts/reviews/civic-${width}.png`,
    fullPage: true,
  })
}
await page.getByRole('button', { name: '打开导航' }).click()
await check(
  'mobile menu state exposed',
  (await page.getByRole('button', { name: '关闭导航' }).getAttribute('aria-expanded')) === 'true',
)
await page.getByRole('navigation', { name: '主导航' }).getByRole('link').first().focus()
await page.keyboard.press('Escape')
await check(
  'Escape closes navigation and restores toggle focus',
  await page
    .getByRole('button', { name: '打开导航' })
    .evaluate((el) => el === document.activeElement),
)
await check('no information POST requests', posts.length === 0)
await check('no browser exceptions', errors.length === 0)
await fs.writeFile(
  '/workspace/GptTest/artifacts/reviews/civic-results.json',
  JSON.stringify({ site: 'civic', results, errors, posts }, null, 2),
)
console.log(JSON.stringify({ passed: results.length, errors }, null, 2))
await browser.close()
