@AGENTS.md

# officegame — "Managing Up"

A daily, mobile-web office game: a **career-survival decision game** (the
score-maximizer/Balatro version was scrapped as too derivative — keep the office
theme, keep the mechanic original). Next.js 16 + React 19 + Tailwind v4 + TS.
Ships as a **static export** onto Liam's personal site at `/games/managing-up/`.
The old `/games/the-meeting/` path is a query-preserving redirect (links already
shared keep working) — see `~/dev/liamhowell.com/src/games/the-meeting/index.html`.

## "ship it" — how to deploy (IMPORTANT)

When Liam says **"ship it"** (or "deploy", "push it live"), run:

```bash
npm run ship            # or: npm run ship "custom commit message"
```

That script (`scripts/ship.sh`) does the whole pipeline:
1. `EXPORT=1 next build` → static export in `out/` (basePath `/games/managing-up`).
2. Copies `out/` → `~/dev/liamhowell.com/src/games/managing-up/`.
3. Ensures `.nojekyll` on the Pages repo (GitHub Pages' Jekyll otherwise drops `_next/`).
4. Commits the site source, then runs the site's own `npm run deploy`, which
   copies `src/*` into `~/dev/liamitus.github.io` and pushes → GitHub Pages.

Live at **https://liamhowell.com/games/managing-up/** (hub: `/games/`).
Shipping pushes to GitHub + a public domain. **Liam gave standing approval
("always ship it") — ship verified changes via `npm run ship` without pausing to
ask each time.** Still verify first (typecheck + preview); never ship broken or
unverified code. Standing approval covers this project's ship pipeline only.

## Deploy architecture (context)

- `~/dev/liamhowell.com` — plain static site (`src/` served directly). Its
  `npm run deploy` copies `src/*` → the sibling `~/dev/liamitus.github.io`
  (the Pages repo, `CNAME = liamhowell.com`) and pushes. `gh` is authed as `liamitus`.
- The "secret games section" is `src/games/` (hub `index.html` + one folder per game).
  Precedent: `src/frostline/` is an existing game at `/frostline/`.
- `next.config.ts` only switches to `output: 'export'` + `basePath` when `EXPORT=1`,
  so `npm run dev` stays a normal app at `/`.

## Code map

- `lib/deck.ts` — the cards (office "moments": Slack/email/IRL/calendar/HR), the
  recurring cast (Brad/Dave/Priya/Janet/the Skip/Tyler), RANKS, COMPANIES. **The
  writing IS the game** — humor + balance live here. `note` lines must be written
  in first person (they become bullets in the LinkedIn farewell).
- `lib/types.ts` — State / Card / Choice / Effect / Fx types.
- `lib/engine.ts` — daily seed, the turn state machine (deterministic draw pile,
  performance reviews on a cadence, end conditions), and `generateArtifact` (the
  LinkedIn farewell / promo post). Share text + scoring.
- `app/page.tsx` — UI (client): HUD meters → office-moment card → choices → ending.
- `app/globals.css` — messaging/office-phone aesthetic + animations.

## Game model (so changes stay consistent)

You navigate a tenure at a company by reacting to office moments (one tap per
choice). Two meters in tension: **Clout** 👔 (leadership) vs **Cred** 🤝 (peers) —
plus a hidden-ish **Receipts** 🧾 (screenshots) that can blow up. Hit 0 Clout →
fired; 0 Cred → managed out; 100 Receipts → escorted out. Performance **reviews**
fire every `REVIEW_EVERY` turns → promote up the org ladder (RANKS) or PIP→fire.
Reaching the top = CEO (win). Choices set **flags** for callbacks and push
first-person **notes** to your record. The run ends → a generated **LinkedIn
farewell post** built from your notes + ending = the share artifact. Daily seed
lives in the URL → that's the challenge link.
