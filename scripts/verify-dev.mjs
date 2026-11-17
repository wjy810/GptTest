import { chromium } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

// Start `npm run dev:all` first. Each page must load with its own Vite cache.
const sites = JSON.parse(readFileSync(new URL('../sites.json', import.meta.url), 'utf8'))
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true,
  args: ['--no-sandbox'],
})
const results = []
try {
  for (const [index, site] of sites.entries()) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`)
    })
    const response = await page.goto(`http://127.0.0.1:${5173 + index}/`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })
    await page.locator('h1').first().waitFor()
    if (response.status() !== 200 || errors.length) {
      throw new Error(`${site}: ${JSON.stringify(errors)}`)
    }
    results.push({
      site,
      port: 5173 + index,
      status: response.status(),
      heading: await page.locator('h1').first().innerText(),
      errors,
    })
    console.log(`${site}: development entry verified`)
    await page.close()
  }
  const output = new URL('../artifacts/reviews/dev-startup.json', import.meta.url)
  mkdirSync(new URL('.', output), { recursive: true })
  writeFileSync(
    output,
    JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n',
  )
} finally {
  await browser.close()
}
