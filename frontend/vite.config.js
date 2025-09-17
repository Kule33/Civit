import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173, // Your frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:5201', // **Confirm your backend's actual URL/port**
        changeOrigin: true,
        secure: false, // Set to true if your backend uses HTTPS
        // No rewrite needed if your backend routes are already like "api/controller"
      },
    },
  },
})
