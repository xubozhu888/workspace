require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const db = require("./db");
const { signToken, authRequired, adminRequired } = require("./auth");

const app = express();

// CORS: in production, restrict to the deployed frontend via ALLOWED_ORIGIN
// (comma-separated list allowed). Localhost dev origins are always permitted,
// and when ALLOWED_ORIGIN is unset we allow all (convenient for local dev).
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / same-origin / mobile webview
      if (allowedOrigins.length === 0) return cb(null, true); // dev default
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());

const PORT = process.env.PORT || 3001;
const VALID_CHOICES = ["team1", "draw", "team2"];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  const { username, password, display_name } = req.body || {};
  if (!username || !password || !display_name) {
    return res.status(400).json({ error: "username, password and display_name are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(409).json({ error: "Username already taken" });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (username, password_hash, display_name, points) VALUES (?, ?, ?, 100)")
    .run(username, password_hash, display_name);
  const user = db
    .prepare("SELECT id, username, display_name, points FROM users WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const user = { id: row.id, username: row.username, display_name: row.display_name, points: row.points };
  res.json({ token: signToken(user), user });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------
app.get("/api/matches", (req, res) => {
  const rows = db.prepare(`SELECT id, "group", team1, team2, match_date, venue, status, result FROM matches ORDER BY match_date, id`).all();
  res.json({ matches: rows });
});

app.get("/api/matches/:id", (req, res) => {
  const row = db.prepare(`SELECT id, "group", team1, team2, match_date, venue, status, result FROM matches WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Match not found" });
  res.json({ match: row });
});

// Admin: set a result and settle all bets on the match.
app.patch("/api/matches/:id/result", adminRequired, (req, res) => {
  const { result } = req.body || {};
  if (!["team1", "draw", "team2"].includes(result)) {
    return res.status(400).json({ error: "result must be one of team1 | draw | team2" });
  }
  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(req.params.id);
  if (!match) return res.status(404).json({ error: "Match not found" });
  if (match.status === "finished" || match.result) {
    return res.status(409).json({ error: "Match already settled" });
  }

  const settlement = settleMatch(match.id, result);
  const updated = db.prepare(`SELECT id, "group", team1, team2, match_date, venue, status, result FROM matches WHERE id = ?`).get(match.id);
  res.json({ match: updated, settlement });
});

// Payout engine — runs inside one transaction.
const settleMatch = db.transaction((matchId, result) => {
  db.prepare("UPDATE matches SET result = ?, status = 'finished' WHERE id = ?").run(result, matchId);

  const bets = db.prepare("SELECT * FROM bets WHERE match_id = ?").all(matchId);
  const total_pool = bets.reduce((s, b) => s + b.points_wagered, 0);
  const winningBets = bets.filter((b) => b.bet_choice === result);

  const insertPayout = db.prepare("INSERT INTO payouts (bet_id, points_awarded) VALUES (?, ?)");
  const addPoints = db.prepare("UPDATE users SET points = points + ? WHERE id = ?");

  // No winners → refund every bettor their original stake.
  if (winningBets.length === 0) {
    for (const b of bets) {
      insertPayout.run(b.id, b.points_wagered);
      addPoints.run(b.points_wagered, b.user_id);
    }
    return { total_pool, winners: 0, refunded: bets.length, mode: "refund" };
  }

  // Winners share the whole pool proportionally to their stake.
  const total_winning_pool = winningBets.reduce((s, b) => s + b.points_wagered, 0);
  for (const b of winningBets) {
    const award = Math.round((b.points_wagered / total_winning_pool) * total_pool);
    insertPayout.run(b.id, award);
    addPoints.run(award, b.user_id);
  }
  return { total_pool, winners: winningBets.length, total_winning_pool, mode: "payout" };
});

// ---------------------------------------------------------------------------
// Bets
// ---------------------------------------------------------------------------
app.post("/api/bets", authRequired, (req, res) => {
  const { match_id, bet_choice, points_wagered } = req.body || {};
  if (!VALID_CHOICES.includes(bet_choice)) {
    return res.status(400).json({ error: "bet_choice must be team1 | draw | team2" });
  }
  const wager = Number(points_wagered);
  if (!Number.isInteger(wager) || wager < 1) {
    return res.status(400).json({ error: "points_wagered must be a positive integer" });
  }

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(match_id);
  if (!match) return res.status(404).json({ error: "Match not found" });
  if (match.status !== "upcoming") return res.status(409).json({ error: "Betting is closed for this match" });

  const existing = db.prepare("SELECT id FROM bets WHERE user_id = ? AND match_id = ?").get(req.user.id, match_id);
  if (existing) return res.status(409).json({ error: "You already placed a bet on this match" });

  const fresh = db.prepare("SELECT points FROM users WHERE id = ?").get(req.user.id);
  if (wager > fresh.points) return res.status(400).json({ error: "Not enough points" });

  const place = db.transaction(() => {
    db.prepare("UPDATE users SET points = points - ? WHERE id = ?").run(wager, req.user.id);
    const info = db
      .prepare("INSERT INTO bets (user_id, match_id, bet_choice, points_wagered) VALUES (?, ?, ?, ?)")
      .run(req.user.id, match_id, bet_choice, wager);
    return info.lastInsertRowid;
  });
  const betId = place();

  const bet = db.prepare("SELECT * FROM bets WHERE id = ?").get(betId);
  const balance = db.prepare("SELECT points FROM users WHERE id = ?").get(req.user.id).points;
  res.status(201).json({ bet, balance });
});

app.get("/api/bets/me", authRequired, (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.id, b.match_id, b.bet_choice, b.points_wagered, b.created_at,
              m."group" AS match_group, m.team1, m.team2, m.match_date, m.venue, m.status, m.result,
              p.points_awarded
       FROM bets b
       JOIN matches m ON m.id = b.match_id
       LEFT JOIN payouts p ON p.bet_id = b.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC, b.id DESC`
    )
    .all(req.user.id);

  const bets = rows.map((r) => {
    let outcome = "pending";
    if (r.status === "finished") {
      if (r.bet_choice === r.result) outcome = "won";
      else if (r.points_awarded != null) outcome = "refunded";
      else outcome = "lost";
    }
    return { ...r, outcome };
  });

  const summary = {
    points_wagered: bets.reduce((s, b) => s + b.points_wagered, 0),
    points_earned: bets.reduce((s, b) => s + (b.points_awarded || 0), 0),
    total_bets: bets.length,
    balance: req.user.points,
  };
  res.json({ bets, summary });
});

// Aggregated betting market for a match — never exposes individual bettors.
app.get("/api/bets/match/:id", (req, res) => {
  const rows = db
    .prepare("SELECT bet_choice, SUM(points_wagered) AS pool, COUNT(*) AS bettors FROM bets WHERE match_id = ? GROUP BY bet_choice")
    .all(req.params.id);

  const totals = { team1: 0, draw: 0, team2: 0 };
  let total_pool = 0;
  let total_bettors = 0;
  for (const r of rows) {
    totals[r.bet_choice] = r.pool;
    total_pool += r.pool;
    total_bettors += r.bettors;
  }
  res.json({ match_id: Number(req.params.id), totals, total_pool, total_bettors });
});

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
app.get("/api/leaderboard", (req, res) => {
  const rows = db.prepare("SELECT display_name, username, points FROM users ORDER BY points DESC, display_name ASC").all();
  const leaderboard = rows.map((r, i) => ({ rank: i + 1, ...r }));
  res.json({ leaderboard });
});

// Railway health check hits this to confirm the app is up.
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`[server] WC2026 betting API listening on http://localhost:${PORT}`);
});
