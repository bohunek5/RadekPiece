import { defineConfig } from 'vite';
export default defineConfig({base:'./',optimizeDeps:{include:['three/addons/loaders/GLTFLoader.js']},build:{rollupOptions:{output:{manualChunks:{three:['three']}}}}});
