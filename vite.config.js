import { defineConfig } from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{outDir:'docs',emptyOutDir:true,chunkSizeWarningLimit:900,rollupOptions:{input:{main:resolve('index.html'),renders:resolve('renders.html')}}},server:{port:5173,strictPort:true}});
