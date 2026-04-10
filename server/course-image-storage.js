import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const uploadsRoot = path.join(__dirname, "uploads")
export const coursesUploadDir = path.join(uploadsRoot, "courses")

export function ensureCoursesUploadDir() {
  fs.mkdirSync(coursesUploadDir, { recursive: true })
}

/**
 * @param {Buffer} buffer
 * @param {string} [ext]
 * @returns {string} public path e.g. /uploads/courses/uuid.jpg
 */
export function saveCourseImageBuffer(buffer, ext = ".jpg") {
  ensureCoursesUploadDir()
  let safe = ".jpg"
  const e = String(ext).toLowerCase()
  if (e === ".jpeg" || e === ".jpg") safe = ".jpg"
  else if (e === ".png") safe = ".png"
  else if (e === ".gif") safe = ".gif"
  else if (e === ".webp") safe = ".webp"
  const name = `${crypto.randomUUID()}${safe}`
  fs.writeFileSync(path.join(coursesUploadDir, name), buffer)
  return `/uploads/courses/${name}`
}
