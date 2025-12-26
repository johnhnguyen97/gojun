import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

// Get git info for version
const getGitInfo = () => {
  try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
    const commitDate = execSync('git log -1 --format=%cd --date=short').toString().trim()
    return { commitHash, commitDate }
  } catch {
    return { commitHash: 'dev', commitDate: new Date().toISOString().split('T')[0] }
  }
}

const gitInfo = getGitInfo()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __GIT_COMMIT__: JSON.stringify(gitInfo.commitHash),
    __GIT_DATE__: JSON.stringify(gitInfo.commitDate),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          nlp: ['compromise'],
        },
      },
    },
  },
})
