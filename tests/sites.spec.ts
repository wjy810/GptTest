import { test, expect, type Page } from '@playwright/test'

const sites = [
  'catalogue',
  'editorial',
  'brutalist',
  'swiss',
  'glass',
  'terminal',
  'organic',
  'restaurant',
  'travel',
  'arcade',
  'civic',
  'architecture',
  'fintech',
] as const

async function openSite(page: Page, site: string) {
  const response = await page.goto(`/${site}/`)
  expect(response?.status(), `${site} must be built and served independently`).toBe(200)
  await expect(page.locator('h1')).toHaveCount(1)
}

test('catalogue: root entry redirects to the independently served catalogue', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(response?.request().redirectedFrom()?.url()).toBe('http://127.0.0.1:4173/')
  await expect(page).toHaveURL('http://127.0.0.1:4173/catalogue/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('十二种视角')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

for (const site of sites) {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'narrow mobile', width: 320, height: 740 },
  ]) {
    test(`${site} / ${viewport.name}: standalone document, resources and layout`, async ({
      page,
    }, testInfo) => {
      const jsErrors: string[] = []
      const failedResources: string[] = []
      page.on('pageerror', (error) => jsErrors.push(error.message))
      page.on('requestfailed', (request) =>
        failedResources.push(
          `${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
        ),
      )
      page.on('response', (response) => {
        if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`)
      })
      await page.setViewportSize(viewport)
      await openSite(page, site)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('h1')).not.toHaveText('')
      const pageHeader = (await page.locator('header').count())
        ? page.locator('header').first()
        : page.locator('nav').first()
      await expect(pageHeader).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()
      await expect(page.locator('iframe')).toHaveCount(0)
      if (site !== 'catalogue')
        await expect(page.getByText('FORMINDEX', { exact: true })).toHaveCount(0)
      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }))
      expect(
        overflow.document,
        `${site} must not scroll horizontally at ${viewport.width}px`,
      ).toBeLessThanOrEqual(overflow.viewport)
      if (viewport.width === 320) {
        const editableFields = page.locator(
          'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), select, textarea',
        )
        for (const field of await editableFields.all()) {
          if (!(await field.isVisible())) continue
          const fontSize = await field.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          )
          expect(
            fontSize,
            `${site}: editable mobile text must remain readable`,
          ).toBeGreaterThanOrEqual(16)
        }
      }
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect
          .poll(() =>
            image.evaluate(
              (element) =>
                (element as HTMLImageElement).complete &&
                (element as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true)
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      expect(
        await page
          .locator('img')
          .evaluateAll((images) =>
            images
              .filter(
                (image) =>
                  !(image as HTMLImageElement).complete ||
                  (image as HTMLImageElement).naturalWidth === 0,
              )
              .map((image) => (image as HTMLImageElement).src),
          ),
      ).toEqual([])
      expect(jsErrors, 'No uncaught JavaScript errors').toEqual([])
      expect(failedResources, 'No failed HTTP resources').toEqual([])
      await page.screenshot({
        path: testInfo.outputPath(`${site}-${viewport.name}.png`),
        fullPage: true,
      })
    })
  }
}

test('editorial: filter stories, read a story, and persist a bookmark', async ({ page }) => {
  await openSite(page, 'editorial')
  await page.getByRole('button', { name: '空间', exact: true }).click()
  await expect(page.locator('.story-grid .story')).toHaveCount(2)
  await page.getByRole('button', { name: '收藏 一间房子，如何盛放安静', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '已收藏 (1)', exact: true }).click()
  await expect(page.locator('.story-grid .story')).toHaveCount(1)
  await page.getByRole('button', { name: '阅读 一间房子，如何盛放安静', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '一间房子，如何盛放安静' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('给没有安排的事情，留一个位置')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: '取消收藏 一间房子，如何盛放安静', exact: true }).click()
  await expect(page.getByText('你的书架还很安静。', { exact: false })).toBeVisible()
})

test('editorial: subscription feedback stays explicitly local', async ({ page }) => {
  await openSite(page, 'editorial')
  await page.getByLabel('你的电子邮箱').fill('reader@example.com')
  await page.getByRole('button', { name: '保存订阅意向' }).click()
  await expect(page.getByRole('status')).toContainText('演示站不会发送邮件')
  expect(await page.evaluate(() => localStorage.getItem('folio-newsletter-demo'))).toBe(
    'reader@example.com',
  )
})

test('brutalist: category filter opens and closes the matching case study', async ({ page }) => {
  await openSite(page, 'brutalist')
  await page.locator('.filters').getByRole('button', { name: '数字体验', exact: true }).click()
  await expect(page.locator('.work-card')).toHaveCount(1)
  await page.getByRole('button', { name: '查看OFF TYPE项目' }).click()
  const dialog = page.getByRole('dialog', { name: 'OFF TYPE' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('如何把专业字体参数')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('brutalist: a project brief downloads the selected service and budget', async ({ page }) => {
  await openSite(page, 'brutalist')
  await page.locator('.choice-row').getByRole('button', { name: '数字体验' }).click()
  await page.getByLabel('02 / 预算范围').selectOption('5–10 万')
  await page.getByLabel('03 / 说说你的想法').fill('打造一个独立的交互字体实验网站。')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: '生成我的项目简报' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('odd-project-brief.md')
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text).toContain('服务方向：数字体验')
  expect(text).toContain('预算范围：5–10 万')
  expect(text).toContain('打造一个独立的交互字体实验网站。')
  await expect(page.getByRole('status')).toContainText('简报已生成并下载')
})

test('swiss: date tabs support arrow keys and exhibition details close with Escape', async ({
  page,
}) => {
  await openSite(page, 'swiss')
  await page.getByRole('tab', { name: /12\.18/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /12\.19/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('运动图形的节奏练习')
  await expect(page.getByRole('tabpanel')).not.toContainText('开场：秩序是一种选择')
  await page.getByRole('button', { name: '查看秩序的另一面展览详情' }).click()
  const dialog = page.getByRole('dialog', { name: '秩序的另一面' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('64 个可重复的基础单元')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('swiss: ticket type and quantity change both price and reservation summary', async ({
  page,
}) => {
  await openSite(page, 'swiss')
  await expect(page.locator('.ticket-total strong')).toHaveText('¥68')
  await page.getByRole('radio', { name: /三日通行/ }).check()
  await page.getByRole('button', { name: '增加人数' }).click()
  await expect(page.locator('.ticket-total strong')).toHaveText('¥316')
  await expect(page.getByRole('combobox')).toBeDisabled()
  await page.getByRole('button', { name: '查看预约摘要' }).click()
  const summary = page.getByRole('dialog', { name: '好奇心，已就位。' })
  await expect(summary).toContainText('三日通行')
  await expect(summary).toContainText('2 人')
  await expect(summary).toContainText('¥316')
  await expect(summary).toContainText('尚未进行任何支付或真实预约')
  await page.keyboard.press('Escape')
  await expect(summary).not.toBeVisible()
})

test('organic: product filter, product details, persistent bag and recalculated totals', async ({
  page,
}) => {
  await openSite(page, 'organic')
  await page.getByRole('button', { name: '有生命的绿' }).click()
  await expect(page.locator('.product-card')).toHaveCount(3)
  await page.getByRole('button', { name: '查看一株橡皮树详情' }).click()
  const product = page.getByRole('dialog', { name: '一株橡皮树', exact: true })
  await expect(product).toBeVisible()
  await product.getByRole('button', { name: '加入购物袋' }).click()
  await page.keyboard.press('Escape')
  await expect(product).not.toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: '打开购物袋，1件商品' }).click()
  const bag = page.getByRole('dialog', { name: '你的购物袋', exact: true })
  await expect(bag.locator('.grand-total')).toContainText('¥186')
  await bag.getByRole('button', { name: '增加一株橡皮树数量' }).click()
  await expect(bag.locator('.grand-total')).toContainText('¥336')
  await expect(bag).toContainText('已达包邮')
  await bag.getByRole('button', { name: '生成订单摘要' }).click()
  await expect(bag.getByRole('status')).toContainText('未创建真实订单，也不会扣款')
  await page.keyboard.press('Escape')
  await expect(bag).not.toBeVisible()
})

test('organic: removing the last item restores the empty cart', async ({ page }) => {
  await openSite(page, 'organic')
  await page.getByRole('button', { name: '添加山丘陶器到购物袋' }).click()
  await page.getByRole('button', { name: '打开购物袋，1件商品' }).click()
  const bag = page.getByRole('dialog', { name: '你的购物袋', exact: true })
  await bag.getByRole('button', { name: '减少山丘陶器数量' }).click()
  await expect(bag).toContainText('购物袋还是空的')
})

test('organic: a mobile bag opened from its temporary dock restores keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openSite(page, 'organic')
  const add = page.locator('.product-card .quick-add').first()
  await add.focus()
  await page.keyboard.press('Enter')
  const opener = page.locator('.mobile-bag-dock').getByRole('button', { name: '查看购物袋' })
  await expect(opener).toBeVisible()
  await opener.focus()
  await page.keyboard.press('Enter')
  const bag = page.getByRole('dialog', { name: '你的购物袋', exact: true })
  await expect(bag).toBeVisible()
  await expect(page.locator('.mobile-bag-dock')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(bag).not.toBeVisible()
  await expect(opener).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(bag).toBeVisible()
})

test('glass: Web Audio player starts, advances time, switches sound and pauses', async ({
  page,
}) => {
  await openSite(page, 'glass')
  await page.getByRole('button', { name: '播放声音', exact: true }).click()
  await expect(page.getByRole('button', { name: '暂停声音', exact: true })).toBeVisible()
  await expect(page.locator('.playback-time span').first()).not.toHaveText('00:00', {
    timeout: 4000,
  })
  await page.getByRole('slider', { name: '音量' }).fill('37')
  await expect(page.locator('.volume-control output')).toHaveText('37%')
  await page.getByRole('button', { name: '下一个声音' }).click()
  await expect(page.locator('.player-card h2')).toHaveText('Light through water.')
  await page.getByRole('button', { name: '暂停声音', exact: true }).click()
  await expect(page.getByRole('button', { name: '播放声音', exact: true })).toBeVisible()
  await expect(page.locator('.player-card-top')).toContainText('PAUSED')
})

test('glass: mood and favorite filters show the correct sounds', async ({ page }) => {
  await openSite(page, 'glass')
  await page.getByRole('button', { name: '放松', exact: true }).click()
  await expect(page.locator('.sound-card')).toHaveCount(1)
  await expect(page.locator('.sound-card')).toContainText('Light through water.')
  await page.getByRole('button', { name: '收藏 Light through water.', exact: true }).click()
  await page.getByRole('button', { name: '已收藏 1', exact: true }).click()
  await expect(page.locator('.sound-card')).toHaveCount(1)
  await page.getByRole('button', { name: '取消收藏 Light through water.', exact: true }).click()
  await expect(page.getByText('还没有收藏。', { exact: false })).toBeVisible()
})

test('terminal: typed commands produce local output and unknown-command feedback', async ({
  page,
}) => {
  await openSite(page, 'terminal')
  const command = page.getByRole('textbox', { name: '输入演示命令' })
  await command.fill('trace status')
  await command.press('Enter')
  await expect(page.getByRole('log')).toContainText('Everything in its right place.')
  await expect(command).toBeEnabled()
  await command.fill('unknown-command')
  await command.press('Enter')
  await expect(page.getByRole('log')).toContainText('Command not found: unknown-command')
  await command.fill('clear')
  await command.press('Enter')
  await expect(page.getByRole('log')).toBeEmpty()
})

test('terminal: annual billing changes price and plan preview', async ({ page }) => {
  await openSite(page, 'terminal')
  const pro = page
    .locator('.plan')
    .filter({ has: page.getByRole('heading', { name: 'Pro', exact: true }) })
  await expect(pro.locator('.plan-price')).toContainText('$20')
  await page.getByRole('switch', { name: '切换年付价格' }).click()
  await expect(pro.locator('.plan-price')).toContainText('$16')
  await expect(pro).toContainText('年付合计 $192')
  await pro.getByRole('button', { name: '查看方案详情' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('年付')
  await expect(dialog).toContainText('没有付款、账户创建或服务开通')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('catalogue: independent links, evidence filtering, search and source record', async ({
  page,
}) => {
  await openSite(page, 'catalogue')
  await expect(page.locator('.site-card')).toHaveCount(12)
  const links = await page.locator('.site-preview').evaluateAll((elements) =>
    elements.map((element) => ({
      path: new URL((element as HTMLAnchorElement).href).pathname,
      target: (element as HTMLAnchorElement).target,
    })),
  )
  expect(new Set(links.map((link) => link.path)).size).toBe(12)
  expect(links.every((link) => link.target === '_blank')).toBe(true)
  await page.locator('.source-filters button').nth(2).click()
  const cards = page.locator('.source-card')
  await expect(cards).toHaveCount(9)
  await expect(page.locator('.result-count')).toContainText('共 13 个来源')
  await page.getByRole('button', { name: '下一页来源' }).click()
  await expect(cards).toHaveCount(4)
  await expect(page.locator('.result-count')).toBeFocused()
  await expect(page.getByRole('button', { name: '下一页来源' })).toBeDisabled()
  await page.getByRole('textbox', { name: '搜索灵感来源' }).fill('B站')
  await expect(cards).toHaveCount(1)
  await cards.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('当前环境访问受限')
  await expect(dialog.getByRole('link', { name: '打开原始来源' })).toHaveAttribute(
    'href',
    /bilibili/,
  )
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('textbox', { name: '搜索灵感来源' }).fill('not-a-real-research-source')
  await expect(page.getByText('暂时没有匹配的资料')).toBeVisible()
})

test('catalogue: pagination covers every source and combined filters reset coherently', async ({
  page,
}) => {
  await openSite(page, 'catalogue')
  const titles: string[] = []
  for (let index = 1; index <= 4; index++) {
    await expect(page.locator('.source-card')).toHaveCount(index === 4 ? 3 : 9)
    titles.push(...(await page.locator('.source-card h3').allTextContents()))
    if (index < 4) await page.getByRole('button', { name: '下一页来源' }).click()
  }
  expect(new Set(titles).size).toBe(30)
  const topic = page.getByRole('combobox', { name: '筛选来源主题' })
  await topic.selectOption('视频平台')
  await expect(page.locator('.source-card')).toHaveCount(2)
  await expect(page.locator('.result-count')).toContainText('显示 1–2')
  await page.locator('.source-filters button').nth(1).click()
  await expect(page.locator('.source-card')).toHaveCount(0)
  await expect(page.getByText('暂时没有匹配的资料')).toBeVisible()
  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(topic).toHaveValue('all')
  await expect(page.getByRole('textbox', { name: '搜索灵感来源' })).toBeFocused()
  await expect(page.locator('.result-count')).toContainText('共 30 个来源')
  await expect(page.locator('.source-card')).toHaveCount(9)
})

test('catalogue: a deferred reader failure preserves the page and original document download', async ({
  page,
}) => {
  let readerRequests = 0
  await page.route('**/DocumentReader-*.js', async (route) => {
    readerRequests++
    await route.abort()
  })
  await openSite(page, 'catalogue')
  await page.waitForLoadState('networkidle')
  expect(readerRequests).toBe(0)
  const opener = page.locator('.note-item').first()
  await opener.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('alert')).toContainText('资料暂时没有加载完成')
  expect(readerRequests).toBeGreaterThan(0)
  await expect(dialog.getByRole('button', { name: '刷新页面' })).toBeFocused()
  const downloadEvent = page.waitForEvent('download')
  await dialog.getByRole('button', { name: '下载 Markdown' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('REPLICATION.md')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks).toString('utf8')).toContain('apps/editorial')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(opener).toBeFocused()
  await expect(page.locator('.site-card')).toHaveCount(12)
})

test('catalogue: handbook opens and downloads substantive Markdown', async ({ page }) => {
  await openSite(page, 'catalogue')
  await page.locator('.note-item').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('h1')).toBeVisible()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载 Markdown' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('REPLICATION.md')
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text).toContain('apps/editorial')
  expect(text).toContain('CSS')
  expect(text.length).toBeGreaterThan(3000)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('catalogue: design system GFM tables render and scroll inside the mobile reader', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openSite(page, 'catalogue')
  await page.locator('.note-item').nth(1).click()
  const dialog = page.getByRole('dialog', { name: '拆解设计语言' })
  const table = dialog.getByRole('table').first()
  await expect(table).toBeVisible()
  await expect(table.getByRole('columnheader')).toHaveText(['类别', '名称', '建议值', '用法'])
  await expect(table).toContainText('accent-visual')
  const region = dialog.getByRole('region', { name: '文档表格，可横向滚动' }).first()
  const width = await region.evaluate((element) => ({
    scroll: element.scrollWidth,
    visible: element.clientWidth,
  }))
  expect(width.scroll).toBeGreaterThan(width.visible)
  await region.focus()
  await region.press('End')
  await region.evaluate((element) => {
    element.scrollLeft = element.scrollWidth
  })
  expect(await region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  const dialogWidth = await dialog.evaluate((element) => ({
    scroll: element.scrollWidth,
    visible: element.clientWidth,
  }))
  expect(dialogWidth.scroll).toBeLessThanOrEqual(dialogWidth.visible)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('restaurant: menu filtering and reservation details reflect the selected date, time and guests', async ({
  page,
}) => {
  await openSite(page, 'restaurant')
  await page.getByRole('button', { name: '田园', exact: true }).click()
  await expect(page.locator('.dish-card')).toHaveCount(2)
  await expect(page.locator('.dish-grid')).toContainText('炭火慢烤南瓜')
  await expect(page.locator('.dish-grid')).not.toContainText('苹果木烟熏牛肋')
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  await page.getByLabel('哪一天').fill(future)
  await page.getByLabel('几点见').selectOption('19:30')
  await page.getByRole('button', { name: '增加人数' }).click()
  await page.getByRole('button', { name: '生成预约意向' }).click()
  const dialog = page.getByRole('dialog', { name: '这张桌，先记在心里。' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(`${future} · 19:30 · 3 位`)
  await expect(dialog).toContainText('未向任何服务器发送')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('restaurant: missing and past dates do not create a reservation', async ({ page }) => {
  await openSite(page, 'restaurant')
  const date = page.getByLabel('哪一天')
  await page.getByRole('button', { name: '生成预约意向' }).click()
  expect(
    await date.evaluate((element) => (element as HTMLInputElement).validity.valueMissing),
  ).toBe(true)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await date.fill('2020-01-01')
  await page.getByRole('button', { name: '生成预约意向' }).click()
  expect(
    await date.evaluate((element) => (element as HTMLInputElement).validity.rangeUnderflow),
  ).toBe(true)
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('travel: category filters, saved places survive reload and destination detail closes', async ({
  page,
}) => {
  await openSite(page, 'travel')
  await page.getByRole('button', { name: '海岛', exact: true }).click()
  await expect(page.locator('.destination-card')).toHaveCount(2)
  await page.getByRole('button', { name: '收藏万宁', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /已收藏/ }).click()
  await expect(page.locator('.destination-card')).toHaveCount(1)
  await expect(page.locator('.destination-card')).toContainText('万宁')
  await page.getByRole('button', { name: '探索万宁', exact: true }).click()
  const detail = page.getByRole('dialog', { name: '去万宁，慢慢走。' })
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('海湾散步与日出观察')
  await page.keyboard.press('Escape')
  await expect(detail).not.toBeVisible()
})

test('travel: budget, day-by-day summary and downloaded itinerary use chosen inputs', async ({
  page,
}) => {
  await openSite(page, 'travel')
  await expect(page.locator('.budget-total strong')).toHaveText('¥6,600')
  await page.getByLabel('01 / 想去哪里？').selectOption('dali')
  await page.getByRole('button', { name: '增加人数' }).click()
  await page.locator('#trip-days').fill('8')
  await expect(page.locator('.budget-total strong')).toHaveText('¥11,340')
  await page.getByRole('button', { name: '生成我的漫游草案' }).click()
  const summary = page.getByRole('dialog', { name: '大理，我们来了。' })
  await expect(summary.locator('.day-list li')).toHaveCount(8)
  await expect(summary).toContainText('3 人同行')
  await expect(summary.locator('.summary-budget strong')).toHaveText('¥11,340')
  const downloaded = page.waitForEvent('download')
  await summary.getByRole('button', { name: '下载 Markdown 草案' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('roam-dali-8days.md')
  const chunks: Buffer[] = []
  for await (const chunk of (await file.createReadStream())!) chunks.push(Buffer.from(chunk))
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text).toContain('人数：3 人')
  expect(text).toContain('合计：(¥360 × 8 + ¥900) × 3 = ¥11340')
  expect(text).toContain('第 8 天')
})

test('arcade: early clicks are rejected and concept rules remain clearly marked', async ({
  page,
}) => {
  await openSite(page, 'arcade')
  await page.getByRole('button', { name: '开始下一轮反应挑战', exact: true }).click()
  await page.getByRole('button', { name: '等待变绿，提前点击会失败', exact: true }).click()
  await expect(page.locator('.game-screen')).toContainText('TOO SOON.')
  await expect(page.locator('.score-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '导出成绩单' })).toBeDisabled()
  await page.getByRole('button', { name: '查看 ORBIT SHIFT 规则' }).click()
  const rules = page.getByRole('dialog', { name: 'ORBIT SHIFT' })
  await expect(rules).toContainText('尚未实现游戏')
  await page.keyboard.press('Escape')
  await expect(rules).not.toBeVisible()
})

test('arcade: a completed reaction round persists and exports its actual score', async ({
  page,
}) => {
  await openSite(page, 'arcade')
  await page.getByRole('button', { name: '开始下一轮反应挑战', exact: true }).click()
  const signal = page.getByRole('button', { name: '立即点击记录反应时间', exact: true })
  await expect(signal).toBeVisible({ timeout: 7000 })
  await signal.click()
  const resultText = await page.locator('.score-result').innerText()
  const milliseconds = Number.parseInt(resultText, 10)
  expect(milliseconds).toBeGreaterThan(0)
  await expect(page.locator('.score-row')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.score-row')).toHaveCount(1)
  await expect(page.locator('.score-row b')).toContainText(String(milliseconds))
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出成绩单' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('p1xel-scorecard.json')
  const chunks: Buffer[] = []
  for await (const chunk of (await file.createReadStream())!) chunks.push(Buffer.from(chunk))
  const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  expect(json.game).toBe('REFLEX.EXE')
  expect(json.scores).toHaveLength(1)
  expect(json.best).toBe(milliseconds)
  expect(json.scores[0].ms).toBe(milliseconds)
})

test('civic: search intersects category filters and an empty result can be reset', async ({
  page,
}) => {
  await openSite(page, 'civic')
  await page.getByRole('textbox', { name: '搜索城市服务' }).fill('健康')
  await expect(page.locator('.service-card')).toHaveCount(1)
  await expect(page.locator('.service-card')).toContainText('健康关怀')
  await page.getByRole('button', { name: '生活服务', exact: true }).click()
  await expect(page.locator('.service-card')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '暂时没有找到这项服务' })).toBeVisible()
  await page.getByRole('button', { name: '查看全部服务', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '搜索城市服务' })).toHaveValue('')
  await expect(page.locator('.service-card')).toHaveCount(6)
  await page.getByRole('button', { name: '教育文化', exact: true }).click()
  await expect(page.locator('.service-card')).toHaveCount(2)
})

test('civic: choosing a service prefills a local booking and refresh clears its summary', async ({
  page,
}) => {
  await openSite(page, 'civic')
  await page
    .locator('.service-card')
    .filter({ has: page.getByRole('heading', { name: '健康关怀', exact: true }) })
    .click()
  await expect(page.getByLabel('需要什么帮助？')).toHaveValue('health')
  await expect(page.getByLabel('需要什么帮助？')).toBeFocused()
  await page.getByLabel('如何称呼你').fill('测试访客')
  await page.getByLabel('示例邮箱').fill('visitor@example.com')
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  await page.getByLabel('预约日期', { exact: true }).fill(future)
  await page.getByLabel('方便的时段').selectOption('14:00 – 15:00')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '生成演示预约' }).click()
  const summary = page.getByRole('region', { name: '本地预约摘要' })
  await expect(summary).toBeVisible()
  await expect(summary).toBeFocused()
  await expect(summary).toContainText('健康关怀')
  await expect(summary).toContainText(future)
  await expect(summary).toContainText('14:00 – 15:00')
  await expect(summary).toContainText('UTC+8')
  await expect(summary).toContainText('仅本地确认 · 未发送')
  await page.reload()
  await expect(page.getByRole('region', { name: '本地预约摘要' })).toHaveCount(0)
  await expect(page.getByLabel('如何称呼你')).toHaveValue('')
})

test.describe('civic: city service timezone', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })
  test('uses UTC+8 calendar date across midnight and rejects the preceding date', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-17T16:30:00Z'))
    await openSite(page, 'civic')
    const date = page.getByLabel('预约日期', { exact: true })
    await expect(date).toHaveAttribute('min', '2026-11-18')
    await page.getByLabel('如何称呼你').fill('示例访客')
    await page.getByLabel('示例邮箱').fill('visitor@example.com')
    await date.fill('2026-11-17')
    await page.getByLabel('方便的时段').selectOption('09:00 – 10:00')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: '生成演示预约' }).click()
    expect(
      await date.evaluate((element) => (element as HTMLInputElement).validity.rangeUnderflow),
    ).toBe(true)
    await expect(page.getByRole('region', { name: '本地预约摘要' })).toHaveCount(0)
    await date.fill('2026-11-18')
    await page.getByRole('button', { name: '生成演示预约' }).click()
    await expect(page.getByRole('region', { name: '本地预约摘要' })).toContainText('2026-11-18')
  })
})

test('architecture: hero scenes change, category filters narrow projects, and project details close', async ({
  page,
}) => {
  await openSite(page, 'architecture')
  await expect(page.locator('.hero-information')).toContainText('The Quiet Courtyard')
  await page.getByRole('button', { name: '下一个建筑项目' }).click()
  await expect(page.locator('.hero-information')).toContainText('A Place for Light')
  await expect(page.locator('.hero-image .architecture-scene')).toHaveAttribute(
    'aria-label',
    '光的居所原创建筑空间概念图',
  )
  await page.getByRole('button', { name: '上一个建筑项目' }).click()
  await expect(page.locator('.hero-information')).toContainText('The Quiet Courtyard')
  await page.locator('.filters').getByRole('button', { name: /文化/ }).click()
  await expect(page.locator('.project-gallery .project')).toHaveCount(1)
  await page.getByRole('button', { name: '了解光的居所项目' }).click()
  const dialog = page.getByRole('dialog', { name: /A Place for Light/ })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('740 m²')
  await expect(dialog).toContainText('石灰抹灰 / 木格栅 / 再生砖')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('architecture: downloaded project brief contains the chosen design requirements', async ({
  page,
}) => {
  await openSite(page, 'architecture')
  await page.getByLabel('项目方向').selectOption('文化与艺术空间')
  await page.getByLabel('预估面积').selectOption('300–1000 m²')
  await page.getByLabel('项目地点').fill('杭州 / 社区图书馆')
  await page
    .getByLabel('关于这个空间，你有什么想法？')
    .fill('希望提供安静的阅读空间，并让不同年龄的居民方便使用。')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: '生成项目简报' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('still-project-brief.md')
  const chunks: Buffer[] = []
  for await (const chunk of (await file.createReadStream())!) chunks.push(Buffer.from(chunk))
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text).toContain('项目方向：文化与艺术空间')
  expect(text).toContain('预估面积：300–1000 m²')
  expect(text).toContain('项目地点：杭州 / 社区图书馆')
  expect(text).toContain('不同年龄的居民方便使用')
  expect(text).toContain('未发送给任何事务所')
  await expect(page.getByRole('status')).toContainText('简报已下载')
})

test('fintech: range selection synchronizes chart, summary, accessible data and exported CSV', async ({
  page,
}) => {
  await openSite(page, 'fintech')
  await page.getByRole('button', { name: '1W', exact: true }).click()
  await expect(page.getByRole('button', { name: '1W', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.chart-bottom')).toContainText('$3,050.65')
  await expect(page.locator('.metric-card').nth(1)).toContainText('3,050')
  await page.locator('.chart-data summary').click()
  await expect(page.locator('.chart-data tbody tr')).toHaveCount(7)
  await expect(page.locator('.chart-data tbody tr').first()).toContainText('2026-11-11')
  await expect(page.locator('.chart-data tbody tr').first()).toContainText('$125,380.00')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出当前周期演示数据CSV' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('mono-demo-1W.csv')
  const chunks: Buffer[] = []
  for await (const chunk of (await file.createReadStream())!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv.trim().split('\n')).toHaveLength(8)
  expect(csv).toContain('2026-11-11,125380.00,125380.00')
  expect(csv).toContain('2026-11-17,128430.65,127250.00')
  await page.getByRole('button', { name: '模拟基准', exact: true }).click()
  await expect(page.getByRole('button', { name: '模拟基准', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('fintech: mobile chart dates stay readable and separated in every period', async ({
  page,
}) => {
  await openSite(page, 'fintech')
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const range of ['1W', '1M', '3M', '1Y']) {
      const button = page.getByRole('button', { name: range, exact: true })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      const labels = await page.locator('.chart-area svg text').evaluateAll((elements) =>
        elements
          .filter((element) => /^\d{2,4}\.\d{2}$/.test(element.textContent || ''))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              text: element.textContent,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            }
          })
          .filter((label) => label.width > 0)
          .sort((a, b) => a.left - b.left),
      )
      expect(
        labels.length,
        `${width}px / ${range}: dates must remain visible`,
      ).toBeGreaterThanOrEqual(2)
      for (let index = 1; index < labels.length; index++) {
        expect(
          labels[index].left - labels[index - 1].right,
          `${width}px / ${range}: ${labels[index - 1].text} and ${labels[index].text} must not collide`,
        ).toBeGreaterThanOrEqual(6)
      }
    }
  }
})

test('fintech: search, category and sorting work together while watchlist persists', async ({
  page,
}) => {
  await openSite(page, 'fintech')
  await page.getByRole('button', { name: '股票', exact: true }).click()
  await expect(page.locator('.market-table tbody tr')).toHaveCount(2)
  await page.getByRole('textbox', { name: '搜索资产名称或代码' }).fill('flux')
  await expect(page.locator('.market-table tbody tr')).toHaveCount(1)
  await page.getByRole('button', { name: '关注 FLUX', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /我的关注/ }).click()
  await expect(page.locator('.market-table tbody tr')).toHaveCount(3)
  await expect(page.getByRole('button', { name: '取消关注 FLUX', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: '全部资产', exact: true }).click()
  await page.getByRole('button', { name: '按涨幅降序排列' }).click()
  await expect(page.locator('.asset-name b')).toHaveText([
    'AURA',
    'FLUX',
    'MWLD',
    'BOND',
    'ORBT',
    'NOVA',
  ])
  await page.getByRole('textbox', { name: '搜索资产名称或代码' }).fill('not-a-real-asset')
  await expect(page.getByRole('heading', { name: '没有找到匹配的资产' })).toBeVisible()
  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(page.locator('.market-table tbody tr')).toHaveCount(6)
  await page.getByRole('button', { name: '清空本地关注' }).click()
  await page.reload()
  await page.getByRole('button', { name: /我的关注/ }).click()
  await expect(page.locator('.market-table tbody tr')).toHaveCount(0)
})

test('fintech: zero and negative growth scenarios preserve principal arithmetic and invalidate old marks', async ({
  page,
}) => {
  await openSite(page, 'fintech')
  await page.getByRole('slider', { name: '每月末投入' }).fill('1000')
  await page.getByRole('slider', { name: '模拟时间' }).fill('1')
  await page.getByLabel('假设名义年增长率').selectOption('0')
  await expect(page.locator('.projection-value')).toHaveText('$12,000')
  await expect(page.locator('.projection-panel dl')).toContainText('$12,000')
  await expect(page.locator('.projection-panel dl')).toContainText('+$0')
  await expect(page.locator('.metric-card').nth(2)).toContainText('1,000')
  await page.getByRole('button', { name: '标记这组模拟参数' }).click()
  await expect(page.getByRole('button', { name: '已标记这组参数' })).toBeVisible()
  await page.getByLabel('假设名义年增长率').selectOption('-2')
  const projection = Number(
    (await page.locator('.projection-value').innerText()).replace(/[^\d.]/g, ''),
  )
  expect(projection).toBeGreaterThan(0)
  expect(projection).toBeLessThan(12_000)
  await expect(page.locator('.projection-panel dl')).toContainText('假设减少')
  await expect(page.getByRole('button', { name: '标记这组模拟参数' })).toBeVisible()
})
