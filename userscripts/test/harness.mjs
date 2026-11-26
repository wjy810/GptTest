// 会话守护脚本的本地模拟测试台：用 Playwright 打开一个假的 claude.ai 页面，
// 注入 GM_* 垫片与用户脚本，接口由下面的模拟服务器按场景回应。
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPT_PATH = process.env.CSG_SCRIPT || path.join(here, '..', 'claude-session-guard.user.js');

const iso = (minAgo) => new Date(Date.now() - minAgo * 60000).toISOString();
export const ua = (browser, os) => ({ browser_family: browser, browser_version: '130', os_family: os, os_version: '' });
export const row = (o) => Object.assign({ is_current: false, location_info: { city: 'Tokyo', country: 'JP' } }, o);
export { iso };

// server.revoke(body, state) -> { status, json } ；默认语义：
//  - application_slug 缺省为 claude-ai；必须和会话自己的一致才算命中
//  - 按 session_uuid（有就用）或 created_at 定位；找不到 = 200 但什么也不做（幂等）
export function defaultRevoke(body, state) {
  if (!body || (body.session_uuid == null && !('created_at' in body))) return { status: 400, json: { error: 'missing session' } };
  const slug = body.application_slug || 'claude-ai';
  const i = state.sessions.findIndex((s) =>
    (s.application_slug || 'claude-ai') === slug &&
    (body.session_uuid != null ? s.session_uuid === body.session_uuid : s.created_at === body.created_at));
  if (i >= 0) {
    if (state.sessions[i].is_current) state.selfLoggedOut = true;
    state.sessions.splice(i, 1);
  }
  return { status: 200, json: {} };
}

export async function run({ sessions, revoke = defaultRevoke, gm = {}, seconds = 8, nativeScript = null, onTick = null, extraApi = null }) {
  const state = { sessions: JSON.parse(JSON.stringify(sessions)), revokes: [], extra: [], selfLoggedOut: false, listReads: 0, extraApi, t0: Date.now() };
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[会话守护]')) logs.push(t.slice(7)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  await page.route('https://claude.ai/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.pathname === '/api/auth/sessions/list-active') {
      state.listReads++;
      if (state.selfLoggedOut) return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.sessions) });
    }
    if (u.pathname === '/api/auth/logout/session' && req.method() === 'POST') {
      let body = null; try { body = JSON.parse(req.postData() || 'null'); } catch (e) {}
      const r = revoke(body, state);
      state.revokes.push({ body, status: r.status });
      return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.json || {}) });
    }
    if (u.pathname.startsWith('/api/')) {
      const r = state.extraApi ? state.extraApi(req, state) : null;
      state.extra.push({ method: req.method(), path: u.pathname, body: req.postData() || null, headers: req.headers(), status: r ? r.status : 404 });
      if (r) return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.json || {}) });
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><title>mock</title></head><body><main>mock claude.ai</main></body></html>' });
  });
  const gmInit = Object.assign({ interval: 1, maxPerRound: 1, lastVer: '__skip__' }, gm);
  const shim = `
    (function(){
      const store = ${JSON.stringify(gmInit)};
      window.__gm = store; window.__menu = {};
      window.GM_getValue = (k, d) => (k in store && store[k] !== undefined ? JSON.parse(JSON.stringify(store[k])) : d);
      window.GM_setValue = (k, v) => { if (v === undefined) delete store[k]; else store[k] = JSON.parse(JSON.stringify(v)); };
      window.GM_registerMenuCommand = (n, f) => { window.__menu[n] = f; };
      window.unsafeWindow = window;
      window.confirm = () => true;
    })();`;
  const src = readFileSync(SCRIPT_PATH, 'utf8');
  await page.addInitScript({ content: shim + '\n' + src });
  if (nativeScript) await page.addInitScript({ content: nativeScript });
  state.page = page;
  await page.goto('https://claude.ai/settings/account');
  await page.waitForTimeout(500);
  await page.evaluate(() => { const k = Object.keys(window.__menu).find((n) => n.includes('启动')); return window.__menu[k](); });
  const t0 = Date.now();
  state.t0 = t0;
  while (Date.now() - t0 < seconds * 1000) {
    await page.waitForTimeout(250);
    if (onTick) await onTick(state, page);
  }
  const gmStore = await page.evaluate(() => window.__gm);
  await browser.close();
  delete state.page;
  return { state, logs, gm: gmStore };
}
