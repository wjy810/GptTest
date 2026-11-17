import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
const before = JSON.parse(
  await readFile('artifacts/optimization/brutalist-before-metrics.json', 'utf8'),
)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const metrics = []
for (const width of [1440, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:4173/brutalist/')
  const measured = await page.evaluate(() => {
    const rect = (s) => {
      const r = document.querySelector(s).getBoundingClientRect()
      return { top: r.top + scrollY, width: r.width, height: r.height, right: r.right }
    }
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      work: rect('.work'),
      count: rect('.work h2 sup'),
      art: rect('.work-art'),
      titleButton: rect('.project-info > button'),
      contact: rect('.contact'),
      budget: getComputedStyle(document.querySelector('#budget')).fontSize,
      brief: getComputedStyle(document.querySelector('#brief')).fontSize,
      actions: [
        ...document.querySelectorAll('.project-info > button,.choice-row button,.download-button'),
      ].map((el) => ({
        height: el.getBoundingClientRect().height,
        width: el.getBoundingClientRect().width,
      })),
      rootOverflow: getComputedStyle(document.documentElement).overflowX,
      bodyOverflow: getComputedStyle(document.body).overflowX,
    }
  })
  assert.ok(measured.documentWidth <= width, `${width}: no horizontal overflow`)
  assert.ok(
    measured.count.right <= width && measured.count.height > 0,
    `${width}: count visible inside viewport`,
  )
  assert.equal(
    measured.work.top,
    before.find((item) => item.width === width).work.top,
    'hero preserved',
  )
  assert.notEqual(measured.rootOverflow, 'hidden', 'no root overflow masking')
  assert.notEqual(measured.bodyOverflow, 'hidden', 'no body overflow masking')
  if (width < 650) {
    assert.equal(measured.art.height, 340)
    assert.equal(measured.budget, '16px')
    assert.equal(measured.brief, '16px')
    assert.ok(
      measured.actions.every((button) => button.height >= 44 && button.width >= 44),
      'comfortable actual action boxes',
    )
  }
  await page.screenshot({
    path: `artifacts/optimization/brutalist-${width}-after.png`,
    fullPage: true,
  })
  if (width === 390)
    await page
      .locator('.work')
      .screenshot({ path: 'artifacts/optimization/brutalist-work-390-after.png' })
  metrics.push(measured)
  await page.close()
}
await browser.close()
await writeFile(
  'artifacts/optimization/brutalist-after-metrics.json',
  JSON.stringify(metrics, null, 2),
)
console.log(JSON.stringify(metrics, null, 2))
