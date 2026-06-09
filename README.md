# World Cup 2026 Family Bets ⚽️💸

A family betting game built on a 2026 FIFA World Cup prototype.

- **`/client`** — React frontend (single-file React + Tailwind, bundled by Vite) with **PWA** support so it installs to a phone home screen. Tabs: Schedule (with bet placing), Groups, Knockout bracket, My Bets + Leaderboard.
- **`/server`** — Node.js + Express API with a **SQLite** database (`better-sqlite3`). JWT auth, betting, and a pari-mutuel payout engine.

---

## Local development

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
# Terminal 1 — backend  (http://localhost:3001)
cd server && npm install && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm install && npm run dev
```

Then open **http://localhost:5173**. Register an account (everyone starts with **100 points**) and start betting.

- The backend seeds all **104 World Cup matches** into SQLite on first run.
- `client/.env.local` already points the client at `http://localhost:3001`.
- Server config lives in `server/.env` (copy from `server/.env.example`). For local dev you can leave `ALLOWED_ORIGIN` and `DATABASE_PATH` blank.

### Settling a match (admin)

There is no admin UI — results are set via the admin endpoint, guarded by `ADMIN_PASSWORD`. Setting a result triggers the payout calculation for every bet on that match:

```bash
curl -X PATCH http://localhost:3001/api/matches/1/result \
  -H "Content-Type: application/json" \
  -H "x-admin-password: familyadmin" \
  -d '{"result":"team1"}'   # result: team1 | draw | team2
```

**Payouts (pari-mutuel):** all wagers on a match form a pool. Winners split the whole pool in proportion to their stake (rounded to the nearest point). If nobody picked the correct result, everyone is refunded their stake.

---

## Installing on a phone (PWA)

Once deployed (or on your LAN), open the site and:

- **iPhone:** Open in **Safari** → tap the **Share** button → **Add to Home Screen**.
- **Android:** Open in **Chrome** → tap the **⋮** menu → **Add to Home Screen / Install app**.

It launches full-screen (no browser bar). When a new version ships, an **"Update available"** banner appears with a **Refresh to update** button.

---

## Deployment

**Cost:** the frontend (Vercel) and the database (Turso) are free. The backend
needs a host — **Render's free tier** works at $0 (it sleeps after ~15 min idle,
so the first request after a nap is slow), or **Railway Hobby** (~$5/mo) for an
always-on server. Either way you do **not** need a paid volume, because the
data lives in Turso, not on the server's disk.

### 1. Database — Turso (free, persistent)

The server's SQLite filesystem is ephemeral on any free host, so we keep the
data in [Turso](https://turso.tech) (free, SQLite-compatible). The server uses
it as an **embedded replica** (`libsql`), so no code changes are needed — just
env vars.

```bash
# install the CLI, then:
turso auth signup
turso db create wc-bets
turso db show wc-bets --url      # -> TURSO_DATABASE_URL  libsql://wc-bets-xubozhu888.aws-us-west-2.turso.io
turso db tokens create wc-bets   # -> TURSO_AUTH_TOKEN.   eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODA5NjQ2NDYsImlkIjoiMDE5ZWE5YzItNzgwMS03OTlkLTkyY2YtODgwYzZhMTFhNTM2IiwicmlkIjoiZTdjYjU4ZTEtODRjMi00MTBmLTk5NDYtMDc3YjZkYTBlYjY1In0.F6qIsc3S7LYsRUz9EBOv1T7OCQg9GjmlGycLIf-HnoiVK2HetgrMvvSB-J0kWyrWACov4vHGME9-QvWwh3e4CA
```

Keep these two values for the backend step. (Skip this section entirely if you
use Railway with a paid Volume instead — set `DATABASE_PATH=/data/bets.db`.)

### 2. Backend — Render (free) or Railway

1. Push this repo to **GitHub**.
2. **Render:** [render.com](https://render.com) → **New** → **Web Service** → connect the repo. Root directory `server`, build `npm install`, start `node index.js`.
   **Railway alt:** [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → root `/server` (it auto-detects `railway.toml`).
3. Set environment variables:
   - `JWT_SECRET` — any long random string
   - `ADMIN_PASSWORD` — your chosen admin password
   - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` — from step 1
   - `DATABASE_PATH=/tmp/replica.db` — local replica cache (a writable temp path)
   - `ALLOWED_ORIGIN=https://your-vercel-url.vercel.app` *(fill in after the frontend is deployed)*
   - *(`PORT` is injected by the host automatically.)*
4. Deploy. The schema self-initializes and seeds the 104 matches into Turso on first boot. Copy the service URL, e.g. `https://wc-bets.onrender.com`.

### 3. Frontend — Vercel (free)

1. [vercel.com](https://vercel.com) → **New Project** → **Import** the repo. Root directory `client`.
2. Set the env var `VITE_API_BASE_URL=https://wc-bets.onrender.com` *(your backend URL, no trailing slash)*.
3. Deploy. `client/vercel.json` rewrites all routes to `index.html` so deep links/refreshes work.
4. Copy the Vercel URL, paste it into the backend's **`ALLOWED_ORIGIN`** var, and redeploy the backend so CORS accepts the frontend.

### 4. Share with family

- Drop the **Vercel URL** in the group chat.
- **iPhone:** "Open in Safari → Share → Add to Home Screen."
- **Android:** "Open in Chrome → ⋮ → Add to Home Screen."

---

## API reference (quick)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ username, password, display_name }` → 100 starting points |
| POST | `/api/auth/login` | `{ username, password }` → `{ token }` |
| GET | `/api/auth/me` | current user (auth) |
| GET | `/api/matches` | all matches |
| GET | `/api/matches/:id` | one match |
| PATCH | `/api/matches/:id/result` | **admin** — set result + run payouts |
| POST | `/api/bets` | `{ match_id, bet_choice, points_wagered }` (auth) |
| GET | `/api/bets/me` | my bets + summary (auth) |
| GET | `/api/bets/match/:id` | aggregated market for a match (no individual bettors) |
| GET | `/api/leaderboard` | users ranked by points |
| GET | `/api/health` | `{ status: "ok" }` (host health check) |

Auth: send `Authorization: Bearer <token>`. The client stores the JWT in `localStorage`.
