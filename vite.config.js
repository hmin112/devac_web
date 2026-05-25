import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    // roslib.js legacy compatibility
    global: 'window',
  },
  server: {
    host: true, // Jetson 환경에서 외부 접속을 위해 필요
  }
})
