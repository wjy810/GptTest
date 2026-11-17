import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const sites = JSON.parse(readFileSync(new URL('../sites.json', import.meta.url), 'utf8'))
for (const site of sites) {
  console.log(`Building standalone site: ${site}`)
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', site], {
    stdio: 'inherit',
  })
}
