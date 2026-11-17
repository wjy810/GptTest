import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
})
const report = {
  browser: 'Chromium; no physical iOS test',
  checks: [],
  measurements: [],
  errors: [],
}
async function check(name, action) {
  await action()
  report.checks.push({ name, pass: true })
}
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      acceptDownloads: true,
    })
    page.on('pageerror', (error) => report.errors.push(error.message))
    await page.goto('http://127.0.0.1:4173/travel/')
    await page.screenshot({
      path: `artifacts/optimization/travel-${width}-after.png`,
      fullPage: true,
    })
    await page
      .locator('.destination-grid')
      .screenshot({ path: `artifacts/optimization/travel-${width}-destinations-after.png` })
    const m = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      planY: document.querySelector('#plan').getBoundingClientRect().top + scrollY,
      imageHeight: document.querySelector('.destination-image').getBoundingClientRect().height,
      cardGap: getComputedStyle(document.querySelector('.destination-grid')).rowGap,
      selectFont: getComputedStyle(document.querySelector('#destination')).fontSize,
      controls: [
        '.header-cta',
        '.menu-toggle',
        '.filters button',
        '.save-button',
        '.destination-title',
        '.destination-next .text-link',
        '#destination',
        '#trip-days',
        '.stepper button',
        '.plan-submit',
      ].map((selector) => {
        const e = document.querySelector(selector),
          r = e.getBoundingClientRect()
        return { selector, width: r.width, height: r.height }
      }),
    }))
    report.measurements.push(m)
    await check(`${width}px layout, planner entry and primary target sizes`, async () => {
      expect(m.scrollWidth).toBe(width)
      expect(
        m.controls.filter((c) => c.width > 0).every((c) => c.width >= 44 && c.height >= 44),
      ).toBe(true)
      if (width < 760) expect(m.selectFont).toBe('16px')
      await expect(page.locator('.destination-card')).toHaveCount(6)
      await expect(page.locator('.destination-next a')).toHaveAttribute('href', '#plan')
      await expect(page.locator('.budget-total strong')).toHaveText('¥6,600')
      await page.locator('.destination-next a').click()
      await expect(page).toHaveURL(/#plan$/)
      expect(
        await page.locator('#plan').evaluate((e) => e.getBoundingClientRect().top),
      ).toBeLessThan(100)
    })
    if (width === 390) {
      const group = page.getByRole('group', { name: '目的地分类' })
      await check('Destination category filters preserve content and selection', async () => {
        for (const [category, names] of [
          ['山野', ['川西', '大理']],
          ['海岛', ['万宁', '舟山']],
          ['城市', ['京都', '泉州']],
        ]) {
          await group.getByRole('button', { name: category, exact: true }).click()
          await expect(page.locator('.destination-card')).toHaveCount(2)
          await expect(group.getByRole('button', { name: category, exact: true })).toHaveAttribute(
            'aria-pressed',
            'true',
          )
          await expect(page.locator('.destination-title h3')).toHaveText(names)
        }
        await group.getByRole('button', { name: '全部', exact: true }).click()
      })
      await check(
        'Saved destinations persist after reload and recover from empty state',
        async () => {
          await page.getByRole('button', { name: '收藏川西', exact: true }).click()
          await group.getByRole('button', { name: /已收藏/ }).click()
          await expect(page.locator('.destination-title h3')).toHaveText(['川西'])
          await page.reload()
          await expect(
            page.getByRole('button', { name: '取消收藏川西', exact: true }),
          ).toHaveAttribute('aria-pressed', 'true')
          await group.getByRole('button', { name: /已收藏/ }).click()
          await page.getByRole('button', { name: '取消收藏川西', exact: true }).click()
          await expect(page.locator('.empty-state')).toBeVisible()
          await page.getByRole('button', { name: '探索全部目的地' }).click()
          await expect(page.locator('.destination-card')).toHaveCount(6)
        },
      )
      await check('Destination details hand selected place and focus to the planner', async () => {
        await page.getByRole('button', { name: '探索泉州', exact: true }).click()
        await expect(page.getByRole('dialog', { name: '去泉州，慢慢走。' })).toBeVisible()
        await page.getByRole('button', { name: '把这里放进行程' }).click()
        await expect(page.locator('#destination')).toHaveValue('quanzhou')
        await expect(page.locator('#destination')).toBeFocused()
        await expect(page.getByRole('dialog')).not.toBeVisible()
      })
      await check('Budget controls retain exact formulas and quantity bounds', async () => {
        await page.getByRole('button', { name: '减少人数' }).click()
        await expect(page.getByRole('button', { name: '减少人数' })).toBeDisabled()
        await page.locator('#trip-days').focus()
        await page.keyboard.press('Home')
        await expect(page.locator('#trip-days')).toHaveValue('2')
        await expect(page.locator('.budget-total strong')).toHaveText('¥1,230')
        for (let i = 1; i < 6; i++) await page.getByRole('button', { name: '增加人数' }).click()
        await expect(page.getByRole('button', { name: '增加人数' })).toBeDisabled()
        await page.locator('#trip-days').focus()
        await page.keyboard.press('End')
        await expect(page.locator('#trip-days')).toHaveValue('14')
        await expect(page.locator('.budget-total strong')).toHaveText('¥28,260')
        await page
          .locator('.planner-form')
          .screenshot({ path: 'artifacts/optimization/travel-390-planner-after.png' })
      })
      await check(
        'Actual Markdown download matches people, duration, budget and demo boundary',
        async () => {
          await page.getByRole('button', { name: '生成我的漫游草案' }).click()
          const dialog = page.getByRole('dialog', { name: '泉州，我们来了。' })
          await expect(dialog.locator('.day-list li')).toHaveCount(14)
          await expect(dialog.locator('.summary-budget strong')).toHaveText('¥28,260')
          const pending = page.waitForEvent('download')
          await dialog.getByRole('button', { name: '下载 Markdown 草案' }).click()
          const download = await pending
          expect(download.suggestedFilename()).toBe('roam-quanzhou-14days.md')
          const content = await fs.readFile(await download.path(), 'utf8')
          for (const expected of [
            '人数：6 人',
            '天数：14 天',
            '(¥290 × 14 + ¥650) × 6 = ¥28260',
            '第 14 天',
            '非实时报价',
            '只在浏览器本地生成',
          ])
            expect(content).toContain(expected)
          await fs.writeFile('artifacts/optimization/travel-downloaded-plan.md', content)
          await expect(dialog.getByRole('button', { name: '再次下载草案' })).toBeVisible()
          await page.keyboard.press('Escape')
          await expect(dialog).not.toBeVisible()
        },
      )
    }
    await page.close()
  }
  await check('No browser script errors', async () => expect(report.errors).toEqual([]))
  report.passed = report.checks.length
} catch (error) {
  report.failure = error.message
  throw error
} finally {
  await fs.writeFile('artifacts/optimization/travel-results.json', JSON.stringify(report, null, 2))
  await browser.close()
  console.log(
    JSON.stringify({
      passed: report.checks.length,
      failure: report.failure,
      layout: report.measurements.map((m) => ({
        width: m.width,
        planY: m.planY,
        height: m.pageHeight,
        image: m.imageHeight,
      })),
    }),
  )
}
