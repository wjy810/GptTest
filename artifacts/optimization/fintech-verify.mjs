import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({ reducedMotion: 'reduce', acceptDownloads: true })
const checks = [],
  measurements = [],
  errors = []
const check = (name, pass) => {
  checks.push({ name, pass: Boolean(pass) })
  if (!pass) throw new Error(name)
}
const button = (name) => page.getByRole('button', { name, exact: true })
page.on('pageerror', (error) => errors.push(error.message))

try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('http://127.0.0.1:4173/fintech/')
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      pageHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      items: [
        '.watch-button',
        '.range-buttons button',
        '.topbar-actions .icon-button',
        '.asset-search input',
        '.assumption-field select',
        '.formula-note p',
        '.market-footnote',
        '.chart-bottom',
        '.allocation-note',
        '.metric-footer',
        '.slider-field input',
      ].map((selector) => {
        const element = document.querySelector(selector),
          rect = element.getBoundingClientRect()
        return {
          selector,
          width: rect.width,
          height: rect.height,
          font: getComputedStyle(element).fontSize,
        }
      }),
      internalOverflows: [
        ...document.querySelectorAll(
          '.metric-card,.allocation-list,.planner-inputs,.chart-controls,.asset-search',
        ),
      ]
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.className),
    }))
    measurements.push(sizes)
    check(
      `${width}px document and compact panel bounds`,
      sizes.scrollWidth === width && sizes.internalOverflows.length === 0,
    )
    if (width < 700) {
      const touch = sizes.items.filter((item) =>
        [
          '.watch-button',
          '.range-buttons button',
          '.topbar-actions .icon-button',
          '.slider-field input',
        ].includes(item.selector),
      )
      const inputs = sizes.items.filter((item) =>
        ['.asset-search input', '.assumption-field select'].includes(item.selector),
      )
      check(
        `${width}px primary touch targets and 16px form text`,
        touch.every((item) => item.width >= 44 && item.height >= 44) &&
          inputs.every((item) => item.font === '16px' && item.height >= 44),
      )
      const rangeTicks = []
      for (const range of ['1W', '1M', '3M', '1Y']) {
        await button(range).click()
        const ticks = await page.locator('.chart-area svg > text').evaluateAll((elements) =>
          elements
            .filter((element) => getComputedStyle(element).display !== 'none')
            .map((element) => {
              const rect = element.getBoundingClientRect()
              return { text: element.textContent, left: rect.left, right: rect.right }
            }),
        )
        rangeTicks.push({ range, ticks })
      }
      sizes.dateTicks = rangeTicks
      check(
        `${width}px all four periods keep date labels separate`,
        rangeTicks.every(
          ({ ticks }) =>
            ticks.length === 3 &&
            ticks.every((tick, index) => !index || tick.left - ticks[index - 1].right >= 6),
        ),
      )
      await button('3M').click()
    }
    await page.mouse.move(0, 0)
    await page.locator('body').click({ position: { x: width - 2, y: 200 } })
    await page.screenshot({
      path: `artifacts/optimization/fintech-${width}-after.png`,
      fullPage: true,
    })
  }
  await button('1W').click()
  await page.locator('.chart-data summary').click()
  const rows = await page
    .locator('.chart-data tbody tr')
    .evaluateAll((elements) =>
      elements.map((element) =>
        [...element.querySelectorAll('td')].map((cell) => cell.textContent),
      ),
    )
  const downloadPromise = page.waitForEvent('download')
  await button('导出当前周期演示数据CSV').click()
  const download = await downloadPromise
  await download.saveAs('artifacts/optimization/fintech-1W.csv')
  const csv = (await readFile('artifacts/optimization/fintech-1W.csv', 'utf8'))
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\n')
    .map((line) => line.split(','))
  const money = (value, digits = 2) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)
  check(
    '1W bottom table and actual CSV match every date/value',
    rows.length === 7 &&
      rows[0][0] === '2026-11-11' &&
      rows.at(-1)[0] === '2026-11-17' &&
      download.suggestedFilename() === 'mono-demo-1W.csv' &&
      csv.length === rows.length + 1 &&
      rows.every(
        (row, index) =>
          row[0] === csv[index + 1][0] &&
          row[1] === money(Number(csv[index + 1][1])) &&
          row[2] === money(Number(csv[index + 1][2])),
      ),
  )

  await page.getByRole('textbox', { name: '搜索资产名称或代码' }).fill('NOVA')
  await button('关注 NOVA').focus()
  await page.keyboard.press('Enter')
  await button('清除资产搜索').click()
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  check(
    'Search, enlarged watch button and clear focus work',
    (await page.locator('.market-table tbody tr').count()) === 6 &&
      (await button('取消关注 NOVA').count()) === 1 &&
      (await page
        .getByRole('textbox', { name: '搜索资产名称或代码' })
        .evaluate((element) => element === document.activeElement)),
  )

  await page.locator('#monthly').focus()
  await page.keyboard.press('ArrowRight')
  await page.locator('#years').focus()
  await page.keyboard.press('ArrowRight')
  await page.locator('#assumption').selectOption('0')
  check(
    '44px sliders retain keyboard increments and zero-growth total',
    (await page.locator('#monthly').inputValue()) === '550' &&
      (await page.locator('#years').inputValue()) === '11' &&
      (await page.locator('.projection-value').innerText()) === '$72,600',
  )
  await page.locator('#assumption').selectOption('4')
  let balance = 0
  for (let month = 0; month < 132; month++) balance = balance * (1 + 0.04 / 12) + 550
  await button('标记这组模拟参数').click()
  check(
    'Readable assumption control retains monthly ledger and local marker',
    (await page.locator('.projection-value').innerText()) === money(balance, 0) &&
      (await button('已标记这组参数').count()) === 1 &&
      (await page.locator('.plan-local').innerText()).includes('仅保留在当前页面'),
  )
  check('No browser runtime errors', errors.length === 0)
} catch (error) {
  errors.push(String(error))
  process.exitCode = 1
} finally {
  const report = { browser: 'Chromium; no physical iOS test', checks, measurements, errors }
  await writeFile('artifacts/optimization/fintech-results.json', JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify({
      passed: checks.filter((check) => check.pass).length,
      total: checks.length,
      errors,
    }),
  )
  await browser.close()
}
