import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{outDir:'docs',emptyOutDir:true,chunkSizeWarningLimit:800},server:{port:5173,strictPort:true}});
