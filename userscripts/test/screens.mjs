// 截面板图：一条网页会话被踢掉（出现“表格可能是旧的”提示），一条 Claude Code 会话踢不掉（显示失败、诊断、学习提示）
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { SCRIPT_PATH, row, ua, iso } from './harness.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = new URL('./screens/', import.meta.url).pathname;
const sessions = [
  row({ session_uuid: 'web-self', application_slug: 'claude-ai', created_at: iso(300), last_active_at: iso(0), is_current: true, user_agent: ua('Chrome', 'Windows') }),
  row({ session_uuid: 'web-a', application_slug: 'claude-ai', created_at: iso(200), last_active_at: iso(5), user_agent: ua('Firefox', 'Linux') }),
  row({ token_uuid: 'tok-1', application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' }),
];
const shim = `(function(){const store={intervalMin:3,intervalMax:8,maxPerRound:2,lastVer:'4.1.0'};window.__gm=store;window.__menu={};
window.GM_getValue=(k,d)=>(k in store&&store[k]!==undefined?JSON.parse(JSON.stringify(store[k])):d);
window.GM_setValue=(k,v)=>{if(v===undefined)delete store[k];else store[k]=JSON.parse(JSON.stringify(v));};
window.GM_registerMenuCommand=(n,f)=>{window.__menu[n]=f;};window.unsafeWindow=window;window.confirm=()=>true;})();`;
const browser = await chromium.launch();
for (const [name, opts] of [['desktop', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 }], ['mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
  for (const scheme of ['light', 'dark']) {
    const st = JSON.parse(JSON.stringify(sessions));
    const page = await browser.newPage(Object.assign({ colorScheme: scheme }, opts));
    await page.route('https://claude.ai/**', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.pathname === '/api/auth/sessions/list-active') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(st) });
      if (u.pathname === '/api/auth/logout/session') {
        const b = JSON.parse(req.postData() || '{}');
        if (b.application_slug === 'claude-code') return route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"use oauth token endpoint"}' });
        const i = st.findIndex((x) => x.session_uuid === b.session_uuid); if (i >= 0) st.splice(i, 1);
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui;background:${scheme === 'dark' ? '#1f1e1d' : '#faf9f5'};color:${scheme === 'dark' ? '#eee' : '#222'}}</style></head><body><main style="padding:24px">设置 → 账户（模拟页）</main></body></html>` });
    });
    await page.addInitScript({ content: shim + '\n' + readFileSync(SCRIPT_PATH, 'utf8') });
    await page.goto('https://claude.ai/settings/account');
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__menu[Object.keys(window.__menu).find((n) => n.includes('启动'))]());
    await page.waitForTimeout(5000);
    await page.evaluate(() => { window.__menu[Object.keys(window.__menu).find((n) => n.includes('打开'))](); document.querySelector('#csg-panel details').open = true; });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}panel-${name}-${scheme}.png` });
    if (name === 'desktop' && scheme === 'light') {
      await page.evaluate(() => { const p = document.getElementById('csg-panel'); p.style.maxHeight = 'none'; });
      await page.locator('#csg-panel').screenshot({ path: `${out}panel-full.png` });
    }
    const box = await page.evaluate(() => { const r = document.getElementById('csg-panel').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), vw: window.innerWidth }; });
    console.log(name, scheme, 'panel box:', JSON.stringify(box), box.left >= 0 && box.right <= box.vw ? 'fits' : 'CLIPPED');
    await page.close();
  }
}
// 读列表连续失败：黄灯 + 倒计时（退避时长带随机）
{
  let reads = 0;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await page.route('https://claude.ai/**', async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/api/auth/sessions/list-active') {
      if (++reads > 2) return route.abort('failed');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessions.slice(0, 1)) });
    }
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui;background:#faf9f5}</style></head><body><main style="padding:24px">设置 → 账户（模拟页）</main></body></html>' });
  });
  await page.addInitScript({ content: shim.replace('intervalMin:3,intervalMax:8', 'intervalMin:1,intervalMax:1') + '\n' + readFileSync(SCRIPT_PATH, 'utf8') });
  await page.goto('https://claude.ai/settings/account');
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__menu[Object.keys(window.__menu).find((n) => n.includes('启动'))]());
  await page.waitForTimeout(2600);
  await page.evaluate(() => { window.__menu[Object.keys(window.__menu).find((n) => n.includes('打开'))](); document.querySelector('#csg-panel details').open = true; });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}panel-backoff-mobile.png` });
  console.log('backoff reason:', await page.evaluate(() => document.getElementById('csg-reason').textContent));
  await page.close();
}
await browser.close();
console.log('ok');
