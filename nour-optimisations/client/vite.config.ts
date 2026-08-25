import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Code splitting : chunks séparés pour React, React Router, Markdown
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
    // Séparer CSS en fichiers dédiés par chunk
    cssCodeSplit: true,
    // Limite de taille warnings
    chunkSizeWarningLimit: 200,
  },
  // Optimisation des dépendances (pré-bundling)
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-markdown', 'remark-gfm'],
  },
});
