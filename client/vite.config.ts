import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to network (0.0.0.0)
    port: 5173,
    allowedHosts: 'all',
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '4173'),
    allowedHosts: 'all',
  },
})
