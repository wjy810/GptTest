import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const url = process.env.FINTECH_URL || 'http://127.0.0.1:4173/fintech/'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
const page = await context.newPage()
const results = [], errors = [], mutatingRequests = []
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) mutatingRequests.push({ method: request.method(), url: request.url() }) })
const check = (group, name, passed) => { results.push({ group, name, passed: Boolean(passed) }); if (!passed) throw new Error(`${group}: ${name}`) }
const focused = locator => locator.evaluate(el => document.activeElement === el)
const settleFocus = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const button = name => page.getByRole('button', { name, exact: true })
const currency = (value, digits = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
const displayedNumber = text => Number(text.replace(/[^0-9.\-]/g, ''))
const symbols = () => page.locator('.asset-name b').allTextContents()
const allSymbols = ['AURA', 'MWLD', 'NOVA', 'FLUX', 'BOND', 'ORBT']
const cases = {
  '1W': { firstDate: '2026-11-11', first: 125380, baselineFirst: 125380, lastBaseline: 127250, rows: 7 },
  '1M': { firstDate: '2026-10-18', first: 119600, baselineFirst: 119600, lastBaseline: 124570, rows: 11 },
  '3M': { firstDate: '2026-08-17', first: 113200, baselineFirst: 113200, lastBaseline: 121400, rows: 12 },
  '1Y': { firstDate: '2025-11-17', first: 98400, baselineFirst: 98400, lastBaseline: 116200, rows: 12 },
}
try {
  await page.goto(url)
  check('watchlist', 'initial default contains AURA and MWLD only', await button('取消关注 AURA').getAttribute('aria-pressed') === 'true' && await button('取消关注 MWLD').getAttribute('aria-pressed') === 'true' && await page.locator('.watch-button.watched').count() === 2)
  check('market', 'initial market has all six sample assets', JSON.stringify(await symbols()) === JSON.stringify(allSymbols))
  await page.locator('.chart-data summary').click()
  const paths = new Set()
  for (const [range, expected] of Object.entries(cases)) {
    await button(range).click()
    check('chart', `${range} selection, title and caption synchronize`, await button(range).getAttribute('aria-pressed') === 'true' && (await page.locator('#chart-title').textContent()).startsWith(range) && (await page.locator('.chart-data caption').innerText()).startsWith(range))
    const rows = await page.locator('.chart-data tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent)))
    check('chart', `${range} date bounds and table row count match sample`, rows.length === expected.rows && rows[0][0] === expected.firstDate && rows.at(-1)[0] === '2026-11-17')
    check('chart', `${range} table includes correct opening, ending and baseline values`, rows[0][1] === currency(expected.first) && rows.at(-1)[1] === currency(128430.65) && rows[0][2] === currency(expected.baselineFirst) && rows.at(-1)[2] === currency(expected.lastBaseline))
    const delta = 128430.65 - expected.first
    const pct = `+${(delta / expected.first * 100).toFixed(2)}%`
    check('chart', `${range} summary cards and textual delta agree`, (await page.locator('.chart-bottom').innerText()).includes(currency(delta)) && (await page.locator('.chart-bottom').innerText()).includes(pct) && (await page.locator('.metric-card').nth(1).innerText()).includes(currency(delta).slice(1)) && (await page.locator('.primary-metric').innerText()).includes(pct))
    const path = await page.locator('.chart-area path[stroke="#ace6c8"]').getAttribute('d')
    paths.add(path)
    const points = [...path.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map(match => [Number(match[1]), Number(match[2])])
    const dates = rows.map(row => Date.parse(`${row[0]}T00:00:00Z`))
    check('chart', `${range} plot has one point per row and uses elapsed-date x spacing`, points.length === expected.rows && points.every((point, index) => Math.abs((point[0] - points[0][0]) / (points.at(-1)[0] - points[0][0]) - (dates[index] - dates[0]) / (dates.at(-1) - dates[0])) < 0.000001))
    const downloadEvent = page.waitForEvent('download')
    await button('导出当前周期演示数据CSV').click()
    const download = await downloadEvent
    const file = `artifacts/reviews/batch04-mono-${range}.csv`
    await download.saveAs(file)
    const csv = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '').trim().split('\n').map(line => line.split(','))
    check('export', `${range} real CSV download name, header, dates and every value match table`, download.suggestedFilename() === `mono-demo-${range}.csv` && csv[0].join(',') === '日期,演示组合_USD,演示基准_USD' && csv.length === rows.length + 1 && rows.every((row, i) => csv[i + 1][0] === row[0] && currency(Number(csv[i + 1][1])) === row[1] && currency(Number(csv[i + 1][2])) === row[2]))
  }
  check('chart', 'all four ranges produce different portfolio paths', paths.size === 4)
  const comparison = button('模拟基准')
  await comparison.click()
  check('chart', 'comparison toggle hides only benchmark curve', await comparison.getAttribute('aria-pressed') === 'false' && await page.locator('.chart-area path[stroke="#9e8ee9"]').count() === 0 && await page.locator('.chart-area path[stroke="#ace6c8"]').count() === 1)
  await comparison.click()
  check('chart', 'benchmark curve can be restored', await comparison.getAttribute('aria-pressed') === 'true' && await page.locator('.chart-area path[stroke="#9e8ee9"]').count() === 1)

  await button('股票').click()
  check('market', 'stock category shows AURA and FLUX', JSON.stringify(await symbols()) === JSON.stringify(['AURA', 'FLUX']))
  await page.getByRole('textbox', { name: '搜索资产名称或代码' }).fill(' flux ')
  check('market', 'case insensitive trimmed search intersects with category', JSON.stringify(await symbols()) === JSON.stringify(['FLUX']))
  await button('基金').click()
  check('market', 'mismatched search and category show empty recovery', await page.locator('.market-table tbody tr').count() === 0 && await page.getByRole('heading', { name: '没有找到匹配的资产' }).isVisible())
  await button('重置筛选').click()
  await settleFocus()
  check('focus', 'empty reset restores six assets and focuses market section', await page.locator('.market-table tbody tr').count() === 6 && await focused(page.locator('#market')))
  const search = page.getByRole('textbox', { name: '搜索资产名称或代码' })
  await search.fill('aurora')
  check('market', 'search also matches full asset names', JSON.stringify(await symbols()) === JSON.stringify(['AURA']))
  await button('清除资产搜索').click()
  await settleFocus()
  check('focus', 'clear restores input focus rather than body', await search.inputValue() === '' && await focused(search))
  await button('按涨幅降序排列').click()
  check('market', 'descending daily change sort is numeric and stable', JSON.stringify(await symbols()) === JSON.stringify(['AURA', 'FLUX', 'MWLD', 'BOND', 'ORBT', 'NOVA']))
  await button('恢复默认顺序').click()
  check('market', 'sort toggle restores original data order', JSON.stringify(await symbols()) === JSON.stringify(allSymbols))
  await button('取消关注 AURA').click()
  await page.reload()
  check('watchlist', 'removing one asset survives refresh', await button('关注 AURA').count() === 1 && await button('取消关注 MWLD').count() === 1)
  await page.getByRole('button', { name: /^我的关注/ }).click()
  check('watchlist', 'watchlist filter shows only saved asset', JSON.stringify(await symbols()) === JSON.stringify(['MWLD']))
  await button('清空本地关注').click()
  check('watchlist', 'clear writes empty array and shows recovery immediately', await page.evaluate(() => localStorage.getItem('mono-watchlist')) === '[]' && await page.locator('.market-table tbody tr').count() === 0)
  await page.reload()
  check('watchlist', 'empty watchlist does not resurrect defaults on reload', await page.locator('.watch-button.watched').count() === 0)
  await page.evaluate(() => localStorage.setItem('mono-watchlist', JSON.stringify(['FAKE', 'AURA', 123, null, 'AURA'])))
  await page.reload()
  check('watchlist', 'read drops unknown IDs, wrong types and duplicates', await page.locator('.watch-button.watched').count() === 1 && await button('取消关注 AURA').count() === 1)
  await page.evaluate(() => localStorage.setItem('mono-watchlist', '{broken'))
  await page.reload()
  check('watchlist', 'malformed JSON falls back to documented initial watchlist', await page.locator('.watch-button.watched').count() === 2)

  const monthly = page.locator('#monthly'), years = page.locator('#years'), rate = page.locator('#assumption')
  check('planner', 'range bounds and steps are explicit', await monthly.getAttribute('min') === '100' && await monthly.getAttribute('max') === '3000' && await monthly.getAttribute('step') === '50' && await years.getAttribute('min') === '1' && await years.getAttribute('max') === '30')
  for (const input of [{ monthly: 100, years: 1 }, { monthly: 3000, years: 30 }, { monthly: 500, years: 10 }]) {
    await monthly.fill(String(input.monthly)); await years.fill(String(input.years))
    for (const assumption of [-2, 0, 4, 8]) {
      await rate.selectOption(String(assumption))
      // An independent month-by-month ledger validates the implementation's closed formula.
      let balance = 0
      for (let month = 0; month < input.years * 12; month++) balance = balance * (1 + assumption / 100 / 12) + input.monthly
      const invested = input.monthly * input.years * 12
      const values = await page.locator('.projection-panel dd').allTextContents()
      const expectedChange = `${balance - invested >= 0 ? '+' : '−'}${currency(Math.abs(balance - invested), 0)}`
      check('planner', `${input.monthly}/month × ${input.years} years at ${assumption}% agrees with monthly ledger and breakdown`, await page.locator('.projection-value').innerText() === currency(balance, 0) && values[0] === currency(invested, 0) && values[1] === expectedChange && (await page.locator('.projection-caption').innerText()).includes(`${assumption}%`))
      check('planner', `${input.monthly}/month × ${input.years} years at ${assumption}% syncs overview and loss wording`, displayedNumber(await page.locator('.metric-card').nth(2).locator('.metric-value').innerText()) === input.monthly && (await page.locator('.projection-panel dt').nth(1).innerText()).includes(assumption < 0 ? '减少' : '增值'))
    }
  }
  await monthly.fill('100'); await monthly.focus(); await page.keyboard.press('ArrowLeft')
  check('planner', 'monthly keyboard decrement clamps to minimum', await monthly.inputValue() === '100')
  await years.fill('30'); await years.focus(); await page.keyboard.press('ArrowRight')
  check('planner', 'years keyboard increment clamps to maximum', await years.inputValue() === '30')
  await page.evaluate(() => localStorage.setItem('mono-watchlist', '[]'))
  const storageBefore = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))
  await button('标记这组模拟参数').click()
  check('planner', 'marking plan has explicit in-memory feedback', await button('已标记这组参数').count() === 1 && (await page.locator('.feedback-toast').innerText()).includes('仅保留于此页面'))
  check('planner', 'marking plan does not write storage', await page.evaluate(() => JSON.stringify(Object.entries(localStorage))) === storageBefore)
  await monthly.fill('150')
  check('planner', 'editing invalidates previous plan marker', await button('标记这组模拟参数').count() === 1)
  await button('标记这组模拟参数').click(); await page.reload()
  check('planner', 'refresh resets marker and all planner values', await monthly.inputValue() === '500' && await years.inputValue() === '10' && await rate.inputValue() === '4' && await button('标记这组模拟参数').count() === 1)

  await button('查看演示通知').click(); await settleFocus()
  check('notifications', 'panel opens and focuses dismiss control', await page.locator('.notification-panel').isVisible() && await focused(button('关闭通知')))
  await page.keyboard.press('Escape'); await settleFocus()
  check('notifications', 'Escape closes notifications and returns bell focus', await page.locator('.notification-panel').count() === 0 && await focused(button('查看演示通知')))
  await button('查看演示通知').click(); await button('关闭通知').click(); await settleFocus()
  check('notifications', 'close button returns focus to bell', await focused(button('查看演示通知')))
  await page.locator('.notes-panel summary').click()
  check('content', 'data explanation states local data and annuity formula', (await page.locator('.notes-panel details').innerText()).includes('月末投入终值') && (await page.locator('.notes-panel details').innerText()).includes('规划参数只存于页面内存'))
  await page.locator('.notes-panel summary').click()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    await page.goto(url)
    check('layout', `${width}px viewport has no document horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    check('layout', `${width}px chart keeps its SVG in visible panel bounds`, await page.locator('.chart-area>svg').evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth }))
    if (width < 700) {
      await button('打开导航').click(); await settleFocus()
      check('navigation', `${width}px drawer opens and focuses first navigation link`, await page.locator('.sidebar').isVisible() && await focused(page.getByRole('navigation', { name: '工作台导航' }).getByRole('link', { name: '资产概览', exact: true })))
      await page.keyboard.press('Escape'); await settleFocus()
      check('navigation', `${width}px Escape closes sidebar and restores toggle focus`, !await page.locator('.sidebar').isVisible() && await focused(button('打开导航')))
      await button('打开导航').click(); await page.getByRole('navigation', { name: '工作台导航' }).getByRole('link', { name: '市场观察', exact: true }).click(); await settleFocus()
      check('navigation', `${width}px navigation reaches market and transfers focus out of hidden sidebar`, !await page.locator('.sidebar').isVisible() && await focused(page.locator('#market')))
      await button('新建模拟规划').click(); await settleFocus()
      check('navigation', `${width}px primary action focuses planner`, await focused(page.locator('#planner')))
      check('layout', `${width}px asset table scroll is contained locally`, await page.locator('.market-table-wrap').evaluate(element => element.scrollWidth > element.clientWidth && getComputedStyle(element).overflowX === 'auto'))
      check('accessibility', `${width}px table has visible scroll instruction and keyboard region`, await page.locator('.table-scroll-hint').isVisible() && await page.getByRole('region', { name: '演示资产表，可横向滚动' }).getAttribute('tabindex') === '0')
      await page.locator('.market-table-wrap').focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(180)
      check('accessibility', `${width}px focused table scrolls with direction key`, await page.locator('.market-table-wrap').evaluate(element => element.scrollLeft > 0))
    }
    await page.goto(url)
    await page.screenshot({ path: `artifacts/reviews/batch04-fintech-${width}-after.png`, fullPage: true })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  check('accessibility', 'reduced motion disables smooth scrolling', await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'))
  const blocked = await browser.newPage()
  await blocked.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Blocked', 'SecurityError') } })
  await blocked.goto(url)
  await blocked.getByRole('button', { name: '关注 NOVA', exact: true }).click()
  check('watchlist', 'write denial preserves in-memory update and announces non-persistence', await blocked.getByRole('button', { name: '取消关注 NOVA', exact: true }).count() === 1 && (await blocked.locator('.feedback-toast').innerText()).includes('浏览器存储不可用，仅当前页面有效'))
  await blocked.getByRole('button', { name: '清空本地关注', exact: true }).click()
  check('watchlist', 'clear denial still clears session and states persisted data was not cleared', await blocked.locator('.watch-button.watched').count() === 0 && (await blocked.locator('.feedback-toast').innerText()).includes('未能清除持久数据'))
  check('privacy', 'no POST or other mutating network requests', mutatingRequests.length === 0)
  check('runtime', 'no uncaught browser errors', errors.length === 0)
} catch (error) {
  errors.push(String(error))
  await page.screenshot({ path: 'artifacts/reviews/batch04-fintech-failure.png', fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  const report = { site: 'fintech', target: url, testedAt: new Date().toISOString(), passed: results.filter(result => result.passed).length, total: results.length, results, errors, mutatingRequests }
  await writeFile('artifacts/reviews/batch04-fintech-results.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ passed: report.passed, total: report.total, errors }))
  await browser.close()
}
