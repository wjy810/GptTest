import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={date:'2026-11-17',base:'http://127.0.0.1:4173',checks:[]};
async function record(name,run){await run();report.checks.push({name,result:'passed'});console.log('PASS',name)}
try{
for(const site of ['editorial','swiss','organic']){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto(`${report.base}/${site}/`);
  await record(`${site} ${width}px: single h1, no overflow, no duplicate IDs`,async()=>{
   const state=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,width:innerWidth,scroll:document.documentElement.scrollWidth,duplicates:[...document.querySelectorAll('[id]')].map(n=>n.id).filter((id,i,ids)=>ids.indexOf(id)!==i)}));assert.equal(state.h1,1);assert.equal(state.width,state.scroll);assert.deepEqual(state.duplicates,[]);
  });await page.screenshot({path:`artifacts/reviews/${site}-${width}-after.png`,fullPage:true});
 }
 if(site==='editorial'){
  await record('editorial: corrupted/invalid/duplicate stored bookmarks recover',async()=>{
   for(const value of ['{}','null','1','"hello"','not-json','["01","01","missing",3,null]']){
    await page.evaluate(v=>localStorage.setItem('folio-saved',v),value);await page.reload();assert.equal(await page.locator('h1').count(),1);
   }
   assert.equal(await page.getByRole('button',{name:'已收藏 (1)',exact:true}).count(),1);
   await page.evaluate(()=>localStorage.removeItem('folio-saved'));await page.reload();
  });
  await record('editorial: keyboard opens named article; focus restores after Escape',async()=>{
   const trigger=page.getByRole('button',{name:'阅读本期封面故事'});await trigger.focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:'一间房子，如何盛放安静'});assert.equal(await dialog.count(),1);assert.equal(await dialog.isVisible(),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
   await dialog.locator('.reader-save').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('dialog')),true);
   await page.getByRole('button',{name:'收藏这篇故事'}).click();await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  });
  await record('editorial: category filtering, bookmark persistence, empty state',async()=>{
   await page.reload();await page.getByRole('button',{name:'已收藏 (1)',exact:true}).click();assert.equal(await page.locator('.story').count(),1);
   await page.getByRole('button',{name:'取消收藏 一间房子，如何盛放安静',exact:true}).click();assert.equal(await page.locator('.empty-state').isVisible(),true);
   await page.getByRole('button',{name:'空间',exact:true}).click();assert.equal(await page.locator('.story').count(),2);
  });
  await record('editorial: valid local subscription gives explicit feedback',async()=>{await page.getByLabel('你的电子邮箱').fill('review@example.test');await page.getByRole('button',{name:'保存订阅意向'}).click();assert.match(await page.locator('small[role=status]').innerText(),/已保存在此浏览器/)});
 }
 if(site==='swiss'){
  await record('swiss: Arrow keys/Home/End roving date tabs',async()=>{
   await page.getByRole('tab').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-19').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#tab-19').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('.schedule-row').count(),3);
   await page.keyboard.press('End');assert.equal(await page.locator('#tab-20').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('#tab-18').getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#tab-20').getAttribute('aria-selected'),'true');
  });
  await record('swiss: named exhibition modal closes and restores focus',async()=>{
   const trigger=page.getByRole('button',{name:'查看秩序的另一面展览详情'});await trigger.click();const dialog=page.getByRole('dialog',{name:'秩序的另一面'});assert.equal(await dialog.isVisible(),true);await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
  });
  await record('swiss: three-day two-person ticket equals 316 and opens summary',async()=>{
   await page.locator('input[value=full]').check();await page.getByRole('button',{name:'增加人数'}).click();assert.match(await page.locator('.ticket-total').innerText(),/316/);assert.equal(await page.locator('.ticket-settings select').isDisabled(),true);await page.getByRole('button',{name:'查看预约摘要'}).click();const dialog=page.getByRole('dialog',{name:'好奇心，已就位。'});assert.match(await dialog.innerText(),/316/);assert.match(await dialog.innerText(),/18—20/);await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
  });
 }
 if(site==='organic'){
  await record('organic: plants filter and named product dialog',async()=>{
   await page.getByRole('button',{name:'有生命的绿'}).click();assert.equal(await page.locator('.product-card').count(),3);await page.getByRole('button',{name:'查看一株橡皮树详情'}).click();assert.equal(await page.getByRole('dialog',{name:'一株橡皮树'}).isVisible(),true);await page.getByRole('button',{name:'加入购物袋'}).click();await page.keyboard.press('Escape');
  });
  await record('organic: bag persists, shipping threshold recalculates, local summary works',async()=>{
   await page.reload();await page.getByRole('button',{name:'打开购物袋，1件商品'}).click();assert.match(await page.locator('.grand-total').innerText(),/186/);await page.getByRole('button',{name:'增加一株橡皮树数量'}).click();assert.match(await page.locator('.grand-total').innerText(),/336/);await page.getByRole('button',{name:'生成订单摘要'}).click();assert.match(await page.locator('.order-success').innerText(),/未创建真实订单/);await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'打开购物袋，2件商品'}).evaluate(el=>el===document.activeElement),true);
  });
  await record('organic: mobile menu and native FAQ toggles',async()=>{await page.getByRole('button',{name:'切换导航'}).click();assert.equal(await page.getByRole('navigation',{name:'主导航'}).isVisible(),true);await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'养护小记'}).click();assert.equal(await page.getByRole('button',{name:'切换导航'}).getAttribute('aria-expanded'),'false');await page.getByText('这里可以真实下单吗？',{exact:true}).click();assert.equal(await page.locator('details[open]').count(),1)});
 }
 await record(`${site}: reduced motion preference disables smooth scroll`,async()=>{await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto')});
 await record(`${site}: no page JavaScript exceptions in this pass`,async()=>assert.deepEqual(errors,[]));
 await page.close();
}
await writeFile('artifacts/reviews/after.json',JSON.stringify(report,null,2));
}finally{await browser.close()}
