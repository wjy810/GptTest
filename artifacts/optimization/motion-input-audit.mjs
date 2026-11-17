import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const sites = ['brutalist', 'glass', 'terminal', 'restaurant', 'travel', 'fintech', 'civic', 'arcade', 'architecture', 'editorial', 'swiss', 'organic']
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const report = { startedAt: new Date().toISOString(), base: 'http://127.0.0.1:4173/', method: 'Actual Chromium computed styles, Web Animations API, native anchor activation; 390×844 and 1440×900. Font below 16px is an iOS focus-zoom risk, not an iOS reproduction. Only initially rendered controls are sampled. No source edits or server mutations.', sites: [], issues: [] }

function inspectPage() {
  const selector = el => {
    if (el.id) return '#' + CSS.escape(el.id)
    const parts = []
    for (let node = el; node && node !== document.body && parts.length < 4; node = node.parentElement) {
      let part = node.tagName.toLowerCase()
      if (node.classList.length) part += [...node.classList].slice(0, 2).map(c => '.' + CSS.escape(c)).join('')
      if (node.parentElement && [...node.parentElement.children].filter(child => child.tagName === node.tagName).length > 1) part += `:nth-of-type(${[...node.parentElement.children].filter(child => child.tagName === node.tagName).indexOf(node) + 1})`
      parts.unshift(part)
      if (node.parentElement?.id) { parts.unshift('#' + CSS.escape(node.parentElement.id)); break }
    }
    return parts.join(' > ')
  }
  const visible = el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
  const animations = document.getAnimations().map(animation => {
    const target = animation.effect?.target
    const timing = animation.effect?.getTiming()
    return { selector: target ? selector(target) : null, name: animation.animationName || animation.transitionProperty || 'WebAnimation', state: animation.playState, iterations: timing?.iterations === Infinity ? 'infinite' : timing?.iterations, duration: timing?.duration, currentTime: animation.currentTime, visible: target ? visible(target) : null }
  })
  const inputs = [...document.querySelectorAll('input,select,textarea')].filter(el => visible(el) && !['checkbox', 'radio', 'range', 'button', 'submit', 'hidden'].includes(el.type)).map(el => {
    const css = getComputedStyle(el), rect = el.getBoundingClientRect()
    return { selector: selector(el), type: el.type || el.tagName.toLowerCase(), label: el.getAttribute('aria-label') || el.labels?.[0]?.textContent?.trim().slice(0, 70) || el.placeholder, fontSize: parseFloat(css.fontSize), lineHeight: css.lineHeight, width: Number(rect.width.toFixed(1)), height: Number(rect.height.toFixed(1)) }
  })
  const anchors = [...new Set([...document.querySelectorAll('a[href^="#"]')].map(el => el.getAttribute('href')).filter(href => href.length > 1 && document.getElementById(decodeURIComponent(href.slice(1)))))].filter(href => href !== '#main').slice(0, 12)
  return { animations, inputs, anchors, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, scrollBehavior: { html: getComputedStyle(document.documentElement).scrollBehavior, body: getComputedStyle(document.body).scrollBehavior }, documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, bundles: [...document.scripts].map(script => script.src).filter(Boolean) }
}

async function playingSnapshot(page, site) {
  if (site !== 'glass') return null
  await page.getByRole('button', { name: '播放声音', exact: true }).click()
  await page.waitForTimeout(100)
  return page.evaluate(inspectPage)
}

for (const site of sites) {
  const record = { site, errors: [], views: [] }
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('pageerror', error => record.errors.push(error.message))
  try {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto(`${report.base}${site}/`, { waitUntil: 'networkidle' })
      const initial = await page.evaluate(inspectPage)
      const playing = await playingSnapshot(page, site)
      const view = { width, initial, playing, anchors: [] }
      for (const href of initial.anchors) {
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
        await page.locator(`a[href="${href}"]`).first().evaluate(anchor => anchor.click())
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        view.anchors.push(await page.evaluate(href => {
          const target = document.getElementById(decodeURIComponent(href.slice(1)))
          const heading = target.matches('h1,h2,h3') ? target : target.querySelector('h1,h2,h3')
          const rect = target.getBoundingClientRect(), headingRect = heading?.getBoundingClientRect()
          const overlays = [...document.querySelectorAll('body *')].filter(el => {
            const css = getComputedStyle(el), r = el.getBoundingClientRect()
            return ['fixed', 'sticky'].includes(css.position) && r.width > innerWidth * .7 && r.height < 200 && r.top <= 1 && r.bottom > 0 && r.right > 0 && r.left < innerWidth && css.visibility !== 'hidden' && css.display !== 'none' && Number(css.opacity) > 0
          }).map(el => ({ selector: el.id ? '#' + el.id : el.tagName.toLowerCase() + [...el.classList].map(c => '.' + c).join(''), top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, height: el.getBoundingClientRect().height }))
          const overlayBottom = Math.max(0, ...overlays.map(item => item.bottom))
          return { href, targetTop: Math.round(rect.top), heading: heading?.textContent?.trim().slice(0, 80), headingTop: headingRect ? Math.round(headingRect.top) : null, headingBottom: headingRect ? Math.round(headingRect.bottom) : null, overlayBottom: Math.round(overlayBottom), overlays, coveredHeading: Boolean(headingRect && headingRect.top < overlayBottom - 1 && headingRect.bottom > 0 && overlayBottom > 0), scrollY: Math.round(scrollY) }
        }, href))
      }
      record.views.push(view)
      const motions = [...initial.animations, ...(playing?.animations || [])].filter(a => a.state === 'running' && a.iterations === 'infinite' && a.visible)
      if (motions.length) report.issues.push({ site, width, category: 'reduced-motion', details: motions })
      if (width === 390) for (const input of initial.inputs) if (input.fontSize < 16) report.issues.push({ site, viewportWidth: width, category: 'small-mobile-input', ...input })
      for (const anchor of view.anchors) if (anchor.coveredHeading) report.issues.push({ site, width, category: 'covered-anchor-heading', ...anchor })
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`${report.base}${site}/`, { waitUntil: 'networkidle' })
    record.normalMotionControl = { initial: await page.evaluate(inspectPage), playing: await playingSnapshot(page, site) }
  } catch (error) {
    record.auditError = error.message
  } finally {
    await context.close()
  }
  report.sites.push(record)
  await writeFile('artifacts/optimization/motion-input-audit.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ site, widths: record.views.map(view => view.width), issues: report.issues.filter(issue => issue.site === site).map(issue => ({ category: issue.category, selector: issue.selector, href: issue.href, width: issue.width, fontSize: issue.fontSize })), error: record.auditError }))
}
report.completedAt = new Date().toISOString()
report.summary = { sites: report.sites.length, auditErrors: report.sites.filter(site => site.auditError).length, scriptErrors: report.sites.flatMap(site => site.errors).length, reducedMotionViolations: report.issues.filter(issue => issue.category === 'reduced-motion').length, smallMobileInputs: report.issues.filter(issue => issue.category === 'small-mobile-input').length, coveredAnchorHeadings: report.issues.filter(issue => issue.category === 'covered-anchor-heading').length }
await writeFile('artifacts/optimization/motion-input-audit.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report.summary))
await browser.close()
