import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const site = process.argv[2]
if (!['civic', 'architecture', 'fintech'].includes(site)) throw new Error('Pass one frozen site: civic / architecture / fintech')
const selectors = {
  civic: '.quick-links button,.quick-links a,.menu-toggle,.hero-search button,.category-tabs button',
  architecture: '.hero-controls button,.filters button,.intro-bottom > a,.brief-button',
  fintech: '.watch-button,.range-buttons button,.icon-button,.chart-legend button,.asset-tabs button',
}
const regionSelectors = {
  civic: '.hero-search,.quick-links,.booking-panel,.form-row',
  architecture: '.intro-bottom,.project-caption,.contact .form-row',
  fintech: '.metric-grid > *, .chart-controls, .range-buttons, .market-toolbar, .table-tools',
}
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] })
const result = { site, browser: 'Chromium', url: `http://127.0.0.1:4173/${site}/`, independent: true, views: [], checks: [], errors: [] }
async function check(name, action) { await action(); result.checks.push({ name, pass: true }) }
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true })
    page.on('pageerror', error => result.errors.push(error.message))
    await page.goto(result.url)
    await page.screenshot({ path: `artifacts/optimization/opt04-${site}-${width}.png`, fullPage: true })
    const view = await page.evaluate(({ targets, regions }) => {
      const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height } }
      const present = e => e.getBoundingClientRect().width > 0
      return {
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
        inputs: [...document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea')].filter(present).map(e => ({ tag: e.tagName, type: e.type, name: e.name, id: e.id, label: e.getAttribute('aria-label') || e.closest('label')?.textContent.trim().slice(0,80), font: getComputedStyle(e).fontSize, ...rect(e) })),
        targets: [...document.querySelectorAll(targets)].filter(present).map(e => ({ text: e.getAttribute('aria-label') || e.textContent.trim(), ...rect(e) })),
        regions: [...document.querySelectorAll(regions)].map(e => ({ class: e.className, clientWidth: e.clientWidth, scrollWidth: e.scrollWidth, ...rect(e) })),
      }
    }, { targets: selectors[site], regions: regionSelectors[site] })
    result.views.push(view)
    await check(`${width}: viewport, enlarged controls, native input scale and surrounding layout`, async () => {
      expect(view.scrollWidth).toBe(width)
      expect(view.inputs.every(e => parseFloat(e.font) >= 16 && e.height >= 44 && e.right <= width + 1 && e.x >= -1)).toBe(true)
      expect(view.targets.every(e => e.width >= 44 && e.height >= 44)).toBe(true)
      expect(view.regions.every(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    })
    if (site === 'fintech') await check(`${width}: all four chart periods have separated visible date labels`, async () => {
      view.chartDates = []
      for (const period of ['1W', '1M', '3M', '1Y']) {
        await page.getByRole('button', { name: period, exact: true }).click()
        const labels = await page.locator('.chart-area svg > text').evaluateAll(nodes => nodes.map(e => {
          const box = e.getBoundingClientRect()
          return { text: e.textContent, left: box.left, right: box.right, width: box.width, height: box.height }
        }).filter(e => e.width > 0 && e.height > 0))
        expect(labels.length).toBeGreaterThanOrEqual(3)
        const gaps = labels.slice(1).map((e, i) => e.left - labels[i].right)
        view.chartDates.push({ period, labels, gaps, minGap: Math.min(...gaps) })
        expect(Math.min(...gaps)).toBeGreaterThanOrEqual(6)
        expect(labels.every(e => e.left >= 0 && e.right <= width)).toBe(true)
      }
      await page.locator('.chart-area').screenshot({ path: `artifacts/optimization/opt04-fintech-${width}-chart.png` })
    })
    if (width === 320) {
      if (site === 'civic') await check('Keyboard search to prefilled service and local appointment summary', async () => {
        await page.locator('#city-search').fill('健康')
        await page.locator('#city-search').press('Enter')
        await expect(page.locator('.service-card')).toHaveCount(1)
        await page.locator('.service-card').focus(); await page.keyboard.press('Enter')
        await expect(page.locator('select[name="service"]')).toHaveValue('health')
        await expect(page.locator('select[name="service"]')).toBeFocused()
        await page.locator('input[name="name"]').fill('复核示例')
        await page.locator('input[name="email"]').fill('review@example.com')
        const date = await page.locator('input[name="date"]').getAttribute('min')
        await page.locator('input[name="date"]').fill(date)
        await page.locator('select[name="time"]').selectOption('10:00 – 11:00')
        await page.locator('input[name="acknowledge"]').check()
        await page.getByRole('button', { name: '生成演示预约' }).click()
        const summary = page.getByRole('region', { name: '本地预约摘要' })
        await expect(summary).toContainText('健康关怀')
        await expect(summary).toContainText('仅本地确认 · 未发送')
        await expect(summary).toBeFocused()
        await summary.screenshot({ path: 'artifacts/optimization/opt04-civic-summary.png' })
        await page.getByRole('button', { name: '重新安排' }).click()
        await expect(page.locator('select[name="service"]')).toBeFocused()
      })
      if (site === 'architecture') await check('Project filter and detail lead to a readable local brief download', async () => {
        await page.getByRole('button', { name: /居住/ }).filter({ hasText: '02' }).focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('.project-gallery .project')).toHaveCount(2)
        await page.getByRole('button', { name: '了解静庭项目' }).focus(); await page.keyboard.press('Enter')
        const modal = page.getByRole('dialog')
        await expect(modal).toContainText('The Quiet Courtyard')
        await modal.getByRole('link', { name: '开始你的空间简报' }).click()
        await expect(page.getByLabel('项目方向')).toBeFocused()
        await page.getByLabel('项目方向').selectOption('社区与公共空间')
        await page.getByLabel('预估面积').selectOption('300–1000 m²')
        await page.getByLabel('项目地点').fill('杭州 · 示例社区')
        await page.getByLabel('关于这个空间，你有什么想法？').fill('希望有可以阅读与休息的公共庭院，保留步行的空间。')
        await page.locator('#contact form').screenshot({ path: 'artifacts/optimization/opt04-architecture-form.png' })
        const pending = page.waitForEvent('download')
        await page.getByRole('button', { name: '生成项目简报' }).click()
        const downloaded = await pending
        const content = await fs.readFile(await downloaded.path(), 'utf8')
        for (const value of ['社区与公共空间', '300–1000 m²', '杭州 · 示例社区', '公共庭院', '未发送给任何事务所']) expect(content).toContain(value)
        await fs.writeFile('artifacts/optimization/opt04-still-brief.md', content)
        await expect(page.locator('.form-note')).toContainText('简报已下载')
      })
      if (site === 'fintech') await check('Keyboard period selection, matching CSV, local market scroll and scenario input', async () => {
        const range = page.getByRole('button', { name: '1W', exact: true })
        await range.focus(); await page.keyboard.press('Enter')
        await expect(range).toHaveAttribute('aria-pressed', 'true')
        await page.locator('.chart-data summary').focus(); await page.keyboard.press('Enter')
        await expect(page.locator('.chart-data caption')).toContainText('1W')
        await expect(page.locator('.chart-data tbody tr')).toHaveCount(7)
        const pending = page.waitForEvent('download')
        await page.getByRole('button', { name: '导出当前周期演示数据CSV' }).click()
        const downloaded = await pending
        const content = await fs.readFile(await downloaded.path(), 'utf8')
        expect(content).toContain('2026-11-11')
        expect(content).toContain('128430.65')
        await fs.writeFile('artifacts/optimization/opt04-mono-data.csv', content)
        const table = page.getByRole('region', { name: '演示资产表，可横向滚动' })
        const initial = await table.evaluate(e => ({ viewport: e.clientWidth, full: e.scrollWidth, left: e.scrollLeft }))
        expect(initial.full).toBeGreaterThan(initial.viewport)
        await table.focus(); await page.keyboard.press('ArrowRight')
        await expect.poll(() => table.evaluate(e => e.scrollLeft)).toBeGreaterThan(initial.left)
        result.marketScroll = { ...initial, after: await table.evaluate(e => e.scrollLeft) }
        await expect(page.locator('.market-table th')).toHaveCount(7)
        await page.getByRole('textbox', { name: '搜索资产名称或代码' }).fill('AURA')
        await expect(page.locator('.market-table tbody tr')).toHaveCount(1)
        await page.locator('#assumption').selectOption('0')
        const invested = await page.locator('.projection-panel dl dd').first().innerText()
        await expect(page.locator('.projection-value')).toHaveText(invested)
        await page.locator('.planner-grid').screenshot({ path: 'artifacts/optimization/opt04-fintech-planner.png' })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
      })
    }
    await page.close()
  }
  await check('No browser script errors during independent review', async () => expect(result.errors).toEqual([]))
  result.passed = result.checks.length
} catch (error) { result.failure = error.message; throw error }
finally { await fs.writeFile(`artifacts/optimization/opt04-${site}-results.json`, JSON.stringify(result, null, 2)); await browser.close(); console.log(JSON.stringify({ site, passed: result.checks.length, failure: result.failure })) }
