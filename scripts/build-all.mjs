import { execFileSync } from 'node:child_process'
for (const site of ['catalogue', 'editorial', 'brutalist', 'swiss', 'glass', 'terminal', 'organic']) {
  console.log(`Building standalone site: ${site}`)
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', site], { stdio: 'inherit' })
}
