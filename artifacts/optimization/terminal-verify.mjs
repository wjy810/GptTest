import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
})
const report = {
  browser: 'Chromium; no physical iOS device test',
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
    })
    page.on('pageerror', (error) => report.errors.push(error.message))
    await page.goto('http://127.0.0.1:4173/terminal/')
    await page.screenshot({
      path: `artifacts/optimization/terminal-${width}-after.png`,
      fullPage: true,
    })
    await page
      .locator('.workspace')
      .screenshot({ path: `artifacts/optimization/terminal-${width}-workspace-after.png` })
    const metrics = await page.evaluate(() => {
      const range = document.createRange()
      range.selectNodeContents(document.querySelector('.hero-heading h1'))
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        heroText: [...range.getClientRects()].map((r) => ({ left: r.left, right: r.right })),
        details: [
          '#command-input',
          '.terminal-input',
          '.terminal-input > button',
          '.terminal-content',
          '.terminal-lines > div',
          '.hero-description > p',
          '.compatibility > p',
        ].map((selector) => {
          const e = document.querySelector(selector),
            c = getComputedStyle(e),
            r = e.getBoundingClientRect()
          return {
            selector,
            font: c.fontSize,
            lineHeight: c.lineHeight,
            width: r.width,
            height: r.height,
            color: c.color,
          }
        }),
        terminal: (() => {
          const e = document.querySelector('.terminal-content')
          return {
            scrollWidth: e.scrollWidth,
            clientWidth: e.clientWidth,
            scrollHeight: e.scrollHeight,
            clientHeight: e.clientHeight,
            scrollTop: e.scrollTop,
          }
        })(),
      }
    })
    report.measurements.push(metrics)
    await check(
      `${width}px layout, readable command controls and honest integration copy`,
      async () => {
        expect(metrics.scrollWidth).toBe(width)
        expect(metrics.heroText.every((r) => r.left >= 0 && r.right <= width)).toBe(true)
        expect(metrics.terminal.scrollWidth).toBeLessThanOrEqual(metrics.terminal.clientWidth)
        expect(metrics.terminal.scrollTop).toBe(0)
        await expect(page.locator('#command-input')).toHaveCSS('font-size', '16px')
        for (const selector of ['#command-input', '.terminal-input > button']) {
          const box = await page.locator(selector).boundingBox()
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
        await expect(page.locator('.terminal-lines > div').first()).toHaveCSS('font-size', '12px')
        await expect(page.locator('.hero-description > p')).toHaveCSS('font-size', '14px')
        await expect(page.locator('.compatibility > p')).toHaveCSS('font-size', '12px')
        await expect(page.locator('.compatibility > p')).toContainText('本演示不执行框架集成')
      },
    )
    if (width === 390) {
      const input = page.locator('#command-input'),
        output = page.getByRole('log')
      await check(
        'Normalized command, running state, completion and simulated output',
        async () => {
          await input.fill('  TrAcE STATUS --demo  ')
          await input.press('Enter')
          await expect(input).toBeDisabled()
          await expect(page.getByRole('button', { name: '执行本地模拟命令' })).toBeDisabled()
          await expect(output).toContainText('Everything in its right place.')
          await expect(input).toBeEnabled()
          await expect(output.locator(':scope > div')).toHaveCount(7)
          await expect(page.locator('.terminal-command')).toContainText('trace status')
          await expect(output).toContainText('Environment: local demo')
        },
      )
      await check(
        'Help, long unknown command, safe wrapping, clear and keyboard submit',
        async () => {
          await input.fill('help')
          await input.press('Enter')
          await expect(output.locator(':scope > div')).toHaveCount(6)
          await expect(output).toContainText('No commands reach a server or execute shell code.')
          const unknown = 'unknown-' + 'x'.repeat(200)
          await input.fill(unknown)
          await page.getByRole('button', { name: '执行本地模拟命令' }).click()
          await expect(output).toContainText('Command not found: ' + unknown)
          await expect(output.locator(':scope > div')).toHaveCount(8)
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
          expect(
            await page.locator('.terminal-content').evaluate((e) => e.scrollWidth <= e.clientWidth),
          ).toBe(true)
          await input.fill('clear')
          await input.press('Enter')
          await expect(output.locator(':scope > div')).toHaveCount(0)
        },
      )
      await check('Ctrl+2 and Ctrl+1 keep terminal/config navigation working', async () => {
        await input.focus()
        await page.keyboard.press('Control+2')
        await expect(page.locator('.config-preview')).toContainText('defineConfig')
        await expect(page.locator('.config-caption')).toContainText('不连接真实服务')
        await page.keyboard.press('Control+1')
        await expect(input).toBeVisible()
        await input.fill('check')
        await input.press('Enter')
        await expect(output).toContainText('All systems ready.')
        await expect(output).toContainText('sample data')
      })
      await check('Monthly/annual prices, annual totals and honest plan preview', async () => {
        const pro = page
          .locator('.plan')
          .filter({ has: page.getByRole('heading', { name: 'Pro', exact: true }) })
        const team = page
          .locator('.plan')
          .filter({ has: page.getByRole('heading', { name: 'Team', exact: true }) })
        await expect(pro.locator('.plan-price')).toContainText('20')
        await expect(team.locator('.plan-price')).toContainText('40')
        const toggle = page.getByRole('switch', { name: '切换年付价格' })
        await toggle.focus()
        await page.keyboard.press('Space')
        await expect(toggle).toHaveAttribute('aria-checked', 'true')
        await expect(pro.locator('.plan-price')).toContainText('16')
        await expect(pro.locator('.plan-period')).toContainText('$192')
        await expect(team.locator('.plan-price')).toContainText('32')
        await expect(team.locator('.plan-period')).toContainText('$384')
        await pro.getByRole('button', { name: '查看方案详情' }).click()
        const modal = page.getByRole('dialog', { name: /Pro/ })
        await expect(modal).toContainText('年付')
        await expect(modal).toContainText('没有付款、账户创建或服务开通')
        await page.keyboard.press('Escape')
        await expect(modal).not.toBeVisible()
        await toggle.click()
        await expect(pro.locator('.plan-price')).toContainText('20')
      })
    }
    if (width === 320) {
      await check('320px typed command completes with contained output', async () => {
        const input = page.locator('#command-input')
        await input.fill('check')
        await input.press('Enter')
        await expect(page.getByRole('log')).toContainText('All systems ready.')
        expect(
          await page.locator('.terminal-content').evaluate((e) => e.scrollWidth <= e.clientWidth),
        ).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
      })
    }
    await page.close()
  }
  await check('No browser script errors', async () => expect(report.errors).toEqual([]))
  report.passed = report.checks.length
} catch (error) {
  report.failure = error.message
  throw error
} finally {
  await fs.writeFile(
    'artifacts/optimization/terminal-results.json',
    JSON.stringify(report, null, 2),
  )
  await browser.close()
  console.log(JSON.stringify({ passed: report.checks.length, failure: report.failure }))
}
