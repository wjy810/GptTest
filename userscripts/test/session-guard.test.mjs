// 运行：node userscripts/test/session-guard.test.mjs   （可用 CSG_SCRIPT=路径 指定要测的脚本，CSG_ONLY=正则 只跑部分场景）
import { run, row, ua, iso, defaultRevoke } from './harness.mjs';

const self = () => row({ session_uuid: 'web-self', application_slug: 'claude-ai', created_at: iso(300), last_active_at: iso(0), is_current: true, user_agent: ua('Chrome', 'Windows') });
const web = (id, min) => row({ session_uuid: id, application_slug: 'claude-ai', created_at: iso(min), last_active_at: iso(5), user_agent: ua('Firefox', 'Linux') });
const code = (id) => row({ session_uuid: id, application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' });

const ids = (st) => st.sessions.map((s) => s.session_uuid || s.token_uuid || String(s.created_at)).sort().join(',');
const results = [];
// CSG_ONLY=正则：只跑名字匹配的场景
const only = process.env.CSG_ONLY ? new RegExp(process.env.CSG_ONLY) : null;
async function scenario(name, opts, check) {
  if (only && !only.test(name)) return;
  const t0 = Date.now();
  let r, err = null;
  try { r = await run(opts); err = check(r); } catch (e) { err = e.stack || String(e); }
  const ok = !err;
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (!ok) {
    console.log('   ' + err);
    if (r) { console.log('   revokes: ' + JSON.stringify(r.state.revokes)); console.log(r.logs.map((l) => '   | ' + l).join('\n')); }
  }
}
const expect = (cond, msg) => (cond ? null : msg);
const first = (...xs) => xs.find(Boolean) || null;

// 1. 截图里的情况：Claude Code 会话要带自己的 application_slug，不带就“返回成功但没踢掉”
await scenario('Claude Code 会话按自己的应用标识踢掉，不残留', {
  sessions: [self(), web('web-a', 200), code('cc-1'), code('cc-2')], gm: { maxPerRound: 3 }, seconds: 8,
}, ({ state, logs }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(!logs.some((l) => l.includes('停止守护')), '不该停止守护'),
));

// 2. 旧版存下的 nativeShape=uuid（不带应用）不能再拿来优先用
await scenario('旧版学到的 uuid 格式不再优先', {
  sessions: [self(), code('cc-1')], gm: { nativeShape: 'uuid' }, seconds: 6,
}, ({ state }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(state.revokes.length === 1 && state.revokes[0].body.application_slug === 'claude-code', '第一次就应带 claude-code：' + JSON.stringify(state.revokes)),
));

// 3. 服务端只认 created_at：带 uuid 的格式都“返回成功但没踢掉”，要在同一轮里换到 raw+slug
await scenario('返回成功但还在 → 立即换下一种格式', {
  sessions: [self(), web('web-a', 200), web('web-b', 150)], gm: { maxPerRound: 2 }, seconds: 12,
  revoke: (body, st) => {
    if (!body || !('created_at' in body)) return { status: 200, json: {} };
    return defaultRevoke({ created_at: body.created_at, application_slug: body.application_slug }, st);
  },
}, ({ state, gm }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(gm.nativeShapes && /created/.test(gm.nativeShapes['claude-ai'] || ''), '应记住带 created_at 的格式：' + JSON.stringify(gm.nativeShapes)),
  // 先踢的那条要轮换格式；后踢的那条应直接用学到的格式一次踢掉（踢的顺序是新会话优先，不依赖具体是哪条）
  expect(state.revokes.filter((r) => r.body.session_uuid === state.revokes[state.revokes.length - 1].body.session_uuid).length === 1, '后踢的那条应一次踢掉'),
));

// 4. 服务端晚 1 秒才从列表里删掉：不能误判为“没踢掉”而多发别的格式
await scenario('服务端延迟删除也只发一次', {
  sessions: [self(), web('web-a', 200)], seconds: 6,
  revoke: (body, st) => {
    const s = st.sessions.find((x) => x.session_uuid === body.session_uuid);
    if (s && (s.application_slug || 'claude-ai') === (body.application_slug || 'claude-ai')) setTimeout(() => { st.sessions = st.sessions.filter((x) => x !== s); }, 1000);
    return { status: 200, json: {} };
  },
}, ({ state }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(state.revokes.length === 1, '应只发 1 次：' + JSON.stringify(state.revokes)),
));

// 5. 勾选保留的不踢
await scenario('保留名单里的会话不踢', {
  sessions: [self(), web('web-keep', 200), code('cc-1')], gm: { keepIds: ['web-keep'], keepMigrated: true, maxPerRound: 3 }, seconds: 6,
}, ({ state }) => expect(ids(state) === 'web-keep,web-self', '结果：' + ids(state)));

// 6. 服务端把“当前会话”也踢了：自检要立刻停手
await scenario('踢到自己时立即停止', {
  sessions: [self(), web('web-a', 200), web('web-b', 100)], gm: { maxPerRound: 3 }, seconds: 8,
  revoke: (body, st) => { st.selfLoggedOut = true; st.sessions = st.sessions.filter((x) => !x.is_current); return { status: 200, json: {} }; },
}, ({ state, gm, logs }) => first(
  expect(gm.enabled === false, '应已停止'),
  expect(state.revokes.length === 1, '停手前只应发 1 次：' + state.revokes.length),
  expect(logs.some((l) => l.includes('401') || l.includes('自检')), '应写明原因'),
));

// ---- 列表不给 session_uuid、Claude Code 那条创建时间为空（网页上显示“未知”）----
const noid = (o) => { delete o.session_uuid; return o; };
const selfN = () => noid(self());
const webN = (min) => noid(web('x', min));
const codeN = (uaStr) => noid(row({ application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: uaStr || 'claude-cli/2.1.0 (external, cli)' }));
const left = (st) => st.sessions.map((x) => `${x.application_slug}@${x.created_at === null ? 'null' : 't'}`).sort().join(',');

await scenario('没有 id、创建时间为空的 Claude Code 会话也能踢掉', {
  sessions: [selfN(), webN(200), codeN()], gm: { maxPerRound: 3 }, seconds: 8,
}, ({ state, logs }) => first(
  expect(left(state) === 'claude-ai@t', '残留：' + left(state)),
  expect(!logs.some((l) => l.includes('停止守护')), '不该停止守护'),
));

await scenario('同类会话里有被保留的，就不发 created_at:null', {
  sessions: [selfN(), codeN('claude-cli/2.1.0 (external, cli)'), codeN('claude-desktop-code/1.0')],
  gm: { maxPerRound: 3, keepMigrated: true, keepIds: ['z:claude-code|claude-desktop-code/#'] }, seconds: 6,
}, ({ state, logs }) => first(
  expect(!state.revokes.some((r) => r.body && r.body.created_at === null), '不该发 null 请求：' + JSON.stringify(state.revokes)),
  expect(state.sessions.some((x) => /desktop/.test(x.user_agent)), '保留的会话被踢了'),
  expect(logs.some((l) => l.includes('认不出来') || l.includes('踢不掉')), '应在日志里说明没踢的那条：\n' + logs.join('\n')),
  expect(!logs.some((l) => l.includes('✅ 干净了')), '不该说干净了'),
));

await scenario('服务端拒绝时写出字段诊断、不谎报干净', {
  sessions: [selfN(), codeN()], seconds: 6,
  revoke: (body) => ({ status: body && body.created_at === null ? 422 : 400, json: { error: { message: 'invalid session' } } }),
}, ({ state, logs }) => first(
  expect(left(state) === 'claude-ai@t,claude-code@null', '结果：' + left(state)),
  expect(logs.some((l) => l.includes('被拒（422') && l.includes('invalid session')), '应记下服务端回复'),
  expect(logs.some((l) => l.includes('字段：') && l.includes('application_slug="claude-code"') && l.includes('created_at=null')), '应记下字段结构'),
  expect(!logs.some((l) => l.includes('✅ 干净了')), '不该说干净了'),
  expect(!logs.some((l) => l.includes('停止守护')), '不该停止守护'),
));

await scenario('同组两条 Claude Code 会话，每次只删一条也能删光', {
  sessions: [selfN(), codeN(), codeN()], seconds: 8,
  revoke: (body, st) => {
    if (!body || body.created_at !== null) return { status: 400, json: {} };
    const i = st.sessions.findIndex((x) => x.application_slug === body.application_slug && x.created_at === null);
    if (i >= 0) st.sessions.splice(i, 1);
    return { status: 200, json: {} };
  },
}, ({ state }) => expect(left(state) === 'claude-ai@t', '残留：' + left(state)));

// ---- 学习网页原生的「终止」请求 ----
// Claude Code 会话只能用另一个接口删（像「设置 → Claude Code」里删授权）：脚本自带的格式全都无效
const tokenRow = (tok) => noid(row({ token_uuid: tok, application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' }));
const tokenApi = (req, st) => {
  const m = new URL(req.url()).pathname.match(/^\/api\/oauth\/tokens\/([^/]+)$/);
  if (!m || req.method() !== 'DELETE') return null;
  const i = st.sessions.findIndex((x) => x.token_uuid === decodeURIComponent(m[1]));
  if (i >= 0) st.sessions.splice(i, 1);
  return { status: 200, json: {} };
};
const onlyTokenRevoke = (body, st) => {
  if (body && body.application_slug === 'claude-code') return { status: 400, json: { error: 'use oauth token endpoint' } };
  return defaultRevoke(body, st);
};

await scenario('手动终止一次后学会网页的请求，新冒出的 Claude Code 会话自动踢掉', {
  sessions: [selfN(), tokenRow('tok-aaaa-1111')], seconds: 12, revoke: onlyTokenRevoke, extraApi: tokenApi,
  onTick: async (st, page) => {
    const t = Date.now() - st.t0;
    if (t > 3000 && !st.didNative) {
      st.didNative = true;
      // 网页自己：先读一次列表（检查观察器原样把返回交给网页），再用 Request 对象发 DELETE
      st.pageListOk = await page.evaluate(async () => {
        const r = await fetch('/api/auth/sessions/list-active', { headers: { accept: '*/*' } });
        const j = await r.json();
        return Array.isArray(j) && j.length === 2;
      });
      await page.evaluate(() => fetch(new Request('/api/oauth/tokens/tok-aaaa-1111', { method: 'DELETE', headers: { 'anthropic-client-platform': 'web_claude_ai' } })));
    }
    if (t > 4500 && !st.added) { st.added = true; st.sessions.push(tokenRow('tok-bbbb-2222')); }
  },
}, ({ state, gm, logs }) => first(
  expect(state.pageListOk === true, '观察器不该改动网页拿到的返回'),
  expect(gm.nativeRecipes && gm.nativeRecipes['claude-code'], '应学到 claude-code 的配方：\n' + logs.join('\n')),
  expect(left(state) === 'claude-ai@t', '残留：' + left(state) + '\n' + logs.join('\n')),
  expect(state.extra.some((x) => x.method === 'DELETE' && x.path.endsWith('tok-bbbb-2222') && x.headers['anthropic-client-platform'] === 'web_claude_ai'), '应照学到的格式（含 anthropic 头）踢 tok-bbbb：' + JSON.stringify(state.extra)),
  expect(!logs.some((l) => l.includes('停止守护')), '不该停止守护'),
));

await scenario('网页「退出本机」不会被学成踢人格式', {
  sessions: [self(), web('web-a', 200)], seconds: 4, gm: { dryRun: true },
  onTick: async (st, page) => {
    if (Date.now() - st.t0 > 1500 && !st.done) {
      st.done = true;
      const me = st.sessions.find((x) => x.is_current);
      await page.evaluate((m) => fetch('/api/auth/logout/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ session_uuid: m.session_uuid, application_slug: 'claude-ai' }) }), me);
    }
  },
  revoke: (body) => ({ status: 200, json: {} }),
}, ({ gm }) => expect(!gm.nativeRecipes || !Object.keys(gm.nativeRecipes).length, '不该学：' + JSON.stringify(gm.nativeRecipes)));

await scenario('学到的 created_at:null 配方同样遵守保留规则', {
  sessions: [selfN(), codeN('claude-cli/2.1.0 (external, cli)'), codeN('claude-desktop-code/1.0')],
  gm: { keepMigrated: true, keepIds: ['z:claude-code|claude-desktop-code/#'],
        nativeRecipes: { 'claude-code': { method: 'POST', path: [{ c: '' }, { c: 'api' }, { c: 'auth' }, { c: 'logout' }, { c: 'session' }], body: { created_at: { f: 'created_at' }, application_slug: { f: 'application_slug' } }, headers: {} } } },
  seconds: 5,
}, ({ state }) => first(
  expect(!state.revokes.some((r) => r.body && r.body.created_at === null), '不该发 null 请求：' + JSON.stringify(state.revokes)),
  expect(state.sessions.length === 3, '一条都不该少'),
));

// ---- 设置页自己的表格：踢完后让它按“切回本页”的规则重新拉取，并在面板里提示 ----
await scenario('踢完后设置页表格会被提醒重新拉取，面板提示可刷新', {
  sessions: [self(), web('web-a', 200)], seconds: 5,
  nativeScript: `window.__nativeRefetch = 0;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { window.__nativeRefetch++; fetch('/api/auth/sessions/list-active'); } });`,
  onTick: async (st, page) => {
    if (Date.now() - st.t0 > 4200 && !st.ui) {
      st.ui = await page.evaluate(() => {
        const k = Object.keys(window.__menu).find((n) => n.includes('打开'));
        window.__menu[k]();
        const p = document.getElementById('csg-panel');
        return { refetch: window.__nativeRefetch, stale: !p.querySelector('#csg-stale').hidden, text: p.querySelector('#csg-stale').textContent, reload: !p.querySelector('#csg-reload').hidden };
      });
    }
  },
}, ({ state }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(state.ui && state.ui.refetch === 1, '网页表格应被提醒重新拉取 1 次：' + JSON.stringify(state.ui)),
  expect(state.ui && state.ui.stale && state.ui.reload && /已踢掉 1 个/.test(state.ui.text), '面板应提示并显示刷新按钮：' + JSON.stringify(state.ui)),
));

await scenario('网页的普通请求（count_tokens、刷新登录）不会被观察', {
  sessions: [self(), web('web-a', 200)], seconds: 4, gm: { dryRun: true },
  extraApi: () => ({ status: 200, json: {} }),
  onTick: async (st, page) => {
    if (Date.now() - st.t0 > 1500 && !st.done) {
      st.done = true;
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) {
          await fetch('/api/organizations/org-1/count_tokens', { method: 'POST', body: JSON.stringify({ session_uuid: 'web-a' }) });
          await fetch('/api/auth/session', { method: 'POST', body: '{}' });
        }
      });
    }
  },
}, ({ gm, logs }) => first(
  expect(!logs.some((l) => l.includes('👀')), '不该有观察日志：\n' + logs.filter((l) => l.includes('👀')).join('\n')),
  expect(!gm.nativeRecipes || !Object.keys(gm.nativeRecipes).length, '不该学到：' + JSON.stringify(gm.nativeRecipes)),
));

await scenario('一次请求删掉同组多条：计数按实际条数', {
  sessions: [selfN(), codeN(), codeN()], seconds: 6,
  revoke: (body, st) => {
    if (!body || body.created_at !== null) return { status: 400, json: {} };
    st.sessions = st.sessions.filter((x) => !(x.application_slug === body.application_slug && x.created_at === null));
    return { status: 200, json: {} };
  },
}, ({ state, gm, logs }) => first(
  expect(left(state) === 'claude-ai@t', '残留：' + left(state)),
  expect(gm.kickedRun === 2, '计数应为 2：' + gm.kickedRun),
  expect(logs.some((l) => l.includes('同组 2 条')), '日志应写明同组 2 条'),
));

const keptCode = noid(row({ application_slug: 'claude-code', created_at: iso(50), last_active_at: iso(2), user_agent: 'claude-cli/2.0.9 (external, cli)' }));
await scenario('同应用里有保留的会话（哪怕有创建时间）也不发 created_at:null', {
  sessions: [selfN(), keptCode, codeN()],
  gm: { keepMigrated: true, keepIds: ['c:' + keptCode.created_at] }, seconds: 5,
}, ({ state }) => first(
  expect(!state.revokes.some((r) => r.body && r.body.created_at === null), '不该发 null 请求：' + JSON.stringify(state.revokes)),
  expect(state.sessions.length === 3, '一条都不该少：' + left(state)),
));

// ---- 守护运行中途有新的人登录：网页端和 Claude Code 都应在几个检测间隔内被踢掉，保留的不动 ----
await scenario('运行中途新登录的会话会被发现并踢掉', {
  sessions: [self(), web('web-keep', 400)], seconds: 10, gm: { keepMigrated: true, keepIds: ['web-keep'], interval: 1 },
  onTick: async (st) => {
    const t = Date.now() - st.t0;
    if (t > 3000 && !st.a) { st.a = Date.now(); st.sessions.push(web('intruder-web', 0)); }
    if (t > 3500 && !st.b) { st.b = Date.now(); st.sessions.push(code('intruder-cc')); }
    if (st.a && !st.goneA && !st.sessions.some((x) => x.session_uuid === 'intruder-web')) st.goneA = Date.now() - st.a;
    if (st.b && !st.goneB && !st.sessions.some((x) => x.session_uuid === 'intruder-cc')) st.goneB = Date.now() - st.b;
  },
}, ({ state }) => {
  console.log(`      新网页会话 ${state.goneA} ms 后被踢；新 Claude Code 会话 ${state.goneB} ms 后被踢（检测间隔 1 秒、每轮最多踢 1 条）`);
  return first(
    expect(ids(state) === 'web-keep,web-self', '结果：' + ids(state)),
    expect(state.goneA && state.goneB, '应都被踢掉'),
  );
});

// ---- 后台标签：Chrome 放久了会把页面定时器压到约 1 分钟一次。这里把页面里 ≥0.9 秒的定时器都压到 30 秒来模拟 ----
const throttle = `(function(){var st=window.setTimeout,si=window.setInterval;
  window.setTimeout=function(f,ms){var a=[].slice.call(arguments,2);return st.apply(window,[f,(ms|0)>=900?30000:ms].concat(a));};
  window.setInterval=function(f,ms){var a=[].slice.call(arguments,2);return si.apply(window,[f,Math.max(ms|0,30000)].concat(a));};})();`;
await scenario('后台定时器被压慢时仍按间隔检测（Worker 计时）', {
  sessions: [self()], seconds: 9, preScript: throttle,
  onTick: async (st) => {
    const t = Date.now() - st.t0;
    if (t > 3000 && !st.a) { st.a = Date.now(); st.sessions.push(web('intruder', 0)); }
    if (st.a && !st.gone && !st.sessions.some((x) => x.session_uuid === 'intruder')) st.gone = Date.now() - st.a;
  },
}, ({ state }) => {
  console.log(`      页面定时器被压到 30 秒时：新会话 ${state.gone} ms 后被踢（检测间隔 1 秒）`);
  return expect(state.gone && state.gone < 3000, '应在几秒内踢掉，实际：' + state.gone);
});

await scenario('网页不允许建 Worker 时退回普通定时器照常工作', {
  sessions: [self()], seconds: 6, preScript: 'window.Worker = undefined;',
  onTick: async (st) => { if (Date.now() - st.t0 > 2500 && !st.a) { st.a = 1; st.sessions.push(web('intruder', 0)); } },
}, ({ state, logs }) => first(
  expect(ids(state) === 'web-self', '残留：' + ids(state)),
  expect(!logs.some((l) => l.includes('PAGEERROR')), '不该报错'),
));

// ---- 一次进来好几个人：新登录的先踢；待踢多时自动加快（确认踢掉过一条之后），每条照样自检 ----
// seq：L = 读列表，R = 踢人请求。每轮 = 一次读列表 + 若干个（R + 确认读取）。同一轮连踢两条会出现 “RLR”
const order = (st) => st.revokes.map((r) => r.body.session_uuid).join(',');

await scenario('新登录的先踢（同时出现的按创建时间从新到旧）', {
  sessions: [self(), web('old-a', 300), web('old-b', 200)], seconds: 9,
  gm: { dryRun: true, autoBurst: false },
  onTick: async (st, page) => {
    const t = Date.now() - st.t0;
    if (t > 1500 && !st.a) { st.a = 1; st.sessions.push(code('cc-new'), web('web-new', 0)); }
    if (t > 2800 && !st.b) { st.b = 1; await page.evaluate(() => { window.__gm.dryRun = false; }); }
  },
}, ({ state }) => expect(order(state) === 'web-new,cc-new,old-b,old-a', '顺序：' + order(state)));

const crowd = (n) => Array.from({ length: n }, (_, i) => web('in-' + i, 50 - i * 5));
await scenario('一次进来 6 个人：确认踢掉一条后自动加快，几秒内清完', {
  sessions: [self()], seconds: 8,
  onTick: async (st) => {
    const t = Date.now() - st.t0;
    if (t > 2000 && !st.a) { st.a = Date.now(); st.sessions.push(...crowd(6)); }
    if (st.a && !st.clear && st.sessions.length === 1) st.clear = Date.now() - st.a;
  },
}, ({ state, logs }) => {
  console.log(`      自动加快：6 个人 ${state.clear} ms 清完；请求顺序 ${state.seq.replace(/^L+/, '')}`);
  return first(
    expect(ids(state) === 'web-self', '残留：' + ids(state)),
    expect(state.clear && state.clear < 4000, '应几秒内清完：' + state.clear),
    expect(order(state) === 'in-5,in-4,in-3,in-2,in-1,in-0', '应从新到旧：' + order(state)),
    expect(!/^L*LRLR/.test(state.seq), '第一轮还没确认踢掉过，不该连踢：' + state.seq),
    expect(/RLR/.test(state.seq), '之后应在同一轮连踢：' + state.seq),
    expect(logs.some((l) => l.includes('⚡')), '应记下自动加快'),
  );
});

await scenario('关掉自动加快：严格按每轮 1 条', {
  sessions: [self()], seconds: 9, gm: { autoBurst: false },
  onTick: async (st) => {
    const t = Date.now() - st.t0;
    if (t > 2000 && !st.a) { st.a = Date.now(); st.sessions.push(...crowd(4)); }
    if (st.a && !st.clear && st.sessions.length === 1) st.clear = Date.now() - st.a;
  },
}, ({ state }) => {
  console.log(`      不加快：4 个人 ${state.clear} ms 清完`);
  return first(
    expect(ids(state) === 'web-self', '残留：' + ids(state)),
    expect(!/RLR/.test(state.seq), '不该同一轮连踢：' + state.seq),
  );
});

await scenario('自动加快时踢到自己也只发 1 条就停', {
  sessions: [self(), ...crowd(5)], seconds: 7, gm: { kickedRun: 0 },
  onTick: async (st) => {
    // 先正常踢掉一条，让自动加快生效；之后服务端开始把“当前会话”一起踢掉
    if (st.revokes.length >= 1 && !st.evil) st.evil = true;
  },
  revoke: (body, st) => {
    if (st.evil) { st.selfLoggedOut = true; st.sessions = st.sessions.filter((x) => !x.is_current); return { status: 200, json: {} }; }
    return defaultRevoke(body, st);
  },
}, ({ state, gm }) => first(
  expect(gm.enabled === false, '应已停止'),
  expect(state.revokes.length === 2, '出事后应只多发 1 条：' + state.revokes.length),
));

// ---- v4.3.0：随机检测区间、带抖动的退避、偶发失败不报警、多标签页共用退避 ----
const gapsOf = (ts) => ts.slice(1).map((t, i) => t - ts[i]);
const fabState = (page) => page.evaluate(() => { const f = document.getElementById('csg-fab'); return f ? f.dataset.state : ''; });

await scenario('检测间隔随机：相邻两次读取的间隔不固定，且都在区间内', {
  sessions: [self()], seconds: 14, gm: { intervalMin: 1, intervalMax: 3 },
}, ({ state }) => {
  // 第 1 次是启动前的预览读取，第 2 次紧跟着是第一轮；从第 2 次开始算间隔
  const g = gapsOf(state.listTimes.slice(1));
  console.log(`      读取间隔（毫秒）：${g.join(', ')}`);
  return first(
    expect(g.length >= 4, '读取次数太少：' + g.length),
    expect(g.every((x) => x >= 950 && x <= 3400), '有间隔超出 1～3 秒：' + g.join(',')),
    expect(Math.max(...g) - Math.min(...g) >= 250, '间隔几乎一样，没有随机：' + g.join(',')),
  );
});

await scenario('旧版固定 5 秒自动换成 3～8 秒；区间输入框与预设可用', {
  sessions: [self()], seconds: 4, gm: { interval: 5 },
  onTick: async (st, page) => {
    if (Date.now() - st.t0 > 1000 && !st.ui) {
      st.ui = await page.evaluate(() => {
        const k = Object.keys(window.__menu).find((n) => n.includes('打开'));
        window.__menu[k]();
        const p = document.getElementById('csg-panel');
        const read = () => ({ min: p.querySelector('#csg-iv-min').value, max: p.querySelector('#csg-iv-max').value,
          active: [...p.querySelectorAll('.chip.active')].map((c) => c.textContent).join('|'), hint: p.querySelector('#csg-iv-hint').textContent });
        const before = read();
        const mn = p.querySelector('#csg-iv-min');
        mn.value = '12'; mn.dispatchEvent(new Event('change', { bubbles: true }));   // 最短越过最长：最长跟着挪
        const afterMin = { a: window.__gm.intervalMin, b: window.__gm.intervalMax };
        p.querySelector('.chip[data-a="5"][data-b="15"]').click();
        return { before, afterMin, afterChip: { a: window.__gm.intervalMin, b: window.__gm.intervalMax, active: read().active } };
      });
    }
  },
}, ({ state }) => {
  const u = state.ui || {};
  return first(
    expect(u.before && u.before.min === '3' && u.before.max === '8' && u.before.active === '3–8s', '迁移后应显示 3～8 秒：' + JSON.stringify(u.before)),
    expect(u.before && /3～8 秒之间随机/.test(u.before.hint), '提示应写明随机区间：' + JSON.stringify(u.before)),
    expect(u.afterMin && u.afterMin.a === 12 && u.afterMin.b === 12, '最短改成 12 时最长应跟到 12：' + JSON.stringify(u.afterMin)),
    expect(u.afterChip && u.afterChip.a === 5 && u.afterChip.b === 15 && u.afterChip.active === '5–15s', '点预设应变成 5～15：' + JSON.stringify(u.afterChip)),
  );
});

await scenario('偶发网络错误不亮黄灯、不刷 ⛔，照常踢人', {
  sessions: [self()], seconds: 10, gm: { intervalMin: 1, intervalMax: 2 },
  listFail: (st) => (st.listReads % 3 === 0 ? 'abort' : null),
  onTick: async (st, page) => {
    const t = Date.now() - st.t0;
    if (t > 3000 && !st.a) { st.a = 1; st.sessions.push(web('intruder', 0)); }
    if ((await fabState(page)) === 'warn') st.warn = true;
  },
}, ({ state, gm, logs }) => first(
  expect(state.listFails >= 2, '应至少出过 2 次网络错误：' + state.listFails),
  expect(!state.warn, '偶发一次不该亮黄灯'),
  expect(!logs.some((l) => l.includes('⛔')), '不该有 ⛔ 日志：\n' + logs.filter((l) => l.includes('⛔')).join('\n')),
  expect(logs.some((l) => l.includes('网络错误') && l.includes('偶发一次')), '应在日志里说明偶发一次'),
  expect(ids(state) === 'web-self', '入侵者应被踢掉：' + ids(state)),
  expect(gm.enabled === true, '不该停止守护'),
));

await scenario('持续失败：亮黄灯，退避逐次变长且带随机', {
  sessions: [self()], seconds: 16, gm: { intervalMin: 1, intervalMax: 1 },
  listFail: (st) => (st.listReads > 2 ? 'abort' : null),
  onTick: async (st, page) => { if ((await fabState(page)) === 'warn') st.warn = true; },
}, ({ state, gm, logs }) => {
  // 失败的读取：第 3 次起。第 1 次失败算偶发（按正常 1 秒再试），第 2 次起退避 2.5～5 秒、5～10 秒……
  const g = gapsOf(state.listTimes.slice(2));
  console.log(`      连续失败时的读取间隔（毫秒）：${g.join(', ')}`);
  return first(
    expect(g.length >= 3, '读取次数太少：' + g.join(',')),
    expect(g[0] >= 900 && g[0] <= 1400, '第 1 次失败后应按正常间隔再试：' + g[0]),
    expect(g[1] >= 2400 && g[1] <= 5400, '第 2 次失败后应退避 2.5～5 秒：' + g[1]),
    expect(g.length < 4 || (g[2] >= 4900 && g[2] <= 10400), '第 3 次失败后应退避 5～10 秒：' + g[2]),
    expect(state.warn, '连续失败应亮黄灯'),
    expect(logs.some((l) => l.includes('⛔') && l.includes('连续失败 2 次')), '应记下退避'),
    expect(gm.net4 && gm.net4.n >= 3, '失败次数应写进共用存储：' + JSON.stringify(gm.net4)),
    expect(gm.enabled === true, '不该停止守护'),
  );
});

const sharedUntil = Date.now() + 7000;
await scenario('别的标签页记下的退避在本页同样有效（接手后不会马上再发请求）', {
  sessions: [self()], seconds: 9, gm: { enabled: true, intervalMin: 1, intervalMax: 1, net4: { n: 3, until: sharedUntil } },
}, ({ state }) => {
  console.log(`      退避结束后 ${state.listTimes.length ? state.listTimes[0] - sharedUntil : '—'} ms 才第一次读取`);
  return first(
    expect(state.listTimes.length >= 1, '退避结束后应恢复读取'),
    expect(state.listTimes[0] >= sharedUntil - 50, `退避期间不该读取：早了 ${sharedUntil - state.listTimes[0]} ms`),
  );
});

await scenario('被限流（429 + Retry-After）时等够、期间续租；手动检测仍会真的读一次', {
  sessions: [self()], seconds: 14, gm: { intervalMin: 1, intervalMax: 1 },
  listFail: (st) => (st.listReads === 3 ? { status: 429, headers: { 'retry-after': '20' } } : null),
  onTick: async (st, page) => {
    const t = Date.now() - st.t0;
    if (t > 11000 && !st.lease) {
      st.lease = await page.evaluate(() => { const l = window.__gm.leader4; return l ? Date.now() - l.ts : -1; });
      st.readsBeforeClick = st.listReads;
      st.clickAt = Date.now();
      await page.evaluate(() => document.getElementById('csg-now').click());
    }
    if ((await fabState(page)) === 'warn') st.warn = true;
  },
}, ({ state, gm, logs }) => first(
  expect(state.readsBeforeClick === 3, '429 之后、手动检测之前不该再自动读取：读了 ' + state.readsBeforeClick + ' 次'),
  expect(state.lease >= 0 && state.lease < 7000, '退避期间应续租（租约应在几秒内刷新过）：' + state.lease + ' ms'),
  expect(state.warn, '被限流应亮黄灯'),
  expect(logs.some((l) => l.includes('限流（429）')), '日志应写明限流'),
  expect(state.listTimes.length > 3 && state.listTimes[3] >= state.clickAt, '手动检测应真的读一次'),
  expect(!gm.issue4 && !gm.net4, '读到列表后应清掉退避和提示：' + JSON.stringify({ issue: gm.issue4, net: gm.net4 })),
));

const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} 通过`);
process.exit(bad ? 1 : 0);
