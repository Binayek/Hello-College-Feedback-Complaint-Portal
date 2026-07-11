//defineConfig Provides type hints and autocompletion for Vite configuration.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  //Enables React features such as JSX and Fast Refresh.
  plugins: [react()],
  server: {
    //proxy → Forwards any request starting with /api to http://localhost:5000
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})