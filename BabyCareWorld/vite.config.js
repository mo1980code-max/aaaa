import { defineConfig } from 'vite';

export default defineConfig({
  base: '/aaaa/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    allowedHosts: true
  }
});
