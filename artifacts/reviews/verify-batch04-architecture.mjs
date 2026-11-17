import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
  acceptDownloads: true,
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
const checks = [],
  errors = [],
  posts = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('request', (r) => {
  if (r.method() === 'POST') posts.push(r.url())
})
const pass = (name) => {
  checks.push({ name, result: 'passed' })
  console.log('PASS ' + name)
}
try {
  await page.goto('http://127.0.0.1:4173/architecture/')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.locator('h1').count(), 1)
    assert.deepEqual(
      await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
        return ids.filter((id, i) => ids.indexOf(id) !== i)
      }),
      [],
    )
    await page.screenshot({
      path: `artifacts/reviews/batch04-architecture-${width}-after.png`,
      fullPage: true,
    })
    pass(`architecture ${width}px layout and unique SVG IDs`)
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  const next = page.getByRole('button', { name: '下一个建筑项目', exact: true })
  for (const [id, title] of [
    ['02', 'A Place for Light'],
    ['03', 'Between Land & Sea'],
    ['04', 'Under One Roof'],
    ['01', 'The Quiet Courtyard'],
  ]) {
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.hero-index')).toHaveText(`${id} / 04`)
    await expect(page.locator('.hero-information')).toContainText(title)
  }
  await page.getByRole('button', { name: '上一个建筑项目', exact: true }).click()
  await expect(page.locator('.hero-index')).toHaveText('04 / 04')
  await expect(page.locator('.hero-image > svg')).toHaveAttribute('aria-label', /同一屋檐下/)
  pass('architecture hero cycles four projects with synchronized image, index and title')

  for (const [name, count] of [
    ['居住', 2],
    ['文化', 1],
    ['公共', 1],
    ['全部', 4],
  ]) {
    await page
      .getByRole('group', { name: '项目类别' })
      .getByRole('button', { name: new RegExp(name) })
      .click()
    await expect(page.locator('.project')).toHaveCount(count)
  }
  assert.equal(await page.locator('.project-gallery').count(), 1)
  const gallery = await page
    .locator('.project')
    .nth(1)
    .evaluate((el) => ({
      display: getComputedStyle(el).display,
      image: el.querySelector('.project-image').getBoundingClientRect().width,
      article: el.getBoundingClientRect().width,
    }))
  assert.equal(gallery.display, 'block')
  assert(Math.abs(gallery.image - gallery.article) < 1)
  pass('architecture categories return 2/1/1/4 and gallery scene does not inherit container grid')

  const trigger = page.getByRole('button', { name: '了解静庭项目', exact: true })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'The Quiet Courtyard 静庭' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('286 m²')
  await expect(dialog).toContainText('清水混凝土 / 橡木 / 玻璃')
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
  const close = dialog.getByRole('button', { name: '关闭项目详情' })
  const handoff = dialog.getByRole('link', { name: '开始你的空间简报' })
  await handoff.focus()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(handoff).toBeFocused()
  await dialog.locator('.detail-content').click({ position: { x: 4, y: 4 } })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  assert.equal(await page.evaluate(() => document.body.style.overflow), '')
  pass('architecture named modal has valid content, body lock, focus wrap and Escape restoration')

  await trigger.click()
  await handoff.click()
  await expect(page.getByRole('combobox', { name: '项目方向', exact: true })).toBeFocused()
  await expect(dialog).not.toBeVisible()
  pass('architecture detail-to-brief link transfers keyboard focus to project direction')

  for (const note of await page.locator('.notes summary').all()) {
    await note.focus()
    await page.keyboard.press('Enter')
    await expect(note.locator('..')).toHaveAttribute('open', '')
    assert((await note.locator('..').locator('.note-body p').innerText()).length > 20)
    await page.keyboard.press('Enter')
  }
  pass('architecture three field notes expose real content with keyboard controls')

  const location = page.getByLabel('项目地点', { exact: true })
  const idea = page.getByLabel('关于这个空间，你有什么想法？', { exact: true })
  const submit = page.getByRole('button', { name: '生成项目简报', exact: true })
  let downloads = 0
  page.on('download', () => downloads++)
  await submit.click()
  assert(await location.evaluate((el) => !el.checkValidity()))
  await location.fill('   ')
  await idea.fill('           ')
  await submit.click()
  await expect(page.getByRole('alert')).toContainText('地点')
  await expect(page.getByRole('alert')).toBeFocused()
  await location.fill(' 杭州 ')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await submit.click()
  await expect(page.getByRole('alert')).toContainText('至少 8')
  assert.equal(downloads, 0)
  pass('architecture required and whitespace-only inputs cannot export empty briefs')

  await page.getByRole('combobox', { name: '项目方向', exact: true }).selectOption('文化与艺术空间')
  await page.getByRole('combobox', { name: '预估面积', exact: true }).selectOption('300–1000 m²')
  await idea.fill(' 希望创造一个可以阅读和举办小型展览的社区空间。 ')
  const downloadPromise = page.waitForEvent('download')
  await submit.click()
  const download = await downloadPromise
  assert.equal(download.suggestedFilename(), 'still-project-brief.md')
  const text = await readFile(await download.path(), 'utf8')
  for (const value of [
    '项目方向：文化与艺术空间',
    '预估面积：300–1000 m²',
    '项目地点：杭州\n',
    '希望创造一个可以阅读和举办小型展览的社区空间。',
    '未发送给任何事务所',
    '不代表已建成建筑',
  ])
    assert(text.includes(value))
  await expect(page.getByRole('status')).toContainText('简报已下载')
  await location.fill('苏州')
  await expect(page.getByRole('status')).not.toContainText('已下载')
  assert.deepEqual(posts, [])
  assert.equal(await page.evaluate(() => localStorage.length), 0)
  pass(
    'architecture actual Markdown contains chosen fields, trimmed content and local-only boundary',
  )

  await page.reload()
  await page.setViewportSize({ width: 390, height: 900 })
  await page.getByRole('button', { name: '打开导航', exact: true }).click()
  await expect(page.getByRole('button', { name: '关闭导航', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: /作品/ }).click()
  await expect(page.getByRole('button', { name: '打开导航', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(location).toHaveValue('')
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    'auto',
  )
  assert.deepEqual(errors, [])
  pass(
    'architecture mobile menu closes on navigation; form is ephemeral; reduced motion and no exceptions',
  )
} finally {
  await writeFile(
    'artifacts/reviews/batch04-architecture-results.json',
    JSON.stringify({ date: '2026-11-17', checks, errors, posts }, null, 2),
  )
  await browser.close()
}
