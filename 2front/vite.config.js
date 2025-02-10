import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/


export default defineConfig({
  // ...other config options
  server: {
    // Listen on all network interfaces.
    host: true,
    // Allow all host headers.
    allowedHosts: 'all',
    // If you're using a tunnel (like ngrok), adjust HMR:
    hmr: {
      host: '66e8-212-47-148-9.ngrok-free.app', // your ngrok domain
      protocol: 'wss' // use 'wss' if you're tunneling over HTTPS
    }
  }
})
