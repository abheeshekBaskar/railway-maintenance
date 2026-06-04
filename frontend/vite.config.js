import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3001, proxy: { '/api': { target: 'http://backend:5001', changeOrigin: true } } }
})
