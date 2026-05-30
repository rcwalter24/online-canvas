import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: path.resolve(__dirname, 'electron/main.js'),
      },
      {
        entry: path.resolve(__dirname, 'electron/preload.js'),
        onstart(options) {
          options.reload()
        },
      },
    ]),
  ],
})

