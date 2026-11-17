import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve('dist')
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (pathname === '/') {
      res.writeHead(302, { Location: '/catalogue/' }).end()
      return
    }
    let file = resolve(root, `.${pathname}`)
    if (!file.startsWith(root + sep)) {
      res.writeHead(403).end()
      return
    }
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(302, { Location: pathname + '/' }).end()
        return
      }
      file = resolve(file, 'index.html')
    }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  } catch {
    res.writeHead(404).end('Not found')
  }
})
server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () =>
  console.log(`Independent sites listening on port ${process.env.PORT || 4173}`),
)
