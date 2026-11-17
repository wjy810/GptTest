import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const results=[];
try{
for(const site of ['restaurant','arcade']){
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.goto(`http://127.0.0.1:4173/${site}/`);await p.screenshot({path:`artifacts/reviews/batch03-${site}-${width}-before.png`,fullPage:true});results.push({site,width,...await p.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,duplicates:[...document.querySelectorAll('[id]')].map(n=>n.id).filter((x,i,a)=>a.indexOf(x)!==i)})),errors:[...errors]});}
 if(site==='restaurant'){
  await p.locator('#booking-date').fill('2026-11-23');await p.getByRole('button',{name:'生成预约意向'}).click();results.push({site,mondayAccepted:await p.getByRole('dialog').isVisible(),advertisedHours:await p.locator('.visit').innerText()});
 }
 if(site==='arcade'){
  await p.evaluate(()=>localStorage.setItem('p1xel-scores',JSON.stringify([{ms:200,date:'2026-11-17T00:00:00.000Z',mode:'标准'},null])));await p.reload();results.push({site,mixedStorageRows:await p.locator('.score-row').count(),errors:[...errors]});
  await p.getByRole('button',{name:'看看规则',exact:true}).first().click();const d=p.getByRole('dialog');const box=await d.boundingBox();await p.mouse.click(box.x+5,box.y+5);results.push({site,dialogClosedByInnerPadding:!(await d.isVisible())});
 }
 await p.close();
}
await writeFile('artifacts/reviews/batch03-before.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await b.close()}
