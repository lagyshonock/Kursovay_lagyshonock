import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

// https://vite.dev/config/
// Используем .mjs, чтобы на Windows чаще обходилось без отдельного spawn esbuild при загрузке конфига.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiPort = env.PORT || "3001"
  // 127.0.0.1: на Windows localhost часто даёт ::1, API слушает IPv4
  const apiTarget = `http://127.0.0.1:${apiPort}`

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          timeout: 120_000,
          proxyTimeout: 120_000,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          timeout: 120_000,
          proxyTimeout: 120_000,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
