/**
 * Запуск API + Vite (+ опционально бот) одним процессом Node.
 * API/бот в dev: nodemon (debounce, игнор *.sqlite) при наличии; иначе node --watch.
 *
 * Использование: node scripts/dev-runner.mjs
 * С ботом:      node scripts/dev-runner.mjs --bot
 */
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const node = process.execPath
const withBot = process.argv.includes("--bot")

const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js")
const nodemonJs = path.join(root, "node_modules", "nodemon", "bin", "nodemon.js")

/** Nodemon + debounce + игнор SQLite: меньше обрывов прокси (ECONNRESET), если watch перезапускает API во время запроса. */
function watchedServerArgs(entry) {
  if (fs.existsSync(nodemonJs)) {
    return [
      nodemonJs,
      "--quiet",
      "--delay",
      "0.6",
      "--watch",
      "server",
      "--ext",
      "js,mjs,cjs",
      "--ignore",
      "server/data.sqlite",
      "--ignore",
      "server/data.sqlite-wal",
      "--ignore",
      "server/data.sqlite-shm",
      entry,
    ]
  }
  return ["--watch", entry]
}

/** @type {import('node:child_process').ChildProcess[]} */
const children = []

function start(args, label) {
  const child = spawn(node, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  })
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1)
    if (code !== 0 && code != null) {
      console.error(`[${label}] остановка (код ${code})`)
      for (const c of children) {
        try {
          if (!c.killed) c.kill("SIGTERM")
        } catch {
          /* ignore */
        }
      }
      process.exit(code)
    }
  })
  children.push(child)
}

start(watchedServerArgs("server/index.js"), "api")
start([viteCli], "web")
if (withBot) start(watchedServerArgs("server/bot.js"), "bot")

function shutdown() {
  for (const c of children) {
    try {
      c.kill("SIGTERM")
    } catch {
      /* ignore */
    }
  }
}

process.on("SIGINT", () => {
  shutdown()
  process.exit(0)
})
process.on("SIGTERM", shutdown)
