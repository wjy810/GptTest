import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import sites from './sites.json'

export default defineConfig(({ mode }) => {
  const site = ['development', 'production', 'test'].includes(mode) ? 'catalogue' : mode
  if (!sites.includes(site)) throw new Error(`Unknown website "${site}". Choose: ${sites.join(', ')}`)
  return {
    root: resolve(import.meta.dirname, 'apps', site),
    base: './',
    plugins: [react()],
    server: {
      port: 5173 + sites.indexOf(site),
      strictPort: true,
      fs: { allow: [import.meta.dirname] },
    },
    build: { outDir: resolve(import.meta.dirname, 'dist', site), emptyOutDir: true },
  }
})
