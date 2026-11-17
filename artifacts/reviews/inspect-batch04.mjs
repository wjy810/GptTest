import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const sites = process.argv.slice(2)
assert(sites.length, 'Pass one or more stable built sites: fintech civic architecture')
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true })
const evidence = []
try {
  for (const site of sites) {
    assert(['fintech', 'civic', 'architecture'].includes(site))
    const errors = []
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`http://127.0.0.1:4173/${site}/`)
      await page.locator('h1').first().waitFor()
      await page.screenshot({
        path: `artifacts/reviews/batch04-${site}-${width}-before.png`,
        fullPage: true,
      })
      const layout = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
        const missingAnchors = [...document.querySelectorAll('a[href^="#"]')]
          .map((el) => el.getAttribute('href'))
          .filter(
            (href) =>
              href && href !== '#' && !document.getElementById(decodeURIComponent(href.slice(1))),
          )
        const title = document.querySelector('h1')
        const range = document.createRange()
        if (title) range.selectNodeContents(title)
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1Count: document.querySelectorAll('h1').length,
          duplicateIds: [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))],
          missingAnchors,
          titleText: title?.textContent,
          titleBounds: [...range.getClientRects()]
            .filter((r) => r.width)
            .map((r) => ({ x: r.x, right: r.right })),
          scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        }
      })
      await page.keyboard.press('Tab')
      layout.firstFocus = await page.evaluate(() => ({
        text: document.activeElement?.textContent?.trim(),
        tag: document.activeElement?.tagName,
        href: document.activeElement?.getAttribute('href'),
      }))
      evidence.push({ site, width, layout, errors: [...errors] })
    }
    await context.close()
  }
} finally {
  await browser.close()
  writeFileSync(
    `artifacts/reviews/batch04-layout-${sites.join('-')}.json`,
    JSON.stringify(evidence, null, 2),
  )
}
for (const { site, width, layout, errors } of evidence) {
  assert(layout.scrollWidth <= layout.viewport, `${site} ${width}: horizontal overflow`)
  assert.equal(layout.h1Count, 1, `${site} ${width}: exactly one h1`)
  assert.deepEqual(layout.duplicateIds, [], `${site} ${width}: unique IDs`)
  assert.deepEqual(layout.missingAnchors, [], `${site} ${width}: anchors resolve`)
  assert.notEqual(layout.scrollBehavior, 'smooth', `${site} ${width}: reduced motion`)
  assert.deepEqual(errors, [], `${site} ${width}: no page errors`)
  for (const rect of layout.titleBounds) {
    assert(rect.x >= -1 && rect.right <= width + 1, `${site} ${width}: h1 text inside viewport`)
  }
  console.log(
    `PASS ${site} ${width}: layout, headings, anchors, SVG IDs, reduced motion, no exceptions`,
  )
}
