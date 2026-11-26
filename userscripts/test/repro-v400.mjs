import { run, row, ua, iso } from './harness.mjs';
const sessions = [
  row({ session_uuid: 'web-self', application_slug: 'claude-ai', created_at: iso(300), last_active_at: iso(0), is_current: true, user_agent: ua('Chrome', 'Windows') }),
  row({ session_uuid: 'web-other', application_slug: 'claude-ai', created_at: iso(200), last_active_at: iso(5), user_agent: ua('Firefox', 'Linux') }),
  row({ session_uuid: 'cc-1', application_slug: 'claude-code', created_at: null, last_active_at: iso(1), location_info: null, user_agent: 'claude-cli/2.1.0 (external, cli)' }),
];
const { state, logs } = await run({ sessions, seconds: 8 });
console.log(logs.join('\n'));
console.log('\nrevokes:', JSON.stringify(state.revokes));
console.log('remaining:', state.sessions.map((s) => s.session_uuid).join(', '));
