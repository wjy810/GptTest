import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
})
const result = {
  url: 'http://127.0.0.1:4173/swiss/',
  browser: 'Chromium; no iOS device claim',
  checks: [],
  measurements: [],
  errors: [],
}
async function check(name, callback) {
  await callback()
  result.checks.push({ name, pass: true })
}
function measurePosters() {
  return [...document.querySelectorAll('.exhibition-card .exhibition-poster')].map((poster) => {
    const outer = poster.getBoundingClientRect()
    const label = poster.querySelector('.poster-bottom').getBoundingClientRect()
    const art = poster.querySelector('.order-grid, .type-art, .motion-art').getBoundingClientRect()
    return {
      class: poster.className,
      titleBottomGap: outer.bottom - label.bottom,
      artToTitleGap: label.top - art.bottom,
    }
  })
}
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    })
    page.on('pageerror', (error) => result.errors.push(error.message))
    await page.goto(result.url)
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `artifacts/optimization/swiss-${width}-after.png`,
      fullPage: true,
    })
    const measurements = await page.evaluate(() => {
      const selectors = [
        '.exhibition-index strong',
        '.exhibition-index small',
        '.exhibition-intro',
        '.exhibition-artist',
        '.schedule-time time',
        '.schedule-time > span',
        '.event-type',
        '.schedule-main h3',
        '.schedule-location',
        '.ticket-option p',
        '.ticket-disclaimer',
        '.ticket-settings select',
      ]
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        heroHeight: document.querySelector('.hero').getBoundingClientRect().height,
        fonts: selectors.map((selector) => ({
          selector,
          font: getComputedStyle(document.querySelector(selector)).fontSize,
        })),
        controls: [
          '.mobile-menu',
          '.header-ticket',
          '.exhibition-name',
          '.date-tabs button',
          '.ticket-settings select',
          '.quantity-control button',
          '.book-button',
        ].map((selector) => {
          const el = document.querySelector(selector),
            rect = el.getBoundingClientRect()
          return {
            selector,
            width: rect.width,
            height: rect.height,
            font: getComputedStyle(el).fontSize,
          }
        }),
        heroText: (() => {
          const el = document.querySelector('.hero h1'),
            range = document.createRange()
          range.selectNodeContents(el)
          return [...range.getClientRects()].map((r) => ({
            left: r.left,
            right: r.right,
            width: r.width,
          }))
        })(),
      }
    })
    result.measurements.push(measurements)
    await check(`${width}: no page overflow or clipped hero text`, async () => {
      expect(measurements.scrollWidth).toBe(width)
      expect(measurements.heroText.every((r) => r.left >= 0 && r.right <= width)).toBe(true)
    })
    await check(`${width}: three exhibition cards and three current events`, async () => {
      await expect(page.locator('.exhibition-card')).toHaveCount(3)
      await expect(page.locator('.schedule-row')).toHaveCount(3)
    })
    measurements.posters = await page.evaluate(measurePosters)
    await check(`${width}: poster titles stay inside artwork and clear its graphics`, async () => {
      expect(measurements.posters.every((p) => p.titleBottomGap >= 0 && p.artToTitleGap >= 0)).toBe(
        true,
      )
    })
    await check(`${width}: key interactive touch targets at least 44px`, async () => {
      expect(
        measurements.controls
          .filter((c) => c.width > 0)
          .every((c) => c.height >= 44 && c.width >= 44),
      ).toBe(true)
    })
    if (width < 700) {
      await check(`${width}: native select computes 16px`, async () => {
        await expect(page.locator('.ticket-settings select')).toHaveCSS('font-size', '16px')
      })
      await check(`${width}: menu Escape on button and navigation restores focus`, async () => {
        const menu = page.getByRole('button', { name: '导航菜单' })
        await menu.click()
        await expect(menu).toHaveAttribute('aria-expanded', 'true')
        await menu.press('Escape')
        await expect(menu).toHaveAttribute('aria-expanded', 'false')
        await menu.click()
        await page.getByRole('navigation').getByRole('link').first().focus()
        await page.keyboard.press('Escape')
        await expect(menu).toHaveAttribute('aria-expanded', 'false')
        await expect(menu).toBeFocused()
      })
    }
    const first = page.locator('#tab-18')
    await check(
      `${width}: arrow and Home/End dates update selection, focus and results`,
      async () => {
        await first.focus()
        for (const [key, date, title] of [
          ['ArrowRight', '19', '运动图形的节奏练习'],
          ['End', '20', '慢一点，才能看见'],
          ['ArrowRight', '18', '开场：秩序是一种选择'],
          ['ArrowLeft', '20', '慢一点，才能看见'],
          ['Home', '18', '开场：秩序是一种选择'],
        ]) {
          await page.keyboard.press(key)
          await expect(page.locator(`#tab-${date}`)).toBeFocused()
          await expect(page.locator(`#tab-${date}`)).toHaveAttribute('aria-selected', 'true')
          await expect(page.getByRole('tab', { selected: true })).toHaveCount(1)
          await expect(page.locator('.schedule-row')).toHaveCount(3)
          await expect(page.locator('.schedule-main h3').first()).toHaveText(title)
          await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', `tab-${date}`)
        }
      },
    )
    await check(
      `${width}: exhibition Enter, dialog Tab cycle, Escape and restored focus`,
      async () => {
        const trigger = page.getByRole('button', { name: '查看秩序的另一面展览详情' })
        await trigger.focus()
        await page.keyboard.press('Enter')
        const dialog = page.getByRole('dialog', { name: '秩序的另一面' })
        await expect(dialog).toBeVisible()
        const close = dialog.getByRole('button', { name: '关闭展览详情' })
        await expect(close).toBeFocused()
        await close.press('Shift+Tab')
        await expect(dialog.getByRole('link', { name: '选择通行证' })).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(close).toBeFocused()
        await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
        await expect(trigger).toBeFocused()
        await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
      },
    )
    await check(`${width}: detail ticket link hands focus to selected radio`, async () => {
      await page.getByRole('button', { name: '查看字，无边界展览详情' }).click()
      await page.getByRole('dialog').getByRole('link', { name: '选择通行证' }).click()
      await expect(page.locator('.ticket-option input:checked')).toBeFocused()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
    await check(
      `${width}: full pass two people totals 316 with date disabled and honest summary`,
      async () => {
        await page.locator('input[value="full"]').check()
        await page.getByRole('button', { name: '增加人数' }).click()
        await expect(page.locator('.ticket-total strong')).toHaveText('¥316')
        await expect(page.locator('.ticket-settings select')).toBeDisabled()
        await page.getByRole('button', { name: '查看预约摘要' }).click()
        const dialog = page.getByRole('dialog', { name: '好奇心，已就位。' })
        await expect(dialog).toContainText('2026.12.18—20')
        await expect(dialog).toContainText('2 人')
        await expect(dialog).toContainText('¥316')
        await expect(dialog).toContainText('尚未进行任何支付或真实预约')
        const close = dialog.getByRole('button', { name: '关闭预约摘要' })
        await close.press('Shift+Tab')
        await expect(dialog.getByRole('button', { name: '继续探索' })).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(close).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('button', { name: '查看预约摘要' })).toBeFocused()
      },
    )
    await check(`${width}: day pass, date 19 and two people totals 136`, async () => {
      await page.locator('input[value="day"]').check()
      await page.locator('.ticket-settings select').selectOption('19')
      await expect(page.locator('.ticket-total strong')).toHaveText('¥136')
      await page.getByRole('button', { name: '查看预约摘要' }).click()
      const dialog = page.getByRole('dialog', { name: '好奇心，已就位。' })
      await expect(dialog).toContainText('2026.12.19')
      await expect(dialog).toContainText('¥136')
      const box = await dialog.boundingBox()
      await page.mouse.click(box.x + 8, box.y + 8)
      await expect(dialog).toBeVisible()
      await page.mouse.click(2, 2)
      await expect(dialog).not.toBeVisible()
    })
    await check(
      `${width}: quantity constrained 1 to 6 and remains derived from ticket`,
      async () => {
        await page.getByRole('button', { name: '减少人数' }).click()
        await expect(page.getByRole('button', { name: '减少人数' })).toBeDisabled()
        for (let i = 1; i < 6; i++) await page.getByRole('button', { name: '增加人数' }).click()
        await expect(page.getByRole('button', { name: '增加人数' })).toBeDisabled()
        await expect(page.locator('.ticket-total strong')).toHaveText('¥408')
      },
    )
    await check(`${width}: reduced motion avoids smooth scroll`, async () => {
      await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
    })
    await page.close()
  }
  const narrowDesktop = await browser.newPage({ viewport: { width: 701, height: 900 } })
  await narrowDesktop.goto(result.url)
  const posters = await narrowDesktop.evaluate(measurePosters)
  result.narrowDesktopPosters = posters
  await check(
    '701: narrow three-column posters keep graphic and title bounds separate',
    async () => {
      expect(posters.every((p) => p.titleBottomGap >= 0 && p.artToTitleGap >= 0)).toBe(true)
    },
  )
  await narrowDesktop
    .locator('.exhibition-grid')
    .screenshot({ path: 'artifacts/optimization/swiss-701-posters.png' })
  await narrowDesktop.close()
  await check('No browser script errors across three viewports', async () =>
    expect(result.errors).toEqual([]),
  )
  result.passed = result.checks.length
} catch (error) {
  result.failure = error.message
  throw error
} finally {
  await fs.writeFile('artifacts/optimization/swiss-results.json', JSON.stringify(result, null, 2))
  await browser.close()
  console.log(
    JSON.stringify({
      passed: result.checks.length,
      failure: result.failure,
      measurements: result.measurements.map((m) => ({
        width: m.width,
        scrollWidth: m.scrollWidth,
        heroHeight: m.heroHeight,
      })),
    }),
  )
}
