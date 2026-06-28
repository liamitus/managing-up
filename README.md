# Managing Up

A mobile-web **office survival card game**. You're the new hire — react to
Slack pings, emails, hallway ambushes, and performance reviews, one tap at a time.
Keep leadership happy (**Clout** 👔) and your team happy (**Cred** 🤝) without letting
the **Receipts** 🧾 pile up. Climb the ladder to CEO… or end up `#opentowork` with an
auto-generated LinkedIn farewell post to share.

**▶ Play: <https://liamhowell.com/games/managing-up/>** — a fresh office every run.

## How it plays

- **Every message is a decision.** There's no right answer, just consequences.
- **Two meters in tension** — sucking up to leadership burns your team, and vice
  versa. Hit zero on either and you're fired / managed out.
- **A hidden third** (Receipts) tracks the screenshots people take. Let it hit 100
  and you're escorted out.
- **Pass your performance reviews** to climb the org ladder. Reach the top — or get
  fired, managed out, or acqui-hired. Each ending writes you a different, very
  shareable corporate farewell.
- **Every run is a different company** with a different stack of moments — built for
  "just one more run."

## Tech

Next.js (App Router) · React · TypeScript · Tailwind. Ships as a fully **static
export** to GitHub Pages — no backend, no tracking.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
EXPORT=1 npm run build   # static export → out/
```

## The code

The writing **is** the game, so most of the fun lives in the deck.

- [`lib/deck.ts`](lib/deck.ts) — the office moments, the recurring cast (Brad, Dave,
  Priya, the Skip, Tyler…), the ranks, and the first-day onboarding
- [`lib/engine.ts`](lib/engine.ts) — daily seed, the turn state machine, performance
  reviews, end conditions, and the generated farewell post
- [`lib/types.ts`](lib/types.ts) — shared types
- [`app/page.tsx`](app/page.tsx) — the UI (HUD meters → office moment → choices → ending)
- [`app/globals.css`](app/globals.css) — the messaging/office-phone look + animations

Want to add an office moment? `lib/deck.ts` is designed for exactly that — PRs welcome.

## License

[MIT](LICENSE) © 2026 Liam Howell
