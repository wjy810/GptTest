// ==UserScript==
// @name         Claude 会话守护（精简版）
// @namespace    https://claude.ai/
// @version      4.1.0
// @description  只保留本浏览器当前会话 + 你勾选的，其余自动踢掉（含 Claude Code 等非网页端会话）；走网页原生活动会话接口，默认每轮只踢 1 条并自检防误踢
// @match        https://claude.ai/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @sandbox      JavaScript
// @run-at       document-start
// ==/UserScript==

/*
 * v4.1.0（踢不掉时照网页自己的「终止」学）
 * - 不同应用的会话，服务端要的踢人请求可能完全不同（甚至是另一个接口）。脚本猜不到时，
 *   在 设置 → 账户 的会话列表里手动点一次那条会话的「终止」：脚本只观察网页自己发出的请求
 *   （方法、路径、body 里每个值对应会话的哪个字段），之后同一应用的会话照这个样子踢，照样重读列表确认真的消失。
 * - 只观察不改动：请求和返回原样交给网页；脚本自己的请求不经过这里；网页「退出本机」不会被学成踢人格式；
 *   学到的配方里有 null 值时同样遵守“不波及本机和保留会话”的规则。可以在面板「安全」里关掉（刷新页面生效）。
 * - 踢不掉时日志提示可以这样做；诊断里显示学到的配方。
 *
 * v4.0.2（修复：创建时间为空的 Claude Code 会话被当成“无法识别”留着不踢，日志还说“干净了”）
 * - 截图里那行「Claude Code · 未知 · 未知」：接口给的 created_at 是 null。v4.0.0 定位会话只认 session_uuid / created_at，
 *   两样都没有就标成“无法识别 · 不处理”，永远不踢，而且不算进“待踢”，于是日志照样写“✅ 干净了”。
 * - 现在：先找其它 id 字段；都没有就按“应用 + 客户端”给它一个稳定标识（可以勾选保留），
 *   踢的时候照网页那一行本来的样子发 { created_at: null, application_slug }。
 * - 安全：这种请求可能一次命中同应用里所有“没有创建时间”的会话，所以只在应用和本机不同、
 *   而且同类会话里没有被保留的时候才发；否则不动手并在日志里写明原因。
 * - 同一组有多条时，每次少一条就算踢掉一条，下一轮继续，不会误判成“踢不掉”。
 * - 还有认不出 / 踢不掉的会话时不再说“干净了”，并把它的字段结构（字段名、类型、应用、客户端）写进日志，方便排查。
 *
 * v4.0.1（修复：踢完之后 Claude Code 等非网页端会话残留）
 * - 原因：不带应用的 {session_uuid} 排在第一个；接口一返回 200 就把它记成“确认格式”，没等列表确认会话真的消失。
 *   踢 Claude Code / 桌面端 / iOS 会话时服务端按网页端处理 → “返回成功但还在”，之后只会隔一段时间重复同一种格式，永远踢不掉。
 * - 现在：带 application_slug 的格式优先；每次返回成功都重读列表，会话真的消失才记住格式；
 *   “返回成功但还在”立即在同一轮换下一种格式；格式按应用分别记（网页 / Claude Code / 桌面端互不影响）。
 * - 旧版存下的 uuid 格式作废；application 字段是对象时正确取出 slug（v4.0.0 会当成 "[object Object]"）。
 * - 会话接口字段按应用分别记日志（v4.0.0 只记第一条），方便看清 Claude Code 会话长什么样。
 *
 * v4.0.0（相对 v3.9.1）
 * - 只走网页原生活动会话接口：GET /api/auth/sessions/list-active 读列表，POST /api/auth/logout/session 踢人。
 * - 删除：页面点击踢人、自动刷新设置页 / 自动点侧栏 / 自动按 Esc、接口自学与地址探测、手填踢人接口、
 *   「受信任的设备」清理、多语言词表 / 日期解析 / UA 指纹；不再改写网页的 fetch。
 *   （仍在 document-start 注入，只是为了在页面脚本加载前拿到网页原始的 fetch，请求方式与 v3.9.1 一致。）
 * - 本机只认接口返回的 is_current，而且必须恰好 1 条；认不出就不动手。
 * - 保留名单改为按会话 ID；旧版按“创建时间分钟”保存的名单，第一次读到可靠列表时自动迁移。
 * - 勾选立即生效；停止状态下打开面板也会刷新列表；启动前列出“会保留 / 会踢出”。
 * - 多标签页：每次页面加载一个新 ID；租约 max(3×间隔, 15 秒)；前台标签可接手后台标签；停止后不再续租；
 *   「立即检测」在非负责的标签页只刷新列表。
 * - 接口返回成功但会话还在 → 这一条单独退避；踢后自检直接复用那次列表请求。
 * - 状态灯：限流 / 接口异常 / 401 / 认不出本机 显示黄色并写明原因。
 * - 日志、诊断、列表只在内容变化时重画；重复提示限频；修正“连续 403 自动停止”等过时文案。
 * - 「重置为默认」与「清除已保存会话」合并为「清除已保存数据」。
 */

(function () {
  'use strict';

  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  try { if (W.top !== W.self) return; } catch (e) { return; }

  const VERSION = '4.1.0';
  try { console.info('[会话守护] 已注入 v' + VERSION + '：', location.href); } catch (e) {}

  /* ================= 常量 ================= */
  const MIN_INTERVAL = 1;                 // 最低检测间隔（秒）
  const MAX_INTERVAL = 3600;
  const INTERVAL_PRESETS = [1, 3, 5, 15, 30, 60];
  const MAX_PER_ROUND = 15;
  const FETCH_TIMEOUT_MS = 12000;         // 每个请求（含读 body）最长 12 秒，卡住也不会拖死循环
  const LOG_MAX = 300;
  const API = {
    list: '/api/auth/sessions/list-active',
    revoke: '/api/auth/logout/session',
    app: 'claude-ai',
    headers: { accept: '*/*', 'content-type': 'application/json' },
  };
  // 存储键。会话缓存 / 领导权 / 状态用了新名字，避免和还没刷新的旧版标签页互相干扰
  const K = {
    enabled: 'enabled', interval: 'interval', dryRun: 'dryRun', maxPerRound: 'maxPerRound',
    keepIds: 'keepIds', keepMigrated: 'keepMigrated', legacyKeep: 'keepKeys',
    sessions: 'sessions4', leader: 'leader4', issue: 'issue4',
    logs: 'logs', kicked: 'kickedRun', shape: 'nativeShape', shapes: 'nativeShapes', fields: 'nativeFields2', ver: 'lastVer',
    recipes: 'nativeRecipes', learnNative: 'learnNative',
  };
  // 旧版留下、v4 已不用的键（升级时清掉）
  const OBSOLETE_KEYS = ['api', 'apiCands', 'apiItems', 'apiCurrentId', 'cleanTrusted', 'allowWeak', 'lastSessions', 'leader', 'nativeFields', 'nativeShape'];

  // 在页面脚本加载前拿到网页原始 fetch（只拿来用，不改写）
  const pageFetch = typeof W.fetch === 'function' ? W.fetch : null;
  // 每次页面加载一个新 ID：不放 sessionStorage，「复制标签页」不会出现两个同 ID 的标签
  const TAB_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

  /* ================= 存储 ================= */
  const get = (k, d) => {
    try { const v = GM_getValue(k, d); return v === undefined || v === null ? d : v; } catch (e) { return d; }
  };
  const set = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const clampInt = (v, lo, hi, d) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : d;
  };
  const CFG = {
    get enabled() { return !!get(K.enabled, false); },
    set enabled(v) { set(K.enabled, !!v); },
    get interval() { return clampInt(get(K.interval, 5), MIN_INTERVAL, MAX_INTERVAL, 5); },
    set interval(v) { set(K.interval, clampInt(v, MIN_INTERVAL, MAX_INTERVAL, 5)); },
    // 预演：只写日志不真踢
    // 观察网页自己的「终止」请求并照着学（只看不改）；改了要刷新页面才生效
    get learnNative() { return get(K.learnNative, true) !== false; },
    set learnNative(v) { set(K.learnNative, !!v); },
    get dryRun() { return !!get(K.dryRun, false); },
    set dryRun(v) { set(K.dryRun, !!v); },
    // 每轮最多踢几条：默认 1，出问题时损失最小
    get maxPerRound() { return clampInt(get(K.maxPerRound, 1), 1, MAX_PER_ROUND, 1); },
    set maxPerRound(v) { set(K.maxPerRound, clampInt(v, 1, MAX_PER_ROUND, 1)); },
  };
  const keepIds = () => { const a = get(K.keepIds, []); return Array.isArray(a) ? a.map(String) : []; };
  const keepSet = () => new Set(keepIds());
  const cachedList = () => { const a = get(K.sessions, []); return Array.isArray(a) ? a : []; };

  /* ================= 运行时状态（放在最前，避免 TDZ） ================= */
  let panel = null, fab = null, uiHost = null, uiStyle = null;
  let loopTimer = null, nextAt = 0, running = false;
  let mode = '';                          // '' 待机 / 'lead' 本页负责检测 / 'other' 另一个标签页负责
  let runGen = 0, runStartedAt = 0, starting = false, refreshing = false, lastRefreshAt = 0;
  let sessions = [], listSig = '', issue = null, dirty = true, connectedLogged = false;
  let authFails = 0, authFailAt = 0, kickSoonAt = 0;
  let listRenderSig = '', diagText = '', logText = '';
  // 每个应用（application_slug）各自“确认踢掉过”的请求格式。
  // v4.0.0 只记一种、而且收到 200 就记，没确认会话是否真的消失：网页端学到的格式拿去踢 Claude Code，会一直“成功但没踢掉”
  let shapeBySlug = (() => {
    const m = get(K.shapes, null);
    if (m && typeof m === 'object' && !Array.isArray(m)) return m;
    const old = String(get(K.shape, '') || '');
    const migrated = old && old !== 'uuid' ? { [API.app]: old } : {};
    if (old) set(K.shapes, migrated);
    return migrated;
  })();
  const net = { failN: 0, coolUntil: 0, lastOkAt: 0, lastErr: '' };
  const fails = new Map();                // 会话 id → { n, until }：踢不掉的会话按条退避
  const dryLogged = new Set();            // 预演：同一会话只记一次
  const learnHinted = new Set();          // “手动终止一次让脚本学”的提示：每个应用只提示一次
  const throttleAt = new Map();           // 限频日志

  /* ================= 工具 ================= */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = (ms) => (Number.isFinite(ms) && ms > 0 ? new Date(ms).toLocaleString() : '');
  const desc = (s) => `${s.device}${s.location ? ' · ' + s.location : ''}`;
  const toMs = (v) => {
    if (v == null || v === '') return NaN;
    if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
    const str = String(v).trim();
    if (!/[a-z]/i.test(str) && !isNaN(Number(str))) { const n = Number(str); return n > 1e12 ? n : n * 1000; }
    return Date.parse(str);
  };
  const firstDef = (o, keys) => {
    for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k];
    return '';
  };

  /* ================= 日志 ================= */
  function log(msg) {
    msg = String(msg);
    try { console.log('[会话守护]', msg); } catch (e) {}
    const logs = get(K.logs, []);
    set(K.logs, [`[${new Date().toLocaleString()}] ${msg}`, ...(Array.isArray(logs) ? logs : [])].slice(0, LOG_MAX));
    renderLog();
  }
  // 同一类提示在 ms 毫秒内只记一次，避免每轮刷屏把有用的日志挤掉
  function logEvery(key, ms, msg) {
    const now = Date.now();
    if (now - (throttleAt.get(key) || 0) < ms) return;
    throttleAt.set(key, now);
    log(msg);
  }

  function exportLogs() {
    const all = get(K.logs, []);
    const logs = (Array.isArray(all) ? all : []).slice().reverse();
    if (!logs.length) { log('没有日志可导出'); return; }
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const name = `claude-会话守护日志-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.txt`;
    const url = URL.createObjectURL(new Blob([logs.join('\r\n')], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    (document.body || document.documentElement).appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
  }

  /* ================= 状态提示（限流 / 接口异常 / 401） ================= */
  // 写进存储：另一个标签页的面板也能看到负责检测的那个标签页遇到了什么
  function setIssue(code, text, until) {
    const next = { code, text, until: until || 0 };
    if (issue && issue.code === next.code && issue.text === next.text && issue.until === next.until) return;
    issue = next;
    set(K.issue, issue);
    renderStatus();
  }
  function clearIssue() {
    const had = !!issue;
    issue = null;
    if (get(K.issue, null)) set(K.issue, null);   // 连上一次页面留下的旧状态一起清掉
    if (had) renderStatus();
  }
  // 临时错误（限流、5xx、网络、验证页）：指数退避，最长 5 分钟，不会自动停止守护
  function backoff(text) {
    net.failN++;
    const wait = Math.min(5000 * Math.pow(2, net.failN - 1), 5 * 60000);
    net.coolUntil = Date.now() + wait;
    net.lastErr = text;
    setIssue('net', text, net.coolUntil);
    if (CFG.enabled) logEvery('net:' + text, 60000, `⛔ ${text}，${Math.round(wait / 1000)} 秒后自动重试`);
  }
  // 接口看起来改版了（404 / 格式不对）：隔一段时间再试
  function pauseFor(ms, code, text) {
    net.coolUntil = Date.now() + ms;
    net.lastErr = text;
    setIssue(code, text, net.coolUntil);
    if (CFG.enabled) logEvery(code, 10 * 60000, `⛔ ${text}`);
  }
  // 单次 401 不立刻停：登录态刷新时偶尔会闪一下。2 分钟内连续 2 次才认定本机真的掉线
  function on401(where) {
    net.lastErr = `${where}返回 401`;
    setIssue('auth', `${where}返回 401：登录状态可能已失效`);
    if (!CFG.enabled) return false;
    const now = Date.now();
    if (now - authFailAt > 120000) authFails = 0;
    authFails++; authFailAt = now;
    if (authFails >= 2) {
      authFails = 0;
      log(`🛑 ${where}连续返回 401：本机登录状态已经失效（很可能踢到了自己），已停止守护`);
      stopGuard(where + ' 401');
      return true;
    }
    net.coolUntil = Math.max(net.coolUntil, now + 3000);
    log(`⚠️ ${where}返回 401，先暂停这一轮，稍后再确认一次`);
    return false;
  }

  /* ================= 网络 ================= */
  // 所有请求都带超时，并且在超时内把 body 读完：休眠唤醒、切网络、代理断流都不会让这一轮永远不返回
  async function request(url, opts) {
    const f = pageFetch || W.fetch;
    const ac = new AbortController();
    const timer = setTimeout(() => { try { ac.abort(); } catch (e) {} }, FETCH_TIMEOUT_MS);
    try {
      const res = await f.call(W, url, Object.assign({ credentials: 'include' }, opts || {}, { signal: ac.signal }));
      let text = null;
      try { text = await res.text(); } catch (e) { text = null; }
      return { ok: !!res.ok, status: res.status, text };
    } catch (e) {
      return { ok: false, status: 0, text: null };
    } finally {
      clearTimeout(timer);
    }
  }

  // 接口字段 → 统一结构
  // 应用标识：可能是字符串，也可能是 { slug, name } 这样的对象
  function slugOf(o) {
    let v = firstDef(o, ['application_slug', 'applicationSlug', 'app_slug', 'application', 'app']);
    if (v && typeof v === 'object') v = firstDef(v, ['slug', 'application_slug', 'applicationSlug']);
    return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  }
  function appNameOf(o) {
    let v = firstDef(o, ['application_name', 'applicationName', 'app_name']);
    if (!v) { const a = o.application || o.app; if (a && typeof a === 'object') v = firstDef(a, ['name', 'display_name', 'displayName']); }
    return typeof v === 'string' ? v : '';
  }

  const UUID_KEYS = ['session_uuid', 'sessionUuid', 'session_id', 'sessionId', 'uuid', 'id'];
  const CREATED_KEYS = ['created_at', 'createdAt', 'creation_date'];
  // 其它可能用来定位会话的字段（token / grant 之类的 id）；账号、组织、设备、应用自己的 id 不算
  const ALT_ID_RE = /(uuid|_id|Id)$/;
  const NOT_SESSION_ID_RE = /^(account|user|org|organization|member|device|application|app|parent|workspace|project)/i;
  function altIdsOf(o) {
    const out = [];
    for (const k of Object.keys(o)) {
      if (UUID_KEYS.includes(k) || !ALT_ID_RE.test(k) || NOT_SESSION_ID_RE.test(k)) continue;
      const v = o[k];
      if ((typeof v === 'string' && v) || (typeof v === 'number' && Number.isFinite(v))) out.push([k, String(v)]);
    }
    return out;
  }

  function normSession(o, i) {
    o = o && typeof o === 'object' ? o : {};
    const ua = o.user_agent || o.userAgent || o.ua || {};
    const uaObj = ua && typeof ua === 'object' ? ua : {};
    const uaStr = typeof ua === 'string' ? ua : '';
    const locRaw = o.location_info || o.locationInfo || (o.location && typeof o.location === 'object' ? o.location : null);
    const loc = locRaw && typeof locRaw === 'object' ? locRaw : {};
    const createdRaw = firstDef(o, CREATED_KEYS);
    const updRaw = firstDef(o, ['last_active_at', 'lastActiveAt', 'updated_at', 'updatedAt', 'last_seen_at', 'last_used_at']);
    const cMs = toMs(createdRaw), uMs = toMs(updRaw);
    const uuid = String(firstDef(o, UUID_KEYS) || '');
    const appSlug = slugOf(o);
    const name = [uaObj.browser_family || uaObj.browser, uaObj.browser_version || uaObj.browserVersion,
      uaObj.os_family || uaObj.os, uaObj.os_version || uaObj.osVersion].filter(Boolean).join(' / ').slice(0, 90);
    // 有 session_uuid 用它；没有就用原始 created_at（踢人请求本来也靠它定位）；再没有就用其它 id 字段。
    // 创建时间是空的（网页上显示“未知”，Claude Code 会话常见）而且什么 id 都没有：按“应用 + 客户端”归成一组。
    // v4.0.0 把这种会话当成“无法识别、不处理”，日志还会说“干净了”——这就是踢完之后的残留。
    const createdNull = createdRaw === '';
    const alt = uuid ? [] : altIdsOf(o);
    const uaSig = (uaStr || [uaObj.browser_family || uaObj.browser, uaObj.os_family || uaObj.os, uaObj.device_family].filter(Boolean).join('/'))
      .replace(/[\d.]+/g, '#').slice(0, 80);
    let id = uuid || (createdRaw !== '' ? 'c:' + createdRaw : '');
    if (!id && alt.length) id = 'k:' + alt[0][0] + '=' + alt[0][1];
    if (!id && createdNull && appSlug) id = 'z:' + appSlug + '|' + uaSig;
    return {
      id: id || `n${i}`,
      kickable: !!id,
      uuid,
      createdRaw,
      createdNull,
      alt,
      raw: o,
      appSlug,
      key: Number.isFinite(cMs) ? String(Math.floor(cMs / 60000)) : '',   // 只用于迁移旧版保留名单
      device: name || String(o.device_name || '').slice(0, 90) || appNameOf(o).slice(0, 90) || uaStr.slice(0, 90) || appSlug || '(未知设备)',
      location: [loc.city, loc.region, loc.country || loc.country_code].filter(Boolean).join(', '),
      created: Number.isFinite(cMs) ? fmtTime(cMs) : String(createdRaw || ''),
      updated: Number.isFinite(uMs) ? fmtTime(uMs) : '',
      isCurrent: !!(o.is_current || o.isCurrent || o.current),
    };
  }

  // 按应用分别记字段：网页端和 Claude Code 等其它应用的会话字段可能不一样（v4.0.0 只看第一条）
  function noteFields(arr) {
    const saved = get(K.fields, {});
    const map = saved && typeof saved === 'object' && !Array.isArray(saved) ? Object.assign({}, saved) : {};
    let changed = false;
    for (const o of arr) {
      if (!o || typeof o !== 'object') continue;
      const slug = slugOf(o) || '未标应用';
      const sig = Object.keys(o).sort().join(',');
      if (map[slug] === sig) continue;
      map[slug] = sig; changed = true;
      log(`🔍 会话接口字段（${slug}）：${sig}`);
    }
    if (changed) set(K.fields, map);
  }

  // 返回 { status: 'ok', list } / 'cool'（退避中，没发请求）/ 'auth'（401）/ 'err'
  async function readList(force) {
    if (!force && Date.now() < net.coolUntil) return { status: 'cool' };
    const r = await request(API.list, { headers: API.headers });
    if (r.status === 401) { on401('会话接口'); return { status: 'auth' }; }
    if (!r.ok) {
      if (r.status === 404) pauseFor(10 * 60000, 'gone', '原生会话接口返回 404（可能改版了），10 分钟后再试');
      else backoff(r.status ? `会话接口返回 ${r.status}` : '读取会话接口超时或网络错误');
      return { status: 'err' };
    }
    let data = null;
    try { data = r.text == null ? null : JSON.parse(r.text); } catch (e) { data = null; }
    if (data == null) { backoff('会话接口返回的不是 JSON（可能是人机验证页）'); return { status: 'err' }; }
    const arr = Array.isArray(data) ? data : (data.sessions || data.data || data.items);
    if (!Array.isArray(arr)) { pauseFor(5 * 60000, 'shape', '会话接口返回格式变了，5 分钟后再试'); return { status: 'err' }; }
    net.failN = 0; net.coolUntil = 0; net.lastOkAt = Date.now(); net.lastErr = '';
    authFails = 0;
    if (issue && CFG.enabled) log('✅ 会话接口恢复正常');
    clearIssue();
    noteFields(arr);
    nativeRows = arr;
    return { status: 'ok', list: arr.map(normSession) };
  }

  // 踢人请求：application_slug 必须和这条会话自己的一致（iOS / 桌面端 / 网页端 / Claude Code 不同）。
  // 不带应用的 {session_uuid} 会被服务端按网页端处理：踢别的应用的会话时常常“返回成功、其实没踢掉”，所以排到最后。
  // 每个应用各自记住“确认踢掉过”的格式并优先使用。
  // created_at: null 这种请求可能一次命中同应用里所有“没有创建时间”的会话，所以只在不可能波及本机和保留会话时才用
  function nullBodySafe(s, list) {
    if (!s.appSlug) return false;
    const keep = keepSet();
    for (const x of list || []) {
      if (x.isCurrent && (x.appSlug || API.app) === s.appSlug) return false;      // 和本机是同一种应用：不冒险
      if (!x.isCurrent && x.appSlug === s.appSlug && x.createdNull && keep.has(x.id)) return false;
    }
    return true;
  }

  function revokeBodies(s, list) {
    const slug = s.appSlug || API.app;
    const out = [];
    const nb = nativeBody(s, list);
    if (nb) out.push(nb);
    if (s.uuid) {
      out.push({ name: 'uuid+slug', body: { session_uuid: s.uuid, application_slug: slug } });
      if (s.createdRaw !== '') out.push({ name: 'uuid+created+slug', body: { session_uuid: s.uuid, created_at: s.createdRaw, application_slug: slug } });
    }
    if (s.createdRaw !== '') out.push({ name: 'raw+slug', body: { created_at: s.createdRaw, application_slug: slug } });
    for (const [k, v] of s.alt || []) out.push({ name: `${k}+slug`, body: { session_uuid: v, application_slug: slug } });
    if (s.uuid) out.push({ name: 'uuid', body: { session_uuid: s.uuid } });
    // 没有创建时间（网页上显示“未知”）：照网页列表里这一行本来的样子发 created_at: null + 应用
    if (s.createdNull && nullBodySafe(s, list)) out.push({ name: 'null+slug', body: { created_at: null, application_slug: slug } });
    const i = out.findIndex((x) => x.name === shapeBySlug[slug]);
    if (i > 0) out.unshift(out.splice(i, 1)[0]);
    return out;
  }

  function learnShape(s, name) {
    const slug = s.appSlug || API.app;
    if (shapeBySlug[slug] === name) return;
    shapeBySlug = Object.assign({}, shapeBySlug, { [slug]: name });
    set(K.shapes, shapeBySlug);
    log(`🧠 踢人请求格式确认（${slug}）：${name}`);
  }

  // 踢完重读列表：既确认本机还在，也确认目标真的消失了（服务端可能晚一点才从列表里删掉）。
  // self: true = 本机还在；false = 读到了列表但都没有本机；null = 一直没读到 / 被中止，无法判断
  async function verifyGone(target, alive, before) {
    let sawList = false, sawSelf = false, last = null;
    const waits = [0, 600, 1200, 2000];
    for (let i = 0; i < waits.length; i++) {
      if (waits[i]) await sleep(waits[i]);
      if (!alive() || !CFG.enabled) return { self: null, gone: false, list: last };
      const r = await readList(true);
      if (r.status === 'ok') {
        sawList = true; last = r.list;
        if (r.list.some((x) => x.isCurrent)) {
          sawSelf = true;
          if (r.list.filter((x) => x.id === target.id).length < before) return { self: true, gone: true, list: r.list };
        }
      }
      if (!CFG.enabled) return { self: null, gone: false, list: last };   // 比如连续 401 已经停了
    }
    return { self: sawSelf ? true : sawList ? false : null, gone: false, list: last };
  }

  // 对一条会话依次尝试各种请求格式。接口每次返回成功都重读列表确认：
  // 真的消失了才算踢掉并记住格式；“返回成功但还在”就立刻换下一种，而不是隔一段时间重复同一种。
  // done: 'gone' 踢掉了 / 'fail' 这一条暂时踢不掉 / 'abort' 这一轮停手（登录、限流、自检、被中止）
  async function kickOne(s, alive, list) {
    const tried = [];
    const before = Math.max(1, (list || []).filter((x) => x.id === s.id).length);
    const bodies = revokeBodies(s, list);
    if (!bodies.length && s.createdNull && s.appSlug) {
      tried.push('这条只能按「应用 + 创建时间为空」整组踢，会连带本机或保留的同类会话，为了安全没有动手');
    }
    for (const { name, body, url, method, headers } of bodies) {
      if (!alive() || !CFG.enabled || !stillLead()) return { done: 'abort', tried };
      if (keepSet().has(s.id)) return { done: 'abort', tried };               // 刚被勾上保留
      const r = await request(url || API.revoke, {
        method: method || 'POST',
        headers: Object.assign({}, API.headers, headers || {}),
        body: body === undefined || body === null ? undefined : JSON.stringify(body),
      });
      if (!alive()) return { done: 'abort', tried };
      if (r.status === 401) { on401('踢人接口'); return { done: 'abort', tried }; }
      if (r.status === 429) { backoff('踢人接口被限流（429）'); return { done: 'abort', tried }; }
      if (!r.ok) {
        tried.push(`${name} → ${r.status || '网络错误或超时'}`);
        if (!r.status || r.status === 403 || r.status >= 500) return { done: 'fail', tried };   // 不是格式问题，换格式也没用
        const t = String(r.text || '').replace(/\s+/g, ' ').slice(0, 160);
        logEvery(`rej:${s.appSlug}:${name}:${r.status}`, 10 * 60000,
          `🔍 诊断：踢人请求格式「${name}」被拒（${r.status}，应用 ${s.appSlug || '未标'}）${t ? '：' + t : ''}`);
        continue;
      }
      const chk = await verifyGone(s, alive, before);
      if (!alive()) return { done: 'abort', tried };
      if (chk.list) updateList(chk.list);
      if (chk.self === false) {
        if (CFG.enabled) { log('🛑 踢完之后多次确认都找不到本机会话（可能踢到了自己），已立刻停止守护'); stopGuard('自检失败'); }
        return { done: 'abort', tried };
      }
      if (chk.self === null) {
        if (CFG.enabled) log(`⚠️ 已发出踢出「${desc(s)}」的请求，但暂时读不到会话列表确认结果，这一轮先停手`);
        return { done: 'abort', tried };
      }
      if (chk.gone) { learnShape(s, name); return { done: 'gone', tried, list: chk.list }; }
      tried.push(`${name} → 返回成功但还在列表里`);
      logEvery(`noeff:${s.appSlug}:${name}`, 10 * 60000,
        `🔍 诊断：格式「${name}」返回成功，但「${desc(s)}」还在列表里（应用 ${s.appSlug || '未标'}），换下一种格式`);
    }
    return { done: 'fail', tried };
  }

  /* ================= 学习网页原生的「终止」请求（只观察，不改动） ================= */
  // 在 claude.ai 设置页手动点某条会话的「终止」时，记下网页自己发的请求：方法、路径、body 里每个值对应会话的哪个字段。
  // 之后同一应用的会话照这个样子踢（同样重读列表确认真的消失了）。请求和返回原样交给网页，脚本自己的请求不经过这里。
  let recipes = (() => { const m = get(K.recipes, null); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; })();
  let nativeRows = [];                    // 最近一次（脚本或网页自己）读到的原始会话列表
  const NATIVE_PATH_RE = /logout|revoke|terminate|session|token|oauth|grant/i;
  const isIdField = (f) => !/slug|application|^app/i.test(f);

  function headersOf(h) {
    const out = {};
    const add = (k, v) => { if (/^anthropic-/i.test(k)) out[String(k).toLowerCase()] = String(v); };
    try {
      if (!h) return out;
      if (Array.isArray(h)) h.forEach((kv) => add(kv[0], kv[1]));
      else if (typeof h.forEach === 'function') h.forEach((v, k) => add(k, v));
      else Object.keys(h).forEach((k) => add(k, h[k]));
    } catch (e) {}
    return out;
  }

  // 在原始会话里找值等于 v 的字段：null 只认同名字段；太短的值容易撞，也只认同名字段
  function fieldFor(r, k, v) {
    if (v === null) return k in r && r[k] === null ? k : '';
    if (typeof v !== 'string' && typeof v !== 'number') return '';
    if (k in r && r[k] === v) return k;
    if (String(v).length < 8) return '';
    return Object.keys(r).find((rk) => r[rk] === v) || '';
  }

  function buildRecipe(info, r) {
    let idHits = 0, hits = 0;
    let body = null;
    if (info.body && typeof info.body === 'object' && !Array.isArray(info.body)) {
      body = {};
      for (const [k, v] of Object.entries(info.body)) {
        const f = fieldFor(r, k, v);
        if (f) { body[k] = { f }; hits++; if (isIdField(f)) idHits++; } else body[k] = { c: v };
      }
    }
    const path = info.path.split('/').map((seg) => {
      let d = seg; try { d = decodeURIComponent(seg); } catch (e) {}
      const f = d.length >= 8 ? Object.keys(r).find((rk) => typeof r[rk] === 'string' && r[rk] === d) : '';
      if (f) { hits++; if (isIdField(f)) idHits++; return { f }; }
      return { c: seg };
    });
    return { idHits, hits, recipe: { method: info.method, path, search: info.search || '', body, headers: info.headers || {} } };
  }

  function recipeText(rc) {
    if (!rc) return '';
    const tpl = (t) => (t.f !== undefined ? `{${t.f}}` : JSON.stringify(t.c));
    const path = (rc.path || []).map((t) => (t.f !== undefined ? `{${t.f}}` : t.c)).join('/');
    const body = rc.body ? ' ' + '{' + Object.entries(rc.body).map(([k, t]) => `${k}: ${tpl(t)}`).join(', ') + '}' : '';
    return `${rc.method} ${path}${rc.search || ''}${body}`;
  }

  function learnNative(info) {
    const rows = (info.rows || []).filter((r) => r && typeof r === 'object');
    const what = `${info.method} ${info.path}`;
    if (!rows.length) { log(`👀 看到网页发出「${what}」并成功了，但手上还没有会话列表可以对照，这次没学到（先打开面板刷新一次列表再试）`); return; }
    let best = null, bestScore = 0, tie = false;
    for (const r of rows) {
      const b = buildRecipe(info, r);
      if (!b.idHits) continue;
      const score = b.idHits * 10 + b.hits;
      if (score > bestScore) { best = { r, b }; bestScore = score; tie = false; }
      else if (score === bestScore && best && slugOf(best.r) !== slugOf(r)) tie = true;
    }
    const keys = info.body && typeof info.body === 'object' ? Object.keys(info.body).join(',') : '无';
    if (!best) { log(`👀 网页发出「${what}」并成功了，但请求里没有能对上某条会话的值，没学（body 字段：${keys}）`); return; }
    if (tie) { log(`👀 网页发出「${what}」并成功了，但同时对得上不同应用的会话，分不清是哪一条，没学（body 字段：${keys}）`); return; }
    const n = normSession(best.r, 0);
    if (n.isCurrent) return;                                   // 这是退出本机，不学
    const slug = n.appSlug || API.app;
    const rc = Object.assign(best.b.recipe, { at: Date.now() });
    const changed = recipeText(recipes[slug]) !== recipeText(rc);
    recipes = Object.assign({}, recipes, { [slug]: rc });
    set(K.recipes, recipes);
    if (changed) log(`🧠 学到网页自己的「终止」请求（${slug}）：${recipeText(rc)}。之后这类会话照这个格式踢`);
    renderDiag();
  }

  // 用学到的配方给这条会话拼请求；缺字段就不用
  function nativeBody(s, list) {
    const rc = recipes[s.appSlug || API.app];
    if (!rc || !s.raw) return null;
    let hasNull = false;
    const path = [];
    for (const t of rc.path || []) {
      if (t.f === undefined) { path.push(t.c); continue; }
      const v = s.raw[t.f];
      if (v == null || v === '') return null;
      path.push(encodeURIComponent(String(v)));
    }
    let body = null;
    if (rc.body) {
      body = {};
      for (const [k, t] of Object.entries(rc.body)) {
        if (t.f === undefined) { body[k] = t.c; continue; }
        if (!(t.f in s.raw)) return null;
        const v = s.raw[t.f];
        if (v === null) hasNull = true;
        body[k] = v;
      }
    }
    if (hasNull && !nullBodySafe(s, list)) return null;      // 同“created_at: null”的安全规则
    return { name: 'native', url: path.join('/') + (rc.search || ''), method: rc.method || 'POST', body, headers: rc.headers };
  }

  function nativeInfo(input, init) {
    const isReq = !!input && typeof input === 'object' && typeof input.url === 'string' && typeof input.clone === 'function';
    const u = new URL(isReq ? input.url : String(input && input.href ? input.href : input), location.href);
    if (u.origin !== location.origin) return null;
    const method = String((init && init.method) || (isReq && input.method) || 'GET').toUpperCase();
    const isList = method === 'GET' && u.pathname === API.list;
    if (!isList && (method === 'GET' || method === 'HEAD' || !/^\/api\//.test(u.pathname) || !NATIVE_PATH_RE.test(u.pathname))) return null;
    const info = { method, path: u.pathname, search: u.search, isList, rows: nativeRows.slice(),
      headers: headersOf((init && init.headers) || (isReq && input.headers)) };
    const b = init && init.body;
    if (typeof b === 'string') { try { info.body = JSON.parse(b); } catch (e) {} }
    else if (b == null && isReq && !isList) { try { info.bodyP = input.clone().text(); } catch (e) {} }
    return info;
  }

  async function onNativeDone(info, res) {
    if (!res) return;
    if (info.isList) {
      if (!res.ok) return;
      try {
        const data = JSON.parse(await res.clone().text());
        const arr = Array.isArray(data) ? data : data && (data.sessions || data.data || data.items);
        if (Array.isArray(arr)) nativeRows = arr;
      } catch (e) {}
      return;
    }
    if (info.bodyP) { try { info.body = JSON.parse(await info.bodyP); } catch (e) {} }
    if (!res.ok) {
      logEvery('nf:' + info.path + res.status, 60000, `👀 网页自己的「${info.method} ${info.path}」返回 ${res.status}，没学`);
      return;
    }
    learnNative(info);
  }

  function installNativeWatch() {
    if (!pageFetch || !CFG.learnNative) return;
    const watched = function fetch(input, init) {
      let info = null;
      try { info = nativeInfo(input, init); } catch (e) { info = null; }
      const p = pageFetch.apply(W, arguments);
      if (info) { try { p.then((res) => { onNativeDone(info, res).catch(() => {}); }, () => {}); } catch (e) {} }
      return p;
    };
    try { watched.toString = () => pageFetch.toString(); } catch (e) {}
    try {
      // Firefox 的隔离环境需要 exportFunction 才能把函数交给网页
      W.fetch = typeof exportFunction === 'function' ? exportFunction(watched, W) : watched;
    } catch (e) {}
  }

  const SHOW_VALUE_RE = /slug|application|app|kind|type|method|source|client|platform|name|agent|browser|os/i;
  function shapeOf(o) {
    if (!o || typeof o !== 'object') return String(o);
    return Object.keys(o).sort().map((k) => {
      const v = o[k];
      if (v === null) return `${k}=null`;
      if (Array.isArray(v)) return `${k}=[${v.length} 项]`;
      if (typeof v === 'object') return `${k}={${Object.keys(v).map((kk) => (SHOW_VALUE_RE.test(kk) && typeof v[kk] === 'string' ? `${kk}:"${v[kk].slice(0, 40)}"` : kk)).join(',')}}`;
      if (typeof v === 'string') return SHOW_VALUE_RE.test(k) ? `${k}="${v.slice(0, 60)}"` : `${k}=字符串(${v.length})`;
      return `${k}=${typeof v === 'boolean' ? v : typeof v}`;
    }).join('，');
  }
  const shapeLogged = new Set();
  function logShapeOnce(s, why) {
    if (!s || !s.raw) return;
    const sh = shapeOf(s.raw);
    if (shapeLogged.has(why + sh)) return;
    shapeLogged.add(why + sh);
    log(`🔍 诊断：「${desc(s)}」${why}。字段：${sh}`);
  }

  /* ================= 名单 ================= */
  const serialize = (s) => ({
    id: s.id, kickable: !!s.kickable, device: s.device, location: s.location,
    created: s.created, updated: s.updated, isCurrent: !!s.isCurrent, appSlug: s.appSlug || '',
  });

  function updateList(list) {
    sessions = list;
    const data = list.map(serialize);
    const sig = JSON.stringify(data);
    if (sig !== listSig) { listSig = sig; set(K.sessions, data); }
    renderList(); renderStatus(); renderDiag();
  }

  // 把列表分成：当前会话 / 保留 / 要踢 / 无法识别
  function planOf(list) {
    const keep = keepSet();
    const out = { cur: [], keep: [], kick: [], skip: [] };
    for (const s of list || []) {
      if (s.isCurrent) out.cur.push(s);
      else if (!s.kickable) out.skip.push(s);
      else if (keep.has(s.id)) out.keep.push(s);
      else out.kick.push(s);
    }
    return out;
  }

  // 旧版保留名单是“创建时间到分钟”（允许差 1 分钟）。第一次读到可靠列表时按旧规则匹配一次，换成会话 ID
  function migrateLegacyKeep(list) {
    if (get(K.keepMigrated, false)) return;
    const legacy = get(K.legacyKeep, []);
    const nums = (Array.isArray(legacy) ? legacy : []).map(String).filter((k) => /^\d+$/.test(k));
    if (!nums.length) { set(K.keepMigrated, true); return; }
    if (!list.some((s) => s.isCurrent)) return;      // 列表不可靠时先不迁移（这种列表也不会拿来踢人）
    const ids = keepSet();
    const names = [];
    for (const s of list) {
      if (s.isCurrent || !s.kickable || !s.key || ids.has(s.id)) continue;
      if (nums.some((k) => Math.abs(Number(k) - Number(s.key)) <= 1)) { ids.add(s.id); names.push(desc(s)); }
    }
    set(K.keepIds, [...ids]);
    set(K.keepMigrated, true);
    log(names.length
      ? `🔁 旧版保留名单已改为按会话 ID 保留：${names.join('、')}（请在列表里核对一下）`
      : '🔁 旧版保留名单里的会话都已不在列表中，之后按新版保留名单处理');
  }

  function toggleKeep(id, on) {
    const ids = keepSet();
    if (on) ids.add(id); else ids.delete(id);
    set(K.keepIds, [...ids]);
    const s = cachedList().find((x) => x.id === id);
    const name = s ? desc(s) : id;
    log(on ? `📌 保留：${name}` : `↩️ 取消保留：${name}${CFG.enabled ? '（下一轮会被踢出）' : ''}`);
    renderList(); renderStatus(); renderDiag();
  }

  /* ================= 踢人 ================= */
  const cooling = (s) => { const f = fails.get(s.id); return !!f && Date.now() < f.until; };
  function markFail(s) {
    const n = ((fails.get(s.id) || {}).n || 0) + 1;
    const wait = Math.min(30000 * Math.pow(2, n - 1), 600000);
    fails.set(s.id, { n, until: Date.now() + wait });
    return wait;
  }
  function kicked() {
    set(K.kicked, (Number(get(K.kicked, 0)) || 0) + 1);
    renderBadge();
  }
  function logDryRun(s) {
    if (dryLogged.has(s.id)) return;
    dryLogged.add(s.id);
    log(`🧪 预演：本来会踢「${desc(s)}」（未发送请求）`);
  }
  const stillLead = () => { const l = get(K.leader, null); return !l || l.tab === TAB_ID; };

  async function kickRound(list, alive) {
    const first = planOf(list);
    const cur = first.cur[0];
    // 预演：一次把所有“本来会踢”的都记下来（只写日志，不受每轮上限限制）
    if (CFG.dryRun) { first.kick.forEach(logDryRun); return; }
    const targets = first.kick.filter((s) => !cooling(s)).slice(0, CFG.maxPerRound);
    if (!targets.length) {
      if (dirty && !first.kick.length) {
        dirty = false;
        if (first.skip.length) {
          log(`⚠️ 能踢的都踢了，但还有 ${first.skip.length} 条会话认不出来、没法踢：${first.skip.map(desc).join('、')}`);
          first.skip.forEach((x) => logShapeOnce(x, '认不出来'));
        } else log('✅ 干净了，只剩本机和保留的会话');
      }
      return;
    }
    dirty = true;
    let latest = list;
    for (const s of targets) {
      if (!alive() || !CFG.enabled || !stillLead()) return;
      if (!cur || s.id === cur.id || s.isCurrent) continue;      // 双保险：当前会话绝不踢
      if (!latest.some((x) => x.id === s.id)) continue;           // 已经不在列表里了
      if (keepSet().has(s.id)) continue;                          // 刚被勾上保留
      if (CFG.dryRun) { logDryRun(s); continue; }                 // 这一轮中途打开了预演

      const t0 = Date.now();
      const res = await kickOne(s, alive, latest);
      const sec = ((Date.now() - t0) / 1000).toFixed(2);
      if (res.list) latest = res.list;
      if (res.done === 'abort') return;
      if (res.done === 'gone') {
        fails.delete(s.id);
        kicked();
        log(`🦶 已踢：${desc(s)} · ${sec}s`);
        continue;
      }
      const wait = markFail(s);
      log(`❌ 踢不掉「${desc(s)}」（${res.tried.join('；') || '没有可用的请求格式'}），${Math.round(wait / 1000)} 秒后再试`);
      logShapeOnce(s, '踢不掉');
      const slug = s.appSlug || API.app;
      if (CFG.learnNative && !recipes[slug] && !learnHinted.has(slug)) {
        learnHinted.add(slug);
        log(`💡 可以在 设置 → 账户 的会话列表里手动点一次这条会话的「终止」：脚本会记下网页用的请求，之后 ${slug} 的会话自动照着踢`);
      }
      renderList();
    }
  }

  async function tick(alive) {
    const r = await readList(false);
    if (r.status !== 'ok' || !alive()) return;
    migrateLegacyKeep(r.list);
    updateList(r.list);
    if (!CFG.enabled) return;
    if (!connectedLogged) { connectedLogged = true; log(`✅ 已连上网页原生活动会话接口（读到 ${r.list.length} 条会话）`); }
    const curN = r.list.filter((s) => s.isCurrent).length;
    if (curN !== 1) {
      logEvery('nocur', 60000, curN
        ? `⚠️ 接口同时标出了 ${curN} 条「当前会话」，为了不踢错，这轮不动手`
        : '⚠️ 接口没标出「当前会话」，为了不踢到自己，这轮不动手');
      return;
    }
    await kickRound(r.list, alive);
  }

  // 只读刷新列表（不踢）：停止状态、或者另一个标签页在负责检测时用
  async function refreshList(manual) {
    if (refreshing || running) return;
    if (!manual && (Date.now() - lastRefreshAt < 5000 || (CFG.enabled && mode === 'lead'))) return;
    refreshing = true; lastRefreshAt = Date.now();
    try {
      const r = await readList(!!manual);
      if (r.status === 'ok') {
        migrateLegacyKeep(r.list);
        updateList(r.list);
        if (manual) log(`🔄 已刷新会话列表（${r.list.length} 条）${CFG.enabled ? '，由另一个标签页负责踢人' : '，守护未启动，不会踢人'}`);
      } else if (manual) {
        log(`⚠️ 刷新失败：${net.lastErr || '暂时读不到会话接口'}`);
      }
    } finally {
      refreshing = false;
      renderAll(false);
    }
  }

  /* ================= 调度 / 多标签页 ================= */
  // 同一时间只让一个标签页检测。租约 max(3×间隔, 15 秒)；前台标签可以接手后台标签
  const leaseMs = () => Math.max(CFG.interval * 3000, 15000);
  function takeLead() {
    const now = Date.now();
    const hidden = !!document.hidden;
    const l = get(K.leader, null);
    if (l && l.tab !== TAB_ID && now - (Number(l.ts) || 0) < leaseMs()) {
      if (!(l.hidden && !hidden)) return false;       // 对方在前台，或者大家都在后台：让对方继续
    }
    if (!l || l.tab !== TAB_ID || now - (Number(l.ts) || 0) > 3000 || !!l.hidden !== hidden) {
      set(K.leader, { tab: TAB_ID, ts: now, hidden });
    }
    return true;
  }
  function releaseLead() {
    const l = get(K.leader, null);
    if (l && l.tab === TAB_ID) set(K.leader, null);
  }

  // 每条最坏 = 7 种格式 ×（12 秒请求 + 4 次确认读取 × 12 秒 + 3.8 秒等待），按“每轮上限”放宽
  const stuckLimit = () => Math.max(120000, CFG.maxPerRound * 7 * 65000 + 20000);

  async function runTick() {
    const gen = ++runGen;
    const alive = () => gen === runGen;
    running = true; runStartedAt = Date.now();
    renderStatus();
    try { await tick(alive); } catch (e) { log('检测出错：' + (e && e.message)); }
    if (!alive()) return false;           // 这一轮卡太久已被看门狗作废，别覆盖新一轮的状态
    running = false; runStartedAt = 0;
    renderAll(false);
    return true;
  }

  function schedule() {
    clearTimeout(loopTimer); loopTimer = null;
    if (!CFG.enabled) { nextAt = 0; renderStatus(); return; }
    const ms = Math.max(CFG.interval * 1000, net.coolUntil - Date.now(), 500);
    nextAt = Date.now() + ms;
    loopTimer = setTimeout(loop, ms);
    try { renderStatus(); } catch (e) {}  // 渲染出错不能连带把定时器弄丢
  }

  async function loop() {
    clearTimeout(loopTimer); loopTimer = null;
    if (!CFG.enabled) { nextAt = 0; mode = ''; renderStatus(); return; }
    if (running) { schedule(); return; }
    if (!takeLead()) { mode = 'other'; schedule(); return; }
    mode = 'lead';
    if (!(await runTick())) return;
    if (!CFG.enabled) { mode = ''; releaseLead(); renderStatus(); return; }   // 这一轮里被停了：不再续租
    takeLead();
    schedule();
  }

  async function runNow() {
    if (running || refreshing) { log('正在检测，稍等'); return; }
    if (!CFG.enabled) { await refreshList(true); return; }
    if (!takeLead()) { mode = 'other'; await refreshList(true); return; }
    log('手动检测…');
    mode = 'lead';
    if (!(await runTick())) return;
    if (CFG.enabled) { takeLead(); schedule(); } else { mode = ''; releaseLead(); }
    renderAll(false);
  }

  // 看门狗：不依赖页面可见、不依赖 UI，独立检查调度是否还活着
  function watchdog() {
    try {
      if (running && runStartedAt && Date.now() - runStartedAt > stuckLimit()) {
        runGen++;                          // 作废卡住的那一轮（它之后的每一步都会检查 alive 并退出）
        running = false; runStartedAt = 0;
        log(`⚠️ 上一轮检测卡住超过 ${Math.round(stuckLimit() / 1000)} 秒，已自动重置并继续守护`);
        if (CFG.enabled) schedule();
        return;
      }
      if (!CFG.enabled) {
        if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
        nextAt = 0;
        if (mode) { mode = ''; renderStatus(); }
        return;
      }
      // 定时器丢了，或者早就该触发却没触发（浏览器冻结后恢复）；也负责在别的标签页启动守护后跟上
      if (!running && (!loopTimer || (nextAt && Date.now() - nextAt > 15000))) loop();
    } catch (e) {}
  }

  // 切回标签页 / 窗口获得焦点时立刻补测一次（前台标签也借此接手后台标签）
  function kickSoon() {
    if (!CFG.enabled || running || document.hidden) return;
    const now = Date.now();
    if (now - kickSoonAt < 2000 || (nextAt && nextAt - now < 1500)) return;
    kickSoonAt = now;
    clearTimeout(loopTimer); loopTimer = null; nextAt = 0;
    loop();
  }

  function setIntervalSec(v) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < MIN_INTERVAL) { log(`检测间隔要填不小于 ${MIN_INTERVAL} 的整数（秒）`); renderStatus(); return; }
    CFG.interval = Math.min(n, MAX_INTERVAL);
    log(`检测间隔设为 ${CFG.interval} 秒`);
    if (CFG.enabled && !running) schedule();
    renderAll(false);
  }

  function previewText(list) {
    const p = planOf(list);
    const names = (arr) => arr.slice(0, 8).map((x) => '  · ' + x).join('\n') + (arr.length > 8 ? `\n  · …共 ${arr.length} 条` : '');
    let t = '';
    if (p.cur.length !== 1) {
      t += `⚠️ 接口${p.cur.length ? `标出了 ${p.cur.length} 条` : '没标出'}「当前会话」：启动后会一直等待，不会动手。\n\n`;
    }
    t += `会保留（${p.cur.length + p.keep.length}）：\n` +
      names([...p.cur.map((s) => desc(s) + '（当前浏览器）'), ...p.keep.map(desc)]) + '\n';
    t += p.kick.length ? `\n会踢出（${p.kick.length}）：\n${names(p.kick.map(desc))}\n` : '\n会踢出：暂时没有\n';
    if (p.skip.length) t += `\n无法识别、不处理：${p.skip.length} 条\n`;
    return t;
  }

  async function startGuard() {
    if (CFG.enabled) { log('守护已经在运行了'); return; }
    if (starting) return;
    starting = true;
    try {
      const r = await readList(true);
      let preview;
      if (r.status === 'ok') {
        migrateLegacyKeep(r.list);
        updateList(r.list);
        preview = previewText(r.list);
      } else {
        preview = `⚠️ 暂时读不到会话列表（${net.lastErr || '接口异常'}）：启动后读到列表才会动手。\n`;
      }
      const ok = confirm('启动会话守护？\n\n' + preview +
        `\n安全措施：每轮最多踢 ${CFG.maxPerRound} 条；认不出本机就不动手；每踢一条都会自检，发现本机不见了立刻停止。` +
        (CFG.dryRun ? '\n\n当前是【预演】：只写日志，不会真的踢。' : ''));
      if (!ok || CFG.enabled) return;
      CFG.enabled = true;
      authFails = 0; net.failN = 0; net.coolUntil = 0;
      set(K.kicked, 0);
      fails.clear(); dryLogged.clear();
      dirty = true; connectedLogged = false;
      clearIssue();
      log(`▶️ 守护启动 · 间隔 ${CFG.interval} 秒 · 每轮最多踢 ${CFG.maxPerRound} 条${CFG.dryRun ? ' · 预演中（不会真踢）' : ''}`);
      renderAll(false);
      loop();
    } finally {
      starting = false;
    }
  }

  function stopGuard(reason) {
    const why = typeof reason === 'string' && reason ? `（${reason}）` : '';
    if (!CFG.enabled) { if (!why) log('守护本来就是停止状态'); return; }
    CFG.enabled = false;
    clearTimeout(loopTimer);
    loopTimer = null; nextAt = 0; mode = '';
    releaseLead();
    log(`⏹ 守护停止${why} · 本次踢掉 ${Number(get(K.kicked, 0)) || 0} 个`);
    renderAll(false);
  }

  // 退出账号 / 换账号后用：清空和账号相关的数据；检测间隔、预演、每轮上限和日志保留
  function clearSaved() {
    if (!confirm('清除已保存的数据？\n\n会停止守护，并清空：保留名单、会话列表缓存、本次踢出计数。\n' +
      '检测间隔、预演、每轮上限和日志会保留。适合退出账号或换账号后使用。\n\n确定吗？')) return;
    if (CFG.enabled) stopGuard('清除已保存数据');
    [K.keepIds, K.legacyKeep, K.sessions, K.leader, K.issue, K.kicked].forEach((k) => set(k, undefined));
    set(K.keepMigrated, true);
    sessions = []; listSig = ''; issue = null;
    fails.clear(); dryLogged.clear();
    dirty = true; connectedLogged = false;
    net.lastOkAt = 0; net.lastErr = '';
    log('🧹 已清除保存的数据：保留名单和会话列表缓存已清空，下次读到列表会重新识别');
    renderAll(true);
  }

  /* ================= 面板 UI ================= */
  const CSS = `
    #csg-fab, #csg-panel {
      --bg:#fff; --card:#f7f6f2; --fg:#1d1d1b; --muted:#6b6a66; --line:#e2e0da; --on:#2f7d4f; --on-bg:#e6f3ec;
      --off:#8a8984; --warn:#9a5b00; --warn-bg:#fbf0dc; --hover:#ecebe5;
      font-family: inherit; color: var(--fg);
    }
    @media (prefers-color-scheme: dark) {
      #csg-fab, #csg-panel {
        --bg:#262624; --card:#2f2f2c; --fg:#ecebe6; --muted:#a3a29c; --line:#3d3d3a; --on:#5fbf86; --on-bg:#1f3a2c;
        --off:#8a8984; --warn:#e0a33a; --warn-bg:#3a2f18; --hover:#383835;
      }
    }
    #csg-fab *, #csg-panel * { box-sizing: border-box; }
    #csg-fab {
      position: fixed; right: 14px; bottom: 96px; z-index: 2147483646; width: 44px; height: 44px; padding: 0;
      border-radius: 50%; border: 1px solid var(--line); background: var(--bg); color: var(--off); cursor: pointer;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,.14);
    }
    #csg-fab[data-state="on"] { color: var(--on); border-color: var(--on); }
    #csg-fab[data-state="warn"] { color: var(--warn); border-color: var(--warn); }
    #csg-fab svg { width: 20px; height: 20px; }
    #csg-fab .dot { position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; border-radius: 50%; background: currentColor; border: 2px solid var(--bg); }
    #csg-fab[data-state="on"] .dot { animation: csg-pulse 2s ease-in-out infinite; }
    #csg-fab .cnt {
      position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
      min-width: 18px; height: 16px; padding: 0 5px; border-radius: 999px;
      background: currentColor; border: 2px solid var(--bg); box-sizing: content-box;
      font: 600 10px/16px system-ui, sans-serif; font-variant-numeric: tabular-nums; text-align: center;
      pointer-events: none;
    }
    #csg-fab .cnt b { color: var(--bg); font-weight: 600; }
    #csg-fab .cnt[hidden] { display: none; }
    @keyframes csg-pulse { 50% { opacity: .3; } }
    @media (prefers-reduced-motion: reduce) { #csg-fab .dot, #csg-panel .dot { animation: none !important; } }
    #csg-fab:focus-visible, #csg-panel button:focus-visible, #csg-panel input:focus-visible { outline: 2px solid var(--on); outline-offset: 2px; }

    #csg-panel {
      position: fixed; right: 14px; top: 7vh; z-index: 2147483647; width: min(400px, calc(100vw - 28px)); max-height: 86vh; overflow: auto;
      background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 14px; font-size: 13px; line-height: 1.5; display: none;
      box-shadow: 0 8px 30px rgba(0,0,0,.18);
    }
    #csg-panel.open { display: block; }
    #csg-panel .hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    #csg-panel .ttl { font-size: 15px; font-weight: 600; }
    #csg-panel .ver { font-size: 11px; font-weight: 400; color: var(--muted); margin-left: 6px; }
    #csg-panel .x { border: 0; background: transparent; font-size: 20px; line-height: 1; padding: 2px 8px; cursor: pointer; color: var(--muted); border-radius: 6px; }
    #csg-panel .x:hover { background: var(--hover); }

    #csg-panel .runbox { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); }
    #csg-panel .runbox[data-state="on"] { background: var(--on-bg); border-color: var(--on); color: var(--on); }
    #csg-panel .runbox[data-state="warn"] { background: var(--warn-bg); border-color: var(--warn); color: var(--warn); }
    #csg-panel .runbox[data-state="off"] { color: var(--muted); }
    #csg-panel .stx { min-width: 0; }
    #csg-panel .state { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
    #csg-panel .reason { font-size: 12px; margin-top: 2px; opacity: .9; }
    #csg-panel .reason:empty { display: none; }
    #csg-panel .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
    #csg-panel .runbox[data-state="on"] .dot { animation: csg-pulse 2s ease-in-out infinite; }

    #csg-panel button { font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 8px; cursor: pointer; border: 1px solid var(--line); background: var(--bg); color: var(--fg); }
    #csg-panel button:hover:not(:disabled) { background: var(--hover); }
    #csg-panel button.go { background: var(--on); border-color: var(--on); color: #fff; font-weight: 600; flex: none; }
    #csg-panel button.go:hover { background: var(--on); filter: brightness(1.08); }
    #csg-panel button.stop { border-color: var(--fg); font-weight: 600; flex: none; }
    #csg-panel button.danger { color: var(--warn); border-color: var(--warn); background: var(--warn-bg); }
    #csg-panel button.danger:hover:not(:disabled) { filter: brightness(1.06); }

    #csg-panel .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0; }
    #csg-panel .stats > div { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 6px 4px; text-align: center; }
    #csg-panel .stats b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
    #csg-panel .stats span { font-size: 11px; color: var(--muted); }

    #csg-panel .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-top: 8px; }
    #csg-panel .lbl { font-weight: 600; margin-bottom: 6px; }
    #csg-panel .hint, #csg-panel .meta { color: var(--muted); font-size: 12px; }
    #csg-panel .hint.warn { color: var(--warn); }
    #csg-panel .chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    #csg-panel .chip { padding: 3px 10px; border-radius: 999px; }
    #csg-panel .chip.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
    #csg-panel .cus { color: var(--muted); font-size: 12px; margin-left: 2px; }
    #csg-panel input[type=number] { font: inherit; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); width: 64px; margin-right: 4px; }

    #csg-panel .switch { display: flex; align-items: center; gap: 8px; margin: 4px 0; cursor: pointer; position: relative; }
    #csg-panel .switch input { position: absolute; opacity: 0; pointer-events: none; }
    #csg-panel .switch i { width: 32px; height: 18px; border-radius: 999px; background: var(--line); position: relative; flex: none; transition: background .15s; }
    #csg-panel .switch i::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .15s; }
    #csg-panel .switch input:checked + i { background: var(--on); }
    #csg-panel .switch input:checked + i::after { transform: translateX(14px); }
    #csg-panel .switch input:focus-visible + i { outline: 2px solid var(--on); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { #csg-panel .switch i, #csg-panel .switch i::after { transition: none; } }

    #csg-panel .sess { display: flex; gap: 10px; align-items: flex-start; padding: 7px 6px; border-radius: 8px; cursor: pointer; }
    #csg-panel .sess:hover { background: var(--hover); }
    #csg-panel .sess input { margin-top: 3px; }
    #csg-panel .tag { font-size: 11px; border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; margin-left: 6px; color: var(--muted); white-space: nowrap; }
    #csg-panel .tag.keep { color: var(--on); border-color: var(--on); }
    #csg-panel .tag.kick { color: var(--warn); border-color: var(--warn); }
    #csg-panel .empty { color: var(--muted); padding: 8px 0; }
    #csg-panel .row { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 0; align-items: center; }
    #csg-panel details { margin-top: 10px; color: var(--muted); font-size: 12px; }
    #csg-panel summary { cursor: pointer; }
    #csg-panel #csg-diag { white-space: pre-line; margin-top: 6px; }
    #csg-panel .log { border-top: 1px solid var(--line); margin-top: 10px; padding-top: 8px; max-height: 150px; overflow: auto; color: var(--muted); font-size: 12px; white-space: pre-wrap; }
  `;

  const $ = (s) => (panel ? panel.querySelector(s) : null);
  const setText = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const isOpen = () => !!(panel && panel.classList.contains('open'));

  function buildUI() {
    if (panel || !document.documentElement) return;
    uiStyle = document.createElement('style');
    uiStyle.textContent = CSS;
    (document.head || document.documentElement).appendChild(uiStyle);

    fab = document.createElement('button');
    fab.id = 'csg-fab';
    fab.type = 'button';
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 3v5.6c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.5z" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span class="dot"></span>' +
      '<span class="cnt" hidden><b>0</b></span>';
    fab.addEventListener('click', () => (isOpen() ? closePanel() : openPanel()));

    panel = document.createElement('div');
    panel.id = 'csg-panel';
    panel.innerHTML = `
      <div class="hd"><div class="ttl">会话守护<span class="ver">v${VERSION}</span></div><button type="button" class="x" id="csg-close" aria-label="关闭">×</button></div>
      <div class="runbox" id="csg-runbox">
        <div class="stx">
          <span class="state"><span class="dot"></span><b id="csg-state-text"></b></span>
          <div class="reason" id="csg-reason"></div>
        </div>
        <button type="button" id="csg-toggle" class="go">▶ 启动</button>
      </div>
      <div class="stats">
        <div><b id="csg-stat-kick">0</b><span>本次已踢</span></div>
        <div><b id="csg-stat-next">—</b><span>下次检测</span></div>
        <div><b id="csg-stat-total">—</b><span>在线会话</span></div>
        <div><b id="csg-stat-pending">—</b><span>待踢</span></div>
      </div>
      <div class="card">
        <div class="lbl">会话</div>
        <div class="hint">本浏览器当前会话永远保留；勾选的也会保留（勾选立即生效），其余自动踢掉。</div>
        <div id="csg-list"></div>
        <div class="row"><button type="button" id="csg-now">立即检测</button></div>
      </div>
      <div class="card">
        <div class="lbl">检测间隔</div>
        <div class="chips" id="csg-chips">
          ${INTERVAL_PRESETS.map((n) => `<button type="button" class="chip" data-s="${n}">${n}s</button>`).join('')}
          <span class="cus"><input type="number" id="csg-interval" min="${MIN_INTERVAL}" max="${MAX_INTERVAL}" step="1" aria-label="自定义间隔（秒）">秒</span>
        </div>
        <div class="hint" id="csg-iv-hint"></div>
      </div>
      <div class="card">
        <div class="lbl">安全</div>
        <label class="switch"><input type="checkbox" id="csg-dry"><i></i><span>预演：只写日志，不真踢<small style="color:var(--warn)">（建议先开一轮）</small></span></label>
        <label class="switch"><input type="checkbox" id="csg-learn"><i></i><span>学习网页自己的「终止」请求<small style="color:var(--muted)">（只观察；改了刷新页面生效）</small></span></label>
        <div class="hint">某条会话一直踢不掉时：在 设置 → 账户 的会话列表里手动点一次它的「终止」，脚本会记下网页用的请求，之后同类会话自动照着踢。</div>
        <div class="row"><span class="hint">每轮最多踢</span><input type="number" id="csg-max" min="1" max="${MAX_PER_ROUND}" step="1" style="width:56px" aria-label="每轮最多踢几条"><span class="hint">条</span></div>
      </div>
      <details>
        <summary>诊断 / 维护</summary>
        <div id="csg-diag" class="hint"></div>
        <div class="row"><button type="button" id="csg-export">导出日志</button><button type="button" id="csg-clear" class="danger">清除已保存数据</button></div>
        <div class="hint" style="margin-top:6px">退出账号或换账号后使用：清空保留名单和会话缓存；检测间隔、预演、每轮上限和日志会保留。</div>
      </details>
      <div class="log" id="csg-log"></div>`;

    $('#csg-close').addEventListener('click', closePanel);
    $('#csg-toggle').addEventListener('click', () => (CFG.enabled ? stopGuard() : startGuard()));
    $('#csg-now').addEventListener('click', () => { runNow(); });
    $('#csg-chips').addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (b) setIntervalSec(b.dataset.s);
    });
    $('#csg-interval').addEventListener('change', (e) => setIntervalSec(e.target.value));
    $('#csg-list').addEventListener('change', (e) => {
      const cb = e.target.closest('input[type=checkbox][data-id]');
      if (cb && !cb.disabled) toggleKeep(cb.getAttribute('data-id'), cb.checked);
    });
    $('#csg-dry').addEventListener('change', (e) => {
      CFG.dryRun = e.target.checked;
      dryLogged.clear();
      log(`预演模式：${e.target.checked ? '开（只记日志，不会真踢）' : '关（会真的踢）'}`);
      renderAll(false);
    });
    $('#csg-learn').addEventListener('change', (e) => {
      CFG.learnNative = e.target.checked;
      log(`学习网页自己的「终止」请求：${e.target.checked ? '开' : '关'}（刷新页面后生效）`);
      renderAll(false);
    });
    $('#csg-max').addEventListener('change', (e) => {
      CFG.maxPerRound = e.target.value;
      log(`每轮最多踢 ${CFG.maxPerRound} 条`);
      renderAll(false);
    });
    $('#csg-export').addEventListener('click', exportLogs);
    $('#csg-clear').addEventListener('click', clearSaved);

    mountUI();
    renderAll(true);
  }

  function mountUI() {
    if (!panel || !fab) return;
    const root = document.documentElement;
    if (!root) return;
    if (uiStyle && !uiStyle.isConnected) (document.head || root).appendChild(uiStyle);
    if (!uiHost) {
      uiHost = document.createElement('div');
      uiHost.id = 'csg-mount';
      // 不占布局；挂在 <html> 下，避开 Claude 应用对 body 的重渲染/清理
      uiHost.style.cssText = 'display: contents !important;';
    }
    if (!uiHost.isConnected) root.appendChild(uiHost);
    if (!panel.isConnected) uiHost.appendChild(panel);
    if (!fab.isConnected) uiHost.appendChild(fab);
  }

  function openPanel() {
    buildUI(); mountUI();
    if (!panel) return;
    panel.classList.add('open');
    renderAll(true);
    refreshList(false);
  }
  function closePanel() { if (panel) panel.classList.remove('open'); }

  function statusInfo() {
    const iss = mode === 'other' ? get(K.issue, null) : issue;
    let reason = '';
    if (iss && iss.text) {
      const left = iss.until ? Math.ceil((iss.until - Date.now()) / 1000) : 0;
      reason = iss.text + (CFG.enabled && left > 0 ? `（${left} 秒后重试）` : '');
    }
    if (!CFG.enabled) return { st: 'off', text: '已停止', reason };
    if (reason) return { st: 'warn', text: '运行中 · 需要留意', reason };
    const list = cachedList();
    const curN = list.filter((s) => s.isCurrent).length;
    if (list.length && curN !== 1) {
      return { st: 'warn', text: '运行中 · 暂不动手', reason: curN ? `接口标出了 ${curN} 条当前会话` : '接口没标出当前会话，认不出本机' };
    }
    if (mode === 'other') return { st: 'on', text: '运行中', reason: '由另一个标签页负责检测' };
    if (CFG.dryRun) return { st: 'on', text: '运行中 · 预演', reason: '只写日志，不会真的踢' };
    return { st: 'on', text: '运行中', reason: '' };
  }

  // 盾牌底部的“已踢出”计数：运行中一直显示（含 0），停止后只在踢过人时保留上次结果
  function renderBadge(info) {
    if (!fab) return;
    info = info || statusInfo();
    fab.dataset.state = info.st;
    const n = Number(get(K.kicked, 0)) || 0;
    const cnt = fab.querySelector('.cnt');
    if (cnt) {
      cnt.hidden = !CFG.enabled && n === 0;
      setText(cnt.firstChild, n > 99 ? '99+' : String(n));
    }
    const title = `会话守护：${info.text}${info.reason ? '（' + info.reason + '）' : ''} · 本次已踢出 ${n} 个（点击打开面板）`;
    if (fab.title !== title) { fab.title = title; fab.setAttribute('aria-label', title); }
  }

  function renderStatus() {
    const info = statusInfo();
    renderBadge(info);
    if (!isOpen()) return;
    $('#csg-runbox').dataset.state = info.st;
    setText($('#csg-state-text'), info.text);
    setText($('#csg-reason'), info.reason);
    const tg = $('#csg-toggle');
    setText(tg, CFG.enabled ? '⏹ 停止' : '▶ 启动');
    const cls = CFG.enabled ? 'stop' : 'go';
    if (tg.className !== cls) tg.className = cls;
    setText($('#csg-stat-kick'), String(Number(get(K.kicked, 0)) || 0));
    let next = '—';
    if (CFG.enabled) {
      if (running) next = '检测中';
      else if (mode === 'other') next = '他页';
      else if (nextAt) next = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000)) + 's';
    }
    setText($('#csg-stat-next'), next);
    const list = cachedList();
    const p = planOf(list);
    setText($('#csg-stat-total'), list.length ? String(list.length) : '—');
    setText($('#csg-stat-pending'), list.length && p.cur.length === 1 ? String(p.kick.length) : '—');
    const iv = $('#csg-interval');
    const ivs = String(CFG.interval);
    if (document.activeElement !== iv && iv.value !== ivs) iv.value = ivs;
    panel.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', Number(c.dataset.s) === CFG.interval));
    const dry = $('#csg-dry');
    if (dry.checked !== CFG.dryRun) dry.checked = CFG.dryRun;
    const learn = $('#csg-learn');
    if (learn.checked !== CFG.learnNative) learn.checked = CFG.learnNative;
    const mx = $('#csg-max');
    const mxs = String(CFG.maxPerRound);
    if (document.activeElement !== mx && mx.value !== mxs) mx.value = mxs;
    const hint = $('#csg-iv-hint');
    const fast = CFG.interval < 3;
    const hc = 'hint' + (fast ? ' warn' : '');
    if (hint.className !== hc) hint.className = hc;
    setText(hint, fast
      ? '⚠️ 低于 3 秒请求量较大：被限流时会自动退避（最长 5 分钟），不会自动停止守护。'
      : `最低 ${MIN_INTERVAL} 秒。切回本页会立刻补测一次。`);
  }

  function renderList(force) {
    if (!isOpen()) return;
    const box = $('#csg-list');
    const keep = keepSet();
    const rows = cachedList().slice()
      .sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0))
      .map((s) => ({ s, kept: keep.has(s.id), fail: cooling(s) }));
    const sig = JSON.stringify([CFG.enabled, rows.map((r) => [r.s.id, r.s.device, r.s.location, r.s.created, r.s.updated,
      r.s.isCurrent, r.s.kickable, r.s.appSlug, r.kept, r.fail])]);
    if (!force && sig === listRenderSig) return;
    listRenderSig = sig;
    const one = ({ s, kept, fail }) => {
      let tag;
      if (s.isCurrent) tag = '<span class="tag keep">当前浏览器 · 自动保留</span>';
      else if (!s.kickable) tag = '<span class="tag">无法识别 · 不处理</span>';
      else if (kept) tag = '<span class="tag keep">保留</span>';
      else if (fail) tag = '<span class="tag kick">踢失败 · 稍后重试</span>';
      else tag = `<span class="tag kick">${CFG.enabled ? '会被踢出' : '启动后会被踢出'}</span>`;
      const meta = [
        s.location ? esc(s.location) : '',
        `创建 ${esc(s.created || '未知')}${s.updated ? ' ｜ 最近活跃 ' + esc(s.updated) : ''}`,
        s.appSlug && s.appSlug !== API.app ? '应用 ' + esc(s.appSlug) : '',
      ].filter(Boolean).join('<br>');
      const locked = s.isCurrent || !s.kickable;
      return `<label class="sess"><input type="checkbox" data-id="${esc(s.id)}"${s.isCurrent || kept ? ' checked' : ''}${locked ? ' disabled' : ''}>` +
        `<div><div>${esc(s.device)}${tag}</div><div class="meta">${meta}</div></div></label>`;
    };
    // 重画后把焦点还给同一个勾选框（键盘操作不会丢位置）
    const ae = document.activeElement;
    const fid = ae && box.contains(ae) ? ae.getAttribute('data-id') : null;
    box.innerHTML = rows.length ? rows.map(one).join('')
      : '<div class="empty">还没读到会话列表。点「立即检测」刷新一次。</div>';
    if (fid) {
      const el = [...box.querySelectorAll('input[data-id]')].find((x) => x.getAttribute('data-id') === fid);
      if (el) el.focus();
    }
  }

  function renderDiag(force) {
    if (!isOpen()) return;
    const list = cachedList();
    const curN = list.filter((s) => s.isCurrent).length;
    const ids = keepIds();
    const present = new Set(list.map((s) => s.id));
    const stale = list.length ? ids.filter((id) => !present.has(id)).length : 0;
    const legacy = get(K.legacyKeep, []);
    const legacyN = !get(K.keepMigrated, false) && Array.isArray(legacy) ? legacy.length : 0;
    const lines = [
      `本机判定：${!list.length ? '— 还没读到列表' : curN === 1 ? '✅ 接口标出了当前会话' : curN ? `⚠️ 接口标出了 ${curN} 条当前会话（不动手）` : '⚠️ 接口没标出当前会话（不动手）'}`,
      `网页原生「终止」：${Object.keys(recipes).length ? Object.entries(recipes).map(([k, v]) => `${k} → ${recipeText(v)}`).join('；') : CFG.learnNative ? '还没学到（手动点一次「终止」就会学）' : '学习已关闭'}`,
      `踢人请求格式：${Object.keys(shapeBySlug).length ? Object.entries(shapeBySlug).map(([k, v]) => `${k} → ${v}`).join('，') + '（已确认）' : '未确认（第一次踢掉会话时自动确认）'}`,
      `上次读取：${mode === 'other' ? '由另一个标签页读取' : net.lastErr ? '失败 · ' + net.lastErr : net.lastOkAt ? `成功 · ${sessions.length} 条` : '本页还没读过'}`,
      `保留名单：${ids.length} 条${stale ? `（其中 ${stale} 条已不在当前列表，可能已过期）` : ''}${legacyN ? ` · 旧版名单 ${legacyN} 条待迁移（读到列表后自动完成）` : ''}`,
      `检测间隔 ${CFG.interval} 秒 · 每轮最多踢 ${CFG.maxPerRound} 条 · 预演${CFG.dryRun ? '开' : '关'}`,
      `本标签页：${!CFG.enabled ? '守护未运行' : mode === 'other' ? '待命（另一个标签页在检测）' : '负责检测'}`,
    ];
    const text = lines.join('\n');
    if (!force && text === diagText) return;
    diagText = text;
    $('#csg-diag').textContent = text;
  }

  function renderLog(force) {
    if (!isOpen()) return;   // 面板没开就不排版
    const logs = get(K.logs, []);
    const text = (Array.isArray(logs) ? logs : []).slice(0, 60).join('\n') || '暂无记录';
    if (!force && text === logText) return;   // 内容没变就不动：可以正常选中复制
    logText = text;
    $('#csg-log').textContent = text;
  }

  function renderAll(force) {
    renderStatus(); renderList(force); renderDiag(force); renderLog(force);
  }

  /* ================= 启动 ================= */
  if (get(K.ver, '') !== VERSION) {
    OBSOLETE_KEYS.forEach((k) => set(k, undefined));
    log(`已更新到 v${VERSION}：只走网页原生活动会话接口；去掉页面点击、接口自学/探测和「受信任的设备」清理；保留名单改为按会话 ID。请把其它已打开的 claude.ai 标签页刷新一遍`);
    set(K.ver, VERSION);
  }

  GM_registerMenuCommand('🛡️ 打开会话守护面板', () => openPanel());
  GM_registerMenuCommand('▶️ 启动守护', () => startGuard());
  GM_registerMenuCommand('⏹ 停止守护', () => stopGuard());
  GM_registerMenuCommand('🧹 清除已保存数据（退出 / 换账号后）', () => clearSaved());

  installNativeWatch();
  W.addEventListener('pagehide', releaseLead);
  document.addEventListener('freeze', releaseLead);           // 浏览器冻结后台标签前让出领导权
  W.addEventListener('pageshow', (e) => { if (e && e.persisted) kickSoon(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { kickSoon(); return; }
    const l = get(K.leader, null);                              // 转到后台：告诉其它标签页可以接手
    if (l && l.tab === TAB_ID) set(K.leader, { tab: TAB_ID, ts: Date.now(), hidden: true });
  });
  W.addEventListener('focus', kickSoon);

  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn());
  ready(() => {
    try { buildUI(); } catch (e) {}
    setInterval(() => {
      try {
        mountUI();
        if (isOpen()) renderAll(false); else renderStatus();
      } catch (e) {}
    }, 1000);
    setInterval(watchdog, 5000);
    if (CFG.enabled) setTimeout(loop, 1500);
  });
})();
