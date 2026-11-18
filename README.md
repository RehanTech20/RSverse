# RSverse — Two Players. One Universe.

A private, real-time two-player online multiplayer gaming platform featuring 9 synchronized games, private encrypted-channel chat, a shared memories timeline, live presence, achievements, and PWA installability.

## Included Games (9 Worlds)
1. **Tic Tac Toe** — Turn-based 3x3 duel with alternating starters and instant rematches
2. **Rock Paper Scissors** — Secret simultaneous lock-in across Best of 3, 5, or 10
3. **Connect 4** — 7x6 disc-drop strategy board with win-line highlights
4. **Memory Match** — 8-pair or 12-pair card matching with elapsed timer and precision tracking
5. **Truth or Dare** — Curated categories plus custom saved prompts
6. **Who Knows Who Better?** — Simultaneous secret answers, reveal & compatibility scoring
7. **Emoji Guess** — Curated pop-culture emoji puzzles with hints and countdown timer
8. **Drawing & Guessing** — Live synchronized HTML5 canvas strokes & guess validation
9. **Guess The Word** — 6 modes (Classic, Race, Timed, Hint, Category, Custom Secret Word) with 4–7 letter words

## Local Development

```bash
npm install
npm run dev
```

The unified Express + WebSocket + Vite server starts on `http://localhost:3000`.

### Environment Variables

Create a `.env` file (never commit secrets) based on `.env.example`:

- `PORT` — Server port (default `3000`)
- `SESSION_SECRET` — Strong random secret used to sign auth tokens and media cookies
- `VITE_SUPABASE_URL` — Optional Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Optional Supabase public anon key
- `APP_URL` — Public deployment URL

## Production Build & Node Hosting

```bash
npm run build
NODE_ENV=production npm start
```

> **Note on Hosting Architecture**: RSverse uses an authoritative Node.js + Express + WebSocket (`ws`) + SQLite backend (`server.ts`) for real-time multiplayer state and private media delivery. For full real-time WebSocket multiplayer without cold-start interruptions, host the full-stack Node server on a persistent Node runtime (such as Render, Railway, Fly.io, or Cloud Run), or configure Vercel frontend hosting with Supabase PostgreSQL + Realtime (`supabase/schema.sql`) and point API/WS requests to your backend host.

## Database & Supabase Setup

1. Create a Supabase project.
2. Open the Supabase **SQL Editor** and run `supabase/schema.sql` to create all tables, triggers (strict 2-player lock), indexes, RLS policies, and private Storage buckets (`avatars`, `memories`).
3. Configure **Authentication -> URL Configuration** in Supabase with your production domain and redirect URLs.
4. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SESSION_SECRET` in your deployment environment variables.
