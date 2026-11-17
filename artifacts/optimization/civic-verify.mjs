import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const metrics = []
for (const width of [1440, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:4173/civic/')
  const measured = await page.evaluate(() => {
    const metric = (s) =>
      [...document.querySelectorAll(s)].map((el) => {
        const r = el.getBoundingClientRect()
        return { width: r.width, height: r.height, font: getComputedStyle(el).fontSize }
      })
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      quickLinks: metric('.quick-links button,.quick-links a'),
      search: metric('.hero-search input'),
      form: metric('.booking-panel input:not([type=checkbox]),.booking-panel select'),
      tabs: metric('.category-tabs button'),
      serviceTop: document.querySelector('#services').getBoundingClientRect().top,
      filtersFit: [...document.querySelectorAll('.category-tabs button')].every((el) => {
        const r = el.getBoundingClientRect()
        return r.left >= 0 && r.right <= innerWidth
      }),
      formOverflow: [
        ...document.querySelectorAll(
          '.booking-panel input:not([type=checkbox]),.booking-panel select',
        ),
      ].filter((el) => el.scrollWidth > el.clientWidth + 1).length,
    }
  })
  assert.ok(measured.documentWidth <= width, 'no page overflow')
  assert.ok(
    measured.quickLinks.every((link) => link.width >= 44 && link.height >= 44),
    'comfortable quick-link target boxes',
  )
  assert.ok(measured.filtersFit, 'all service categories visible in viewport')
  assert.equal(measured.formOverflow, 0, 'form controls do not clip internally')
  if (width < 760) {
    assert.equal(measured.search[0].font, '16px')
    assert.ok(measured.form.length === 5 && measured.form.every((field) => field.font === '16px'))
  }
  metrics.push(measured)
  await page.screenshot({ path: `artifacts/optimization/civic-${width}-after.png`, fullPage: true })
  await page.close()
}
const page = await browser.newPage({
  viewport: { width: 320, height: 900 },
  reducedMotion: 'reduce',
})
await page.clock.setFixedTime(new Date('2026-11-17T16:30:00Z'))
await page.goto('http://127.0.0.1:4173/civic/')
const search = page.getByRole('textbox', { name: '搜索城市服务' })
await search.fill('健康')
await page.getByRole('button', { name: '查找服务', exact: true }).click()
assert.equal(await page.locator('.service-card').count(), 1)
assert.ok(
  await page.locator('#services').evaluate((el) => el === document.activeElement),
  'search focuses results',
)
await page.getByRole('button', { name: '生活服务', exact: true }).click()
assert.equal(await page.locator('.service-card').count(), 0, 'query AND category remains active')
await page.getByRole('button', { name: '清除搜索 ×', exact: true }).click()
assert.ok(
  await search.evaluate((el) => el === document.activeElement),
  'clear restores search focus',
)
assert.equal(await page.locator('.service-card').count(), 2, 'clear leaves category intact')
await page.locator('.quick-links').getByRole('button', { name: '居住登记' }).click()
assert.equal(await page.locator('.service-card').count(), 1)
assert.equal(
  await page.getByRole('button', { name: '全部服务', exact: true }).getAttribute('aria-pressed'),
  'true',
  'quick search resets category',
)
await page.locator('.quick-links').getByRole('button', { name: '公共课堂' }).click()
assert.match(await page.locator('.service-card').innerText(), /学习与成长/)
await page.locator('.quick-links').getByRole('button', { name: '健康咨询' }).click()
const service = page.getByLabel('需要什么帮助？')
assert.equal(await service.inputValue(), 'health')
assert.ok(
  await service.evaluate((el) => el === document.activeElement),
  'health quick-link hands focus to service',
)
await page.getByLabel('如何称呼你').fill('示例访客')
await page.getByLabel('示例邮箱').fill('visitor@example.com')
const date = page.getByLabel('预约日期', { exact: true })
assert.equal(await date.getAttribute('min'), '2026-11-18')
await date.fill('2026-11-17')
await date.evaluate((el) => el.removeAttribute('min'))
await page.getByLabel('方便的时段').selectOption('09:00 – 10:00')
await page.getByRole('checkbox').check()
await page.getByRole('button', { name: '生成演示预约' }).click()
assert.match(await page.getByRole('alert').innerText(), /不能早于/)
assert.ok(
  await page.getByRole('alert').evaluate((el) => el === document.activeElement),
  'past-date error receives focus',
)
await date.fill('2026-11-18')
await page.getByRole('button', { name: '生成演示预约' }).click()
const summary = page.getByRole('region', { name: '本地预约摘要' })
assert.ok(await summary.isVisible())
assert.ok(await summary.evaluate((el) => el === document.activeElement))
assert.match(await summary.innerText(), /健康关怀/)
assert.match(await summary.innerText(), /仅本地确认 · 未发送/)
await browser.close()
await writeFile(
  'artifacts/optimization/civic-after-metrics.json',
  JSON.stringify(
    {
      metrics,
      flowChecks: [
        'query AND category and clear focus',
        'quick-link search/category reset and service focus',
        'past-date submit guard and error focus',
        'local summary and success focus',
      ],
    },
    null,
    2,
  ),
)
console.log(JSON.stringify({ metrics, flowChecks: '4 targeted flow groups passed' }, null, 2))
