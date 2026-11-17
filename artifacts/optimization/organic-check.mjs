import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL('./',import.meta.url));
const browser=await chromium.launch({headless:true, executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[]; const errors=[];
const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});
page.on('pageerror', e=>errors.push(e.message));
const url='http://127.0.0.1:4173/organic/';
async function record(name,fn){try{await fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message)}}
async function seed(raw){await page.goto(url);await page.evaluate(raw=>localStorage.setItem('mori-bag',raw),raw);await page.reload();}
const cart=()=>page.getByRole('dialog',{name:'你的购物袋',exact:true});
async function openBag(){await page.locator('.bag-button').click();await expect(cart()).toBeVisible()}
async function closeBag(){await page.keyboard.press('Escape');await expect(cart()).toHaveCount(0)}
await seed('{}');
await record('真实分类与排序',async()=>{
 await expect(page.locator('.product-card')).toHaveCount(6);
 await page.getByRole('button',{name:'有生命的绿',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(3);await expect(page.locator('.results-count')).toHaveText('03 件好物');
 await page.getByRole('button',{name:'有温度的物',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(3);
 await page.getByRole('button',{name:'全部好物',exact:true}).click();
 await page.getByLabel('商品排序').selectOption('price-up');expect(await page.locator('.product-title-row > span').allTextContents()).toEqual(['¥128','¥158','¥168','¥198','¥238','¥268']);
 await page.getByLabel('商品排序').selectOption('price-down');expect(await page.locator('.product-title-row > span').allTextContents()).toEqual(['¥268','¥238','¥198','¥168','¥158','¥128']);
 await page.getByLabel('商品排序').selectOption('recommended');
});
await record('首屏三株真实切换与对应详情',async()=>{
 await page.getByRole('button',{name:'展示自在龟背竹',exact:true}).click();await expect(page.getByRole('button',{name:'展示自在龟背竹',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.specimen-label')).toContainText('¥198');
 await page.locator('.specimen-label button').click();await expect(page.getByRole('dialog',{name:'自在龟背竹',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.specimen-label button')).toBeFocused();
 await page.getByRole('button',{name:'展示一株橡皮树',exact:true}).click();
});
await record('详情加入 → 购物袋单窗口/隐藏固定条/焦点循环',async()=>{
 await page.locator('.product-title-row button').first().click();await page.getByRole('dialog').getByRole('button',{name:'加入购物袋',exact:true}).click();await expect(page.locator('.mobile-bag-dock')).toHaveCount(0);
 await page.getByRole('button',{name:'已放入 1 件 · 查看购物袋'}).click();await expect(page.getByRole('dialog')).toHaveCount(1);await expect(cart()).toBeVisible();await expect(cart()).toBeFocused();await expect(page.locator('.mobile-bag-dock')).toHaveCount(0);
 await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'生成订单摘要'})).toBeFocused();await page.keyboard.press('Tab');await expect(cart().getByRole('button',{name:'关闭',exact:true})).toBeFocused();
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await closeBag();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
 await expect(page.locator('.mobile-bag-dock')).toBeVisible();
});
await record('手机固定购物袋条键盘Enter开启/Esc关闭焦点返回',async()=>{await page.locator('.mobile-bag-dock button').focus();await page.keyboard.press('Enter');await expect(cart()).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.mobile-bag-dock button')).toBeFocused()});
await record('单品168+18运费/两件包邮/摘要失效/清空',async()=>{
 await page.locator('.mobile-bag-dock button').click();await expect(page.locator('.grand-total strong')).toHaveText('¥186');await expect(page.locator('.shipping-progress')).toContainText('¥131');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','168');
 await page.getByRole('button',{name:'增加一株橡皮树数量',exact:true}).click();await expect(page.locator('.grand-total strong')).toHaveText('¥336');await expect(page.locator('.shipping-progress')).toContainText('已享包邮');await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','299');
 await page.getByRole('button',{name:'生成订单摘要'}).click();await expect(page.locator('.order-success')).toContainText('未创建真实订单');await page.getByRole('button',{name:'减少一株橡皮树数量',exact:true}).click();await expect(page.locator('.order-success')).toHaveCount(0);await expect(page.locator('.grand-total strong')).toHaveText('¥186');
 await page.getByRole('button',{name:'减少一株橡皮树数量',exact:true}).click();await expect(page.locator('.empty-cart')).toBeVisible();await closeBag();await expect(page.locator('.mobile-bag-dock')).toHaveCount(0);
});
await record('跨商品296+18=314与464包邮/刷新持久化',async()=>{
 await page.getByRole('button',{name:'添加一株橡皮树到购物袋',exact:true}).click();await page.getByRole('button',{name:'添加山丘陶器到购物袋',exact:true}).click();await openBag();await expect(page.locator('.grand-total strong')).toHaveText('¥314');
 await page.getByRole('button',{name:'增加一株橡皮树数量',exact:true}).click();await expect(page.locator('.grand-total strong')).toHaveText('¥464');await page.reload();await expect(page.locator('.bag-button')).toHaveAttribute('aria-label','打开购物袋，3件商品');await openBag();await expect(page.locator('.grand-total strong')).toHaveText('¥464');await closeBag();
});
for(const raw of ['null','[]','invalidJSON','{"99":1,"1":-1,"2":1.5,"3":"1","4":100}']){
 await record(`非法本地数据恢复：${raw}`,async()=>{await seed(raw);await expect(page.locator('.bag-button')).toHaveAttribute('aria-label','打开购物袋，0件商品');await openBag();await expect(page.locator('.empty-cart')).toBeVisible();await closeBag()});
}
await record('混合本地数据保留有效值/99上限禁用/Tab排除禁用',async()=>{
 await seed('{"1":99,"2":2,"3":0,"9":3}');await expect(page.locator('.bag-button')).toHaveAttribute('aria-label','打开购物袋，101件商品');await expect(page.getByRole('button',{name:'添加一株橡皮树到购物袋'})).toBeDisabled();await openBag();await expect(page.getByRole('button',{name:'增加一株橡皮树数量'})).toBeDisabled();
 for(let i=0;i<9;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement.closest('[role="dialog"]'))).toBe(true)}await closeBag();
});
await record('Storage写入被拒绝：可见提示+会话可操作+刷新不假保存',async()=>{
 const blocked=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});blocked.on('pageerror',e=>errors.push(e.message));
 await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage denied','SecurityError')}});await blocked.goto(url);await blocked.getByRole('button',{name:'添加一株橡皮树到购物袋'}).click();await blocked.locator('.mobile-bag-dock button').click();await expect(blocked.locator('.storage-note')).toHaveText('浏览器未允许保存，购物袋仅在当前页面保留。');await blocked.getByRole('button',{name:'增加一株橡皮树数量'}).click();await expect(blocked.locator('.grand-total strong')).toHaveText('¥336');await blocked.getByRole('button',{name:'生成订单摘要'}).click();await expect(blocked.locator('.order-success')).toBeVisible();await blocked.screenshot({path:`${out}/organic-storage-denied.png`});await blocked.reload();await expect(blocked.locator('.bag-button')).toHaveAttribute('aria-label','打开购物袋，0件商品');await blocked.close();
});
await record('来信反馈为本地演示/移动菜单关闭/FAQ',async()=>{
 await seed('{}');await page.getByRole('button',{name:'切换导航'}).click();await expect(page.locator('.nav-links')).toBeVisible();await page.locator('.nav-links').getByRole('link',{name:'养护小记'}).click();await expect(page.getByRole('button',{name:'切换导航'})).toHaveAttribute('aria-expanded','false');
 await page.getByText('这里可以真实下单吗？',{exact:true}).click();await expect(page.locator('.faq-list details[open] p')).toContainText('不会付款');await page.getByLabel('你的电子邮箱').fill('garden@example.com');await page.getByRole('button',{name:'订阅森间来信'}).click();await expect(page.locator('.subscribe-success')).toContainText('不发送邮件');
});
for(const width of [320,390,1440]){
 await record(`${width}px完整布局/截图/移动触控与输入字号`,async()=>{
  await page.setViewportSize({width,height:900});await seed('{}');await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});await page.mouse.move(0,0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${out}/organic-${width}-after.png`,fullPage:true});await page.screenshot({path:`${out}/organic-${width}-hero.png`});await page.locator('#collection').evaluate(n=>window.scrollTo(0,n.offsetTop));await page.screenshot({path:`${out}/organic-${width}-collection.png`});
  if(width<700){const small=await page.locator('button,input,select,a').evaluateAll(nodes=>nodes.filter(n=>{let r=n.getBoundingClientRect();return r.width>0&&r.height>0&&!n.classList.contains('skip-link')&&r.height<43.9}).map(n=>({text:n.textContent,cls:n.className,h:n.getBoundingClientRect().height})));expect(small).toEqual([]);for(const selector of ['.email-field input','.collection-options select'])expect(Number.parseFloat(await page.locator(selector).evaluate(n=>getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(16)}
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));expect(new Set(ids).size).toBe(ids.length);
  await page.getByRole('button',{name:'添加一株橡皮树到购物袋'}).click();await page.evaluate(()=>document.activeElement?.blur());await page.locator('.product-card').first().scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/organic-${width}-added.png`});
  if(width<700){await expect(page.locator('.toast')).toHaveCount(0);await page.locator('footer').scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));const footerBottom=await page.locator('.footer-bottom').boundingBox();const dockTop=await page.locator('.mobile-bag-dock').boundingBox();expect(footerBottom.y+footerBottom.height).toBeLessThanOrEqual(dockTop.y);await page.screenshot({path:`${out}/organic-${width}-footer-bag.png`})}
  await openBag();await page.screenshot({path:`${out}/organic-${width}-bag.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await closeBag();
 });
}
await record('减少动态：商品hover无变换/滚动无平滑',async()=>{await page.locator('.product-art-button').first().hover();expect(await page.locator('.product-art-button svg').first().evaluate(n=>getComputedStyle(n).transform)).toBe('none');expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')});
await record('运行无异常',async()=>expect(errors).toEqual([]));
await fs.writeFile(`${out}/organic-results.json`,JSON.stringify({url,date:new Date().toISOString(),results,errors},null,2));
console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,failures:results.filter(x=>!x.pass)},null,2));await browser.close();
