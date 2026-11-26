// 运行：node userscripts/test/session-guard.test.mjs   （可用 CSG_SCRIPT=路径 指定要测的脚本）
import { run, row, ua, iso, defaultRevoke } from './harness.mjs';

const self = () => row({ session_uuid: 'web-self', application_slug: 'claude-ai', created_at: iso(300), last_active_at: iso(0), is_current: true, user_agent: ua('Chrome', 'Windows') });
const web = (id, min) => row({ session_uuid: id, application_slug: 'claude-ai', created_at: iso(min), last_active_at: iso(5), user_agent: ua('Firefox', 'Linux') });
const code = (id) => row({ session_uuid: id, application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' });

const ids = (st) => st.sessions.map((s) => s.session_uuid || s.token_uuid || String(s.created_at)).sort().join(',');
const results = [];
async function scenario(name, opts, check) {
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
  expect(state.revokes.filter((r) => r.body.session_uuid === 'web-b').length === 1, 'web-b 应直接用学到的格式一次踢掉'),
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

const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} 通过`);
process.exit(bad ? 1 : 0);
