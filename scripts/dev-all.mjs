import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
const sites = JSON.parse(readFileSync(new URL('../sites.json', import.meta.url), 'utf8'))
const processes = sites.map((site) =>
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--mode', site], {
    stdio: 'inherit',
  }),
)
function stop(signal) {
  for (const child of processes) child.kill(signal)
}
process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
for (const child of processes)
  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code
      stop('SIGTERM')
    }
  })
