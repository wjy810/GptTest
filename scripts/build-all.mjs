import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
const sites = JSON.parse(readFileSync(new URL('../sites.json', import.meta.url), 'utf8'))
for (const site of sites) {
  console.log(`Building standalone site: ${site}`)
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', site], {
    stdio: 'inherit',
  })
}
// A static-host entry point only: each destination remains its own HTML application.
writeFileSync(
  new URL('../dist/index.html', import.meta.url),
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./catalogue/"><title>FORM / FIELD</title></head><body><a href="./catalogue/">进入独立网站与资料目录</a></body></html>\n',
)
