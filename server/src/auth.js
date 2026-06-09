const jwt = require("jsonwebtoken");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "dev_insecure_secret_change_me";

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
}

// Express middleware: require a valid Bearer token and attach req.user.
function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, username, display_name, points FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Admin guard: a single shared password supplied via header or body.
function adminRequired(req, res, next) {
  const supplied = req.headers["x-admin-password"] || (req.body && req.body.admin_password);
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "ADMIN_PASSWORD not configured on server" });
  }
  if (supplied !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password" });
  }
  next();
}

module.exports = { signToken, authRequired, adminRequired, JWT_SECRET };
