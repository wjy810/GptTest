import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const results = []
const check = (name, value) => {
  assert.ok(value, name)
  results.push({ name, passed: true })
}
const errors = []
for (const width of [1440, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:4173/editorial/')
  await page.waitForLoadState('networkidle')
  const metric = await page.evaluate(() => ({
    width: innerWidth,
    doc: document.documentElement.scrollWidth,
    hero: document.querySelector('.hero').getBoundingClientRect().height,
    lead: document.querySelector('.story-lead').getBoundingClientRect().width,
    summary: getComputedStyle(document.querySelector('.story-lead .story-copy > p')).fontSize,
    bodyOverflow: document.body.style.overflow,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
  }))
  check(`${width}: no horizontal overflow`, metric.doc <= width)
  check(`${width}: reduced motion disables smooth scrolling`, metric.scroll === 'auto')
  check(
    `${width}: visible named cover action`,
    (await page.getByRole('button', { name: '阅读本期封面故事' }).innerText()) === '阅读封面故事',
  )
  check(
    `${width}: four stories, one lead`,
    (await page.locator('.story').count()) === 4 &&
      (await page.locator('.story-lead').count()) === 1,
  )
  results.push({ name: `${width}: measured layout`, metric })
  await page.screenshot({
    path: `artifacts/optimization/editorial-${width}-after.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: '空间', exact: true }).click()
  check(
    `${width}: space filter retains two full stories`,
    (await page.locator('.story').count()) === 2 &&
      (await page.locator('.story-lead').count()) === 0,
  )
  await page.getByRole('button', { name: '全部', exact: true }).click()
  const trigger = page.getByRole('button', { name: '阅读本期封面故事' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const reader = page.getByRole('dialog', { name: '一间房子，如何盛放安静' })
  check(`${width}: named reader opens from keyboard`, await reader.isVisible())
  check(
    `${width}: background locked`,
    (await page.evaluate(() => document.body.style.overflow)) === 'hidden',
  )
  await reader.getByRole('button', { name: '关闭文章' }).focus()
  await page.keyboard.press('Shift+Tab')
  check(
    `${width}: reverse tab remains in reader`,
    await reader.locator('.reader-save').evaluate((el) => el === document.activeElement),
  )
  await page.keyboard.press('Tab')
  check(
    `${width}: forward tab cycles to close`,
    await reader.locator('.reader-close').evaluate((el) => el === document.activeElement),
  )
  if (width === 390) await reader.evaluate((el) => (el.scrollTop = 0))
  if (width === 390)
    await page.screenshot({ path: 'artifacts/optimization/editorial-reader-390-after.png' })
  await page.keyboard.press('Escape')
  check(
    `${width}: escape restores trigger and body scroll`,
    !(await reader.isVisible()) &&
      (await trigger.evaluate((el) => el === document.activeElement)) &&
      (await page.evaluate(() => document.body.style.overflow)) === '',
  )
  await page.close()
}
const page = await browser.newPage({
  viewport: { width: 390, height: 900 },
  reducedMotion: 'reduce',
})
page.on('pageerror', (error) => errors.push(error.message))
await page.addInitScript(() => {
  const original = Storage.prototype.setItem
  window.storageBlocked = true
  Storage.prototype.setItem = function (...args) {
    if (window.storageBlocked)
      throw new DOMException('Storage disabled for validation', 'QuotaExceededError')
    return original.apply(this, args)
  }
})
await page.goto('http://127.0.0.1:4173/editorial/')
await page.getByRole('button', { name: '收藏 一间房子，如何盛放安静', exact: true }).click()
check(
  'write denied: bookmark changes in current session',
  (await page.getByRole('button', { name: '已收藏 (1)', exact: true }).count()) === 1,
)
check(
  'write denied: no bookmark persisted',
  (await page.evaluate(() => localStorage.getItem('folio-saved'))) === null,
)
check(
  'write denied: visible warning describes refresh loss',
  (await page.locator('.storage-status').textContent()).includes('刷新后可能无法保留'),
)
await page.getByRole('button', { name: '已收藏 (1)', exact: true }).click()
check('write denied: session collection usable', (await page.locator('.story').count()) === 1)
await page.getByRole('button', { name: '阅读 一间房子，如何盛放安静', exact: true }).click()
check(
  'write denied: dialog also explains unsaved state',
  await page.locator('.reader .storage-status').isVisible(),
)
await page.keyboard.press('Escape')
await page.getByLabel('你的电子邮箱').fill('blocked@example.com')
await page.getByRole('button', { name: '保存订阅意向' }).click()
const feedback = page.locator('.letter [role=status]')
check(
  'write denied: newsletter honestly reports local failure',
  (await feedback.textContent()).includes('浏览器未能保存；演示站不会发送邮件'),
)
check(
  'write denied: no newsletter persisted',
  (await page.evaluate(() => localStorage.getItem('folio-newsletter-demo'))) === null,
)
await page.screenshot({
  path: 'artifacts/optimization/editorial-storage-failure-390.png',
  fullPage: true,
})
await page.reload()
check(
  'write denied: reloading does not falsely retain bookmark',
  (await page.getByRole('button', { name: '已收藏 (0)', exact: true }).count()) === 1,
)
await page.getByRole('button', { name: '收藏 一间房子，如何盛放安静', exact: true }).click()
await page.evaluate(() => (window.storageBlocked = false))
await page.getByRole('button', { name: '取消收藏 一间房子，如何盛放安静', exact: true }).click()
check(
  'storage recovers: warning clears after successful write',
  (await page.locator('.storage-status').count()) === 0,
)
await page.getByRole('button', { name: '收藏 一间房子，如何盛放安静', exact: true }).click()
await page.reload()
check(
  'storage recovers: bookmark survives refresh',
  (await page.getByRole('button', { name: '已收藏 (1)', exact: true }).count()) === 1,
)
await page.evaluate(() => (window.storageBlocked = false))
await page.getByLabel('你的电子邮箱').fill('saved@example.com')
await page.getByRole('button', { name: '保存订阅意向' }).click()
check(
  'storage recovers: newsletter saved with local-only feedback',
  (await feedback.textContent()).includes('订阅意向已保存在此浏览器。演示站不会发送邮件') &&
    (await page.evaluate(() => localStorage.getItem('folio-newsletter-demo'))) ===
      'saved@example.com',
)
await page.evaluate(() => localStorage.setItem('folio-saved', '["01","01",99,"unknown"]'))
await page.reload()
check(
  'bad storage: valid IDs deduplicated',
  (await page.getByRole('button', { name: '已收藏 (1)', exact: true }).count()) === 1,
)
await page.evaluate(() => {
  window.storageBlocked = false
  localStorage.setItem('folio-saved', '{}')
})
await page.reload()
check(
  'bad storage: object recovers to empty collection',
  (await page.getByRole('button', { name: '已收藏 (0)', exact: true }).count()) === 1,
)
check('no uncaught browser errors', errors.length === 0)
await browser.close()
await writeFile(
  'artifacts/optimization/editorial-results.json',
  JSON.stringify({ checks: results.filter((r) => r.passed).length, results, errors }, null, 2),
)
console.log(
  JSON.stringify(
    {
      checks: results.filter((r) => r.passed).length,
      metrics: results.filter((r) => r.metric),
      errors,
    },
    null,
    2,
  ),
)
