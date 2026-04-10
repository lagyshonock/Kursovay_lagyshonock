import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me"

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email ?? null,
      name: user.name,
      tg: Boolean(user.telegram_id),
    },
    jwtSecret,
    { expiresIn: "7d" }
  )
}

export function signAdminToken() {
  return jwt.sign({ sub: "admin", role: "admin" }, jwtSecret, { expiresIn: "12h" })
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null
  if (!token) return res.status(401).json({ error: "unauthorized" })

  try {
    const payload = jwt.verify(token, jwtSecret)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: "unauthorized" })
  }
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null
  if (!token) return res.status(401).json({ error: "unauthorized" })

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload?.role !== "admin") return res.status(403).json({ error: "forbidden" })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: "unauthorized" })
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

