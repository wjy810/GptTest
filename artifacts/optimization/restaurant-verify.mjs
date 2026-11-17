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
  await page.goto('http://127.0.0.1:4173/restaurant/')
  const measured = await page.evaluate(() => {
    const size = (s) => {
      const el = document.querySelector(s)
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, font: getComputedStyle(el).fontSize }
    }
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      ingredient: size('.dish-card > p'),
      menuNote: size('.menu-note'),
      bookingNote: size('.booking-note'),
      stepper: size('.stepper button'),
      date: size('#booking-date'),
      time: size('#booking-time'),
      dishTitle: size('.dish-title h3'),
      art: size('.dish-art'),
      columns: getComputedStyle(document.querySelector('.dish-grid')).gridTemplateColumns,
      overflows: [
        ...document.querySelectorAll(
          '.dish-title,.dish-card > p,.booking-fields input,.booking-fields select,.guest-row',
        ),
      ]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.className || el.id),
    }
  })
  assert.ok(measured.documentWidth <= width, 'no page overflow')
  assert.deepEqual(measured.overflows, [], 'functional text and form fit without clipping')
  assert.ok(measured.stepper.width >= 44 && measured.stepper.height >= 44, '44px stepper buttons')
  if (width < 680) {
    assert.equal(measured.ingredient.font, '12px')
    assert.equal(measured.date.font, '16px')
    assert.equal(measured.time.font, '16px')
    assert.equal(measured.columns.split(' ').length, 2)
  }
  await page.screenshot({
    path: `artifacts/optimization/restaurant-${width}-after.png`,
    fullPage: true,
  })
  metrics.push(measured)
  await page.close()
}
const page = await browser.newPage({
  viewport: { width: 320, height: 900 },
  reducedMotion: 'reduce',
})
await page.clock.install({ time: new Date('2026-11-17T20:30:00Z') })
await page.goto('http://127.0.0.1:4173/restaurant/')
const date = page.getByLabel('哪一天'),
  time = page.getByLabel('几点见'),
  submit = page.getByRole('button', { name: '生成预约意向' })
assert.equal(
  await date.getAttribute('min'),
  '2026-11-18',
  'Shanghai date crosses UTC midnight correctly',
)
await date.fill('2026-11-17')
await date.evaluate((el) => el.removeAttribute('min'))
await submit.click()
assert.match(
  await page.getByRole('alert').innerText(),
  /今天或之后/,
  'submit rejects earlier date without native min',
)
await date.fill('2026-11-23')
await submit.click()
assert.match(await page.getByRole('alert').innerText(), /周一休息/, 'Monday remains closed')
await date.fill('2026-11-24')
assert.equal(await page.getByRole('alert').count(), 0, 'date change clears error')
await time.selectOption('19:30')
await page.getByRole('button', { name: '增加人数' }).click()
await submit.click()
const dialog = page.getByRole('dialog', { name: '这张桌，先记在心里。' })
assert.ok(await dialog.isVisible())
assert.match(await dialog.innerText(), /2026-11-24 · 19:30 · 3 位/)
assert.match(await dialog.innerText(), /未向任何服务器发送/)
await page.keyboard.press('Escape')
assert.ok(await submit.evaluate((el) => el === document.activeElement), 'escape restores trigger')
await browser.close()
await writeFile(
  'artifacts/optimization/restaurant-after-metrics.json',
  JSON.stringify(
    {
      metrics,
      bookingChecks: [
        'Shanghai date boundary',
        'past date without native min',
        'Monday closure',
        'editing clears error',
        'selected date/time/guests in local-only dialog',
        'Escape restores trigger',
      ],
    },
    null,
    2,
  ),
)
console.log(JSON.stringify({ metrics, bookingChecks: '6 targeted checks passed' }, null, 2))
