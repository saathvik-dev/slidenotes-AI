import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/slidenotes-AI/' : '/',
  plugins: [react()],
  build: {
    outDir: 'docs'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
}))
