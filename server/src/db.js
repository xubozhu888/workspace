const fs = require("fs");
const path = require("path");
const Database = require("libsql"); // drop-in for better-sqlite3, adds Turso support
const { SEED_MATCHES } = require("./seed");

// ---------------------------------------------------------------------------
// Database backend
//
//  - If TURSO_DATABASE_URL is set → connect DIRECTLY to the Turso primary
//    (remote mode): every read and write goes to the cloud DB. Data is
//    persistent and shared, so it survives redeploys with no paid volume.
//    (We deliberately avoid embedded-replica mode — `syncUrl` — because seeded
//    writes were not landing in the remote DB there.)
//
//  - Otherwise → a plain local SQLite file (ideal for local dev). On a host
//    with an ephemeral disk and no Turso, data would be lost on redeploy.
//
// The CREATE TABLE IF NOT EXISTS statements below make startup idempotent, so
// the schema self-initializes on a fresh database.
// ---------------------------------------------------------------------------
const TURSO_URL = process.env.TURSO_DATABASE_URL;

let db;
if (TURSO_URL) {
  db = new Database(TURSO_URL, { authToken: process.env.TURSO_AUTH_TOKEN });
  console.log("[db] Connected to Turso primary (remote mode)");
} else {
  const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.sqlite");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  try { db.pragma("journal_mode = WAL"); } catch (_) {}
  console.log(`[db] Local SQLite at ${DB_PATH}`);
}
try { db.pragma("foreign_keys = ON"); } catch (_) {}

// Run each statement on its own — libsql does NOT support a multi-statement
// string in a single exec() over a Turso connection.
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

// Idempotent migration: goal columns added after the initial schema.
const matchCols = db.prepare("PRAGMA table_info(matches)").all().map((c) => c.name);
if (!matchCols.includes("score1")) db.exec("ALTER TABLE matches ADD COLUMN score1 INTEGER");
if (!matchCols.includes("score2")) db.exec("ALTER TABLE matches ADD COLUMN score2 INTEGER");

// Idempotent migration: drop the legacy UNIQUE(user_id, match_id) constraint so
// a user can place multiple bets on the same match. SQLite can't drop a
// constraint-backed index in place, so rebuild the table when it's still there.
const hasUserMatchUnique = db.prepare("PRAGMA index_list(bets)").all().some((idx) => {
  if (!idx.unique) return false;
  const cols = db.prepare(`PRAGMA index_info("${idx.name}")`).all().map((c) => c.name);
  return cols.length === 2 && cols.includes("user_id") && cols.includes("match_id");
});
if (hasUserMatchUnique) {
  try { db.pragma("foreign_keys = OFF"); } catch (_) {}
  try { db.pragma("legacy_alter_table = ON"); } catch (_) {} // keep payouts' FK pointing at "bets"
  db.exec("ALTER TABLE bets RENAME TO bets_old");
  db.exec(`CREATE TABLE bets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    match_id       INTEGER NOT NULL,
    bet_choice     TEXT NOT NULL,
    points_wagered INTEGER NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES matches(id)
  )`);
  db.exec(`INSERT INTO bets (id, user_id, match_id, bet_choice, points_wagered, created_at)
           SELECT id, user_id, match_id, bet_choice, points_wagered, created_at FROM bets_old`);
  db.exec("DROP TABLE bets_old");
  try { db.pragma("legacy_alter_table = OFF"); } catch (_) {}
  try { db.pragma("foreign_keys = ON"); } catch (_) {}
  console.log("[db] Migrated bets: removed UNIQUE(user_id, match_id)");
}

// Seed all 104 matches on first run. Insert in chunks of multi-row VALUES so
// it's a handful of round-trips to Turso (not 104) while staying well under
// SQLite's bind-variable limit. INSERT OR IGNORE keeps it safe to re-run.
const matchCount = db.prepare("SELECT COUNT(*) AS c FROM matches").get().c;
if (matchCount === 0) {
  const tuple = "(?,?,?,?,?,?,?,?)";
  const CHUNK = 50;
  for (let i = 0; i < SEED_MATCHES.length; i += CHUNK) {
    const slice = SEED_MATCHES.slice(i, i + CHUNK);
    const sql =
      `INSERT OR IGNORE INTO matches (id, "group", team1, team2, match_date, venue, status, result) VALUES ` +
      slice.map(() => tuple).join(",");
    const params = [];
    for (const r of slice) {
      params.push(r.id, r.group, r.team1, r.team2, r.match_date, r.venue, r.status, r.result);
    }
    db.prepare(sql).run(...params);
  }
  const after = db.prepare("SELECT COUNT(*) AS c FROM matches").get().c;
  console.log(`[db] Seeded matches — table now has ${after} rows`);
} else {
  console.log(`[db] Matches already present: ${matchCount} rows`);
}

module.exports = db;
