import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Chuyển tiếp các request /api sang Apache Tomcat backend (port 8080, context path /racehorse-backend)
      '/api': {
        target: 'http://localhost:8080/racehorse-backend',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, res) => {
            // Khi backend Java Tomcat chưa khởi động, phản hồi 503 để frontend tự động chuyển sang Fallback LocalStorage mượt mà
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'offline',
                message: 'Backend Java Servlet (Tomcat 8080) chưa bật - Frontend tự động kích hoạt chế độ Fallback LocalStorage.'
              }));
            }
          });
        }
      }
    }
  }
})
