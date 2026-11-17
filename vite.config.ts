import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const sites = ['catalogue', 'editorial', 'brutalist', 'swiss', 'glass', 'terminal', 'organic']
export default defineConfig(({ mode }) => {
  const site = sites.includes(mode) ? mode : 'catalogue'
  return {
    root: resolve(import.meta.dirname, 'apps', site),
    base: './',
    plugins: [react()],
    server: { port: 5173 + sites.indexOf(site), strictPort: true, fs: { allow: [import.meta.dirname] } },
    build: { outDir: resolve(import.meta.dirname, 'dist', site), emptyOutDir: true },
  }
})
