import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './manifest.json',
      watchFilePaths: ['src/**/*'],
      webExtConfig: {
        startUrl: 'https://google.com',
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js']
  }
});
