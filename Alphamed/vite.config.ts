import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// AlphaMedicol runs on its own port (5174) next to the Unified Rewards portal (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
    host: true,
  },
})
