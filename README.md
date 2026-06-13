# World Cup 2026 Family Bets ⚽️💸

A family betting game built on a 2026 FIFA World Cup prototype. Everyone starts
with 100 points and wagers them on group-stage matches; winners split the pool.

- **`/client`** — React frontend, **compiled by Vite** (React bundled, Tailwind compiled — no CDN), with **PWA** support so it installs to a phone home screen. Tabs: Schedule (place bets), Groups, Knockout bracket, My Bets + Leaderboard.
- **`/server`** — Node.js + Express API with a **SQLite** database (via `libsql`). JWT auth, betting, a pari-mutuel payout engine, and an admin flow to enter scores.

**Deployment model:** one container. The Express server serves the built React
app **and** the API from a single origin (`server/src/index.js` serves
`CLIENT_DIST` when set). The root `Dockerfile` builds the frontend and runs the
backend, so the whole app is one Docker service behind Caddy (automatic HTTPS).

---

## Local development

You need [Node.js](https://nodejs.org) 18+.

```bash
# Terminal 1 — backend  (http://localhost:3001)
cd server && npm install && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm install && npm run dev
```

Open **http://localhost:5173**, register an account, and bet.

- The backend seeds all **104 World Cup matches** into a local SQLite file on first run.
- `client/.env.local` points the client at `http://localhost:3001` in dev.
- Server config: copy `server/.env.example` → `server/.env`. For local dev you only need `JWT_SECRET` and `ADMIN_PASSWORD`; leave the Turso/`DATABASE_PATH`/`ALLOWED_ORIGIN` vars blank.

---

## How betting works

- **One bet per match**, deducted immediately.
- **Betting closes at kickoff.** The server rejects bets once the match start time has passed (times are US Eastern; the 2026 tournament is all EDT/UTC-4). The UI shows a live countdown and flips to "🔒 Closed" at kickoff.
- **Pari-mutuel payout.** All wagers on a match form a pool. The people who picked the correct outcome split the **whole pool** in proportion to their stake (rounded). If nobody got it right, everyone is refunded. Settling is idempotent.

## Settling matches (admin)

You decide results manually — there's no auto-pull of live scores.

**In the app (recommended):** go to **My Bets → 🔧 Admin**, enter your
`ADMIN_PASSWORD` (verified by the server), and admin mode turns on. Then open any
match on the Schedule tab → **enter the final score** (goals for each team) →
**Settle match**. The result is derived from the score and all bets pay out.
Finished matches then show the score everywhere.

**Or via curl:**
```bash
curl -X PATCH https://YOUR-DOMAIN/api/matches/1/result \
  -H "Content-Type: application/json" \
  -H "x-admin-password: YOUR_ADMIN_PASSWORD" \
  -d '{"score1": 2, "score2": 1}'   # team1 2 – 1 team2
```

---

## Installing on a phone (PWA)

Open the site and:

- **iPhone:** open in **Safari** → **Share** → **Add to Home Screen**.
- **Android / Huawei:** open in the browser → menu (**⋮**) → **Add to Home Screen / Install**.

It launches full-screen. The service worker **auto-updates**, so a new deploy
replaces the cached app on the next open (no manual refresh).

---

## Deployment — Hong Kong VPS

> **Why a Hong Kong VPS?** Western platforms (Vercel, Netlify, Cloudflare, Render's
> default domains) are throttled/blocked by the Great Firewall, so the app
> wouldn't load for family in mainland China without a VPN. **Hong Kong is
> outside the firewall and needs no ICP filing**, so an HK-hosted site loads from
> the mainland without a VPN. The whole app runs as **one Docker container** on a
> small (~$5/mo) HK VPS — no Vercel/Render/Turso needed.

### 1. Get the server
[Tencent Cloud Lighthouse](https://console.cloud.tencent.com/lighthouse) → **新建 (Create)**:
- **地域 (Region): 中国香港 (Hong Kong)** ← the critical setting.
- **镜像 (Image): Ubuntu 24.04**, **套餐 (Plan): ≥ 2 GB RAM** (the build compiles the frontend; 1 GB can run out of memory).
- Set the root password and copy the **public IP**.

*(Alibaba Cloud Hong Kong, or a CN2-GIA provider like BandwagonHost, work equally well.)*

### 2. Free hostname (DuckDNS) — needed for HTTPS / PWA
At [duckdns.org](https://www.duckdns.org): sign in, add a subdomain (e.g. `wc2026bets`), and set its IP to your VPS public IP. You now have `wc2026bets.duckdns.org` for free.
*(If duckdns is ever flaky in China, point a cheap `.com` A-record at the IP instead.)*

### 3. Open firewall ports
Lighthouse console → your instance → **防火墙 (Firewall)** → add inbound rules for **TCP 80** and **TCP 443** (source `0.0.0.0/0`). SSH (22) is already open.

### 4. Deploy
SSH in (`ssh root@<vps-ip>`), then:
```bash
curl -fsSL https://get.docker.com | sh          # install Docker
git clone https://github.com/xubozhu888/workspace.git
cd workspace

cat > .env <<EOF
DOMAIN=wc2026bets.duckdns.org
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=pick-a-strong-password
EOF

docker compose up -d --build
```
`docker-compose.yml` runs the app container plus **Caddy**, which auto-fetches a
Let's Encrypt certificate for your domain. The database is a local SQLite file in
the `betsdata` Docker volume (persists across restarts) — no external DB needed.

### 5. Verify
- `https://wc2026bets.duckdns.org` → the app loads.
- `https://wc2026bets.duckdns.org/api/matches` → 104 matches.
- Test on a **China phone, no VPN**, then Add to Home Screen.

```bash
docker compose logs -f app     # backend logs (expect "Seeded matches — 104 rows")
docker compose logs -f caddy   # HTTPS / certificate status
```

> Tip: if your VPS logs you in as a non-root user, prefix docker commands with
> `sudo`, or run `sudo usermod -aG docker $(whoami)` once and re-login.

---

## Operations

**Deploy an update** (after pushing to GitHub):
```bash
cd ~/workspace && git pull && docker compose up -d --build
```

**Back up the database:**
```bash
docker compose cp app:/data/bets.db ./bets-backup.db
```

**Inspect / edit data** (e.g. delete a test user). Run SQL against the live DB:
```bash
# read
docker compose exec app node -e "console.log(require('libsql')('/data/bets.db').prepare('SELECT username,points FROM users').all())"
# delete a user (remove their bets/payouts first to avoid orphans)
docker compose exec app node -e "
const db=require('libsql')('/data/bets.db');
const u=db.prepare('SELECT id FROM users WHERE username=?').get('testuser');
db.prepare('DELETE FROM payouts WHERE bet_id IN (SELECT id FROM bets WHERE user_id=?)').run(u.id);
db.prepare('DELETE FROM bets WHERE user_id=?').run(u.id);
db.prepare('DELETE FROM users WHERE id=?').run(u.id);
"
```

**Optional — keep data off the box (managed DB):** the server also supports
[Turso](https://turso.tech). Set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (and
uncomment them in `docker-compose.yml`) and it connects to Turso instead of the
local file. Not required for the VPS setup above.

---

## API reference

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ username, password, display_name }` → 100 starting points |
| POST | `/api/auth/login` | `{ username, password }` → `{ token }` |
| GET | `/api/auth/me` | current user (auth) |
| GET | `/api/matches` | all matches (incl. `result`, `score1`, `score2`) |
| GET | `/api/matches/:id` | one match |
| PATCH | `/api/matches/:id/result` | **admin** — `{ score1, score2 }` → derives result + runs payouts |
| POST | `/api/admin/verify` | **admin** — checks the password (used by the admin toggle) |
| POST | `/api/bets` | `{ match_id, bet_choice, points_wagered }` (auth; closed at kickoff) |
| GET | `/api/bets/me` | my bets + summary (auth) |
| GET | `/api/bets/match/:id` | aggregated market for a match (no individual bettors) |
| GET | `/api/leaderboard` | users ranked by points |
| GET | `/api/health` | `{ status: "ok" }` |

Auth: send `Authorization: Bearer <token>` (the client stores the JWT in
`localStorage`). Admin endpoints take an `x-admin-password` header.
