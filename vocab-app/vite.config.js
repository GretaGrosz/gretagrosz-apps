import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { decaServiceWorker, decaVocab } from './scripts/vite-plugins.mjs'

export default defineConfig({
  plugins: [react(), decaVocab(), decaServiceWorker()],
})
