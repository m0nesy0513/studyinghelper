import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Fix for Electron bug #49034 on Windows:
// require('electron') returns the npm package (path string) instead of the
// built-in Electron API module when ELECTRON_RUN_AS_NODE is set.
// This banner deletes the env var before any require() calls in the bundle.
const electronFixBanner = `delete process.env.ELECTRON_RUN_AS_NODE;
if (process.env.ELECTRON_RUN_AS_NODE !== undefined) {
  // If delete didn't work (e.g. read-only), warn and continue
  console.warn('[StudyingHelper] ELECTRON_RUN_AS_NODE could not be deleted, app may not start correctly');
}
`;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external: ['electron'],
        input: {
          index: resolve(__dirname, 'electron/main.ts')
        },
        output: {
          banner: electronFixBanner,
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        external: ['electron'],
        input: {
          index: resolve(__dirname, 'electron/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
})
