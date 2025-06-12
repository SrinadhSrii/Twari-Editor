import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 1337,
    open: '/pages/index.html',
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        index: 'pages/index.html',
        auth: 'pages/auth.html',
        customCode: 'pages/custom-code.html',
        elements: 'pages/elements.html',
        sites: 'pages/sites.html'
      },
      output: {
        manualChunks: {
          vendor: ['vite']
        }
      }
    },
    minify: 'terser',
    target: 'es2020'
  },
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    devSourcemap: true
  }
});