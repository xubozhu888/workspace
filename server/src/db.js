const fs = require("fs");
const path = require("path");
const Database = require("libsql"); // drop-in for better-sqlite3, adds Turso support
const { SEED_MATCHES } = require("./seed");

// ---------------------------------------------------------------------------
// Database backend
//
//  - If TURSO_DATABASE_URL is set → use Turso (free, persistent cloud SQLite)
//    as an EMBEDDED REPLICA: a local cache file (DATABASE_PATH) kept in sync
//    with the remote primary. Reads are local & fast; writes are forwarded to
//    the remote, so data SURVIVES redeploys even on an ephemeral filesystem and
//    NO paid volume is required. Free Turso tier is plenty for a family app.
//
//  - Otherwise → a plain local SQLite file (ideal for local dev). On a host
//    with an ephemeral disk and no Turso, data would be lost on redeploy.
//
// Either way the CREATE TABLE IF NOT EXISTS statements below make startup
// idempotent, so the schema self-initializes on a fresh database.
// ---------------------------------------------------------------------------
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.sqlite");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;
if (TURSO_URL) {
  db = new Database(DB_PATH, {
    syncUrl: TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db.sync(); // pull existing rows from the remote primary on startup
  console.log(`[db] Turso embedded replica at ${DB_PATH} (synced from remote primary)`);
} else {
  db = new Database(DB_PATH);
  try { db.pragma("journal_mode = WAL"); } catch (_) {}
  console.log(`[db] Local SQLite at ${DB_PATH}`);
}
try { db.pragma("foreign_keys = ON"); } catch (_) {}

// Run each statement on its own — libsql does NOT support a multi-statement
// string in a single exec() over a Turso embedded replica (it raises
// "cannot rollback - no transaction is active").
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    points        INTEGER NOT NULL DEFAULT 100,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
    id         INTEGER PRIMARY KEY,
    "group"    TEXT,
    team1      TEXT NOT NULL,
    team2      TEXT NOT NULL,
    match_date TEXT,
    venue      TEXT,
    status     TEXT NOT NULL DEFAULT 'upcoming',
    result     TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS bets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    match_id       INTEGER NOT NULL,
    bet_choice     TEXT NOT NULL,
    points_wagered INTEGER NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, match_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES matches(id)
  )`,
  `CREATE TABLE IF NOT EXISTS payouts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    bet_id         INTEGER NOT NULL,
    points_awarded INTEGER NOT NULL,
    settled_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bet_id) REFERENCES bets(id)
  )`,
];
for (const stmt of SCHEMA) db.exec(stmt);

// Seed all 104 matches on first run (writes forward to the Turso primary when
// configured, so this only happens once across all deploys).
const matchCount = db.prepare("SELECT COUNT(*) AS c FROM matches").get().c;
if (matchCount === 0) {
  // Direct INSERTs only — do NOT wrap in db.transaction(): interactive
  // transactions do not reliably persist on a Turso embedded replica (they
  // silently write nothing), while plain INSERTs forward to the primary fine.
  // INSERT OR IGNORE keeps this safe to re-run.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO matches (id, "group", team1, team2, match_date, venue, status, result)
    VALUES (@id, @group, @team1, @team2, @match_date, @venue, @status, @result)
  `);
  for (const r of SEED_MATCHES) insert.run(r);
  const after = db.prepare("SELECT COUNT(*) AS c FROM matches").get().c;
  console.log(`[db] Seeded matches — table now has ${after} rows`);
} else {
  console.log(`[db] Matches already present: ${matchCount} rows`);
}

module.exports = db;
