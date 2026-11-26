// 列表不给 session_uuid、只靠 created_at + application_slug 定位；Claude Code 那条 created_at 是 null（网页上显示“未知”）
import { run, row, ua, iso } from './harness.mjs';
const strip = (o) => { delete o.session_uuid; return o; };
const sessions = [
  strip(row({ application_slug: 'claude-ai', created_at: iso(300), last_active_at: iso(0), is_current: true, user_agent: ua('Chrome', 'Windows') })),
  strip(row({ application_slug: 'claude-ai', created_at: iso(200), last_active_at: iso(5), user_agent: ua('Firefox', 'Linux') })),
  strip(row({ application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' })),
];
const { state, logs } = await run({ sessions, gm: { maxPerRound: 3 }, seconds: 8 });
console.log(logs.join('\n'));
console.log('\nrevokes:', JSON.stringify(state.revokes));
console.log('remaining:', state.sessions.map((s) => `${s.application_slug}@${s.created_at}`).join(', '));
