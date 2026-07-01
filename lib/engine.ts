// "Managing Up" — engine: daily seed, the day-to-day state machine, and the
// generated LinkedIn-farewell artifact.
import { DECK, ONBOARDING, RANKS, COMPANIES } from "./deck";
import type { OfficeCard, State, Fx, Status } from "./types";

// --- deterministic RNG (date → the same company + deck for everyone) ----------
function xfnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dateKeyOf(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const BY_ID: Record<string, OfficeCard> = Object.fromEntries(DECK.map((c) => [c.id, c]));
const ONBOARD_BY_ID: Record<string, OfficeCard> = Object.fromEntries(
  ONBOARDING.map((c) => [c.id, c]),
);
const SAVE_V = 1;
const REVIEW_EVERY = 4;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export const currentTitle = (s: State) => RANKS[s.rankIdx];

// --- run lifecycle -----------------------------------------------------------
export function startRun(seed: string, practice = false): State {
  const rnd = mulberry32(xfnv1a("managing-up::" + seed));
  const company = COMPANIES[Math.floor(rnd() * COMPANIES.length)];
  const pile = shuffle(
    DECK.map((c) => c.id),
    rnd,
  );
  const state: State = {
    seed,
    practice,
    company,
    day: 1,
    rankIdx: 0, // Intern — start at the bottom
    clout: 40,
    cred: 40,
    receipts: 0,
    flags: {},
    record: [],
    pile,
    onboard: ONBOARDING.map((c) => c.id),
    reviewsDone: 0,
    fired: {},
    status: "alive",
    card: null,
  };
  state.card = drawCard(state);
  return state;
}

function eligible(c: OfficeCard, s: State): boolean {
  if (c.minDay && s.day < c.minDay) return false;
  if (c.requires && !c.requires(s)) return false;
  return true;
}

function drawCard(state: State): OfficeCard {
  // fixed onboarding first (the gentle "first day")
  if (state.onboard.length) {
    return ONBOARD_BY_ID[state.onboard.shift()!];
  }
  // performance review on a cadence (until you're at the top)
  if (
    state.rankIdx < RANKS.length - 1 &&
    state.day >= (state.reviewsDone + 1) * REVIEW_EVERY
  ) {
    return makeReview(state);
  }
  // draw from the pile, re-queuing cards that aren't eligible yet
  let tries = state.pile.length;
  while (tries-- > 0 && state.pile.length) {
    const id = state.pile.shift()!;
    const c = BY_ID[id];
    if (eligible(c, state)) return c;
    state.pile.push(id);
  }
  return makeFinale(state);
}

const REVIEW_SETUPS = [
  (t: string) =>
    `📋 Your first review. Brad opens a deck titled “${t} — Growth Conversation 🌱” and will not make eye contact.`,
  () =>
    `📋 Mid-cycle check-in. Brad: “Let's talk about your… trajectory.” He has clearly not opened your self-review.`,
  () =>
    `📋 Calibration season. Your name is on a spreadsheet, in a meeting, in a room you're not allowed into. Brad reports back.`,
  () =>
    `📋 “Quick chat?” — obviously a review. Brad brought a second laptop and a wellness pamphlet.`,
  () =>
    `📋 Skip-level review. The Skip sits in. Brad sweats through his quarter-zip. Everyone pretends this is normal.`,
  () =>
    `📋 Annual review. HR gave Brad a script; he is reading the script. “So. How do *you* think it's going?”`,
];

const MEETS_TOASTS = [
  "“Meets expectations.”",
  "“Solid contributor.” (devastating)",
  "“Let's revisit next cycle.”",
  "“A real team player.” (you got nothing)",
];

function makeReview(state: State): OfficeCard {
  const setup = REVIEW_SETUPS[state.reviewsDone % REVIEW_SETUPS.length];
  return {
    id: "review-" + state.reviewsDone,
    kind: "review",
    channel: "review",
    from: "Brad",
    avatar: "🧔",
    text: setup(currentTitle(state)),
    choices: [
      { label: "Let the numbers speak 📊" },
      { label: "Advocate hard for yourself 💪" },
      { label: "Credit the team, stay humble 🤝" },
    ],
  };
}

function makeFinale(state: State): OfficeCard {
  const good = state.clout + state.cred >= 108;
  const end = good
    ? {
        status: "acquired" as Status,
        title: "Acqui-hired",
        reason:
          "I survived all the way to the acquisition and scored a 'retention package' (a branded hoodie)",
      }
    : {
        status: "fired" as Status,
        title: "Redundant",
        reason:
          "the acquisition 'eliminated redundancies' and I was, devastatingly, a redundancy",
      };
  return {
    id: "finale",
    kind: "finale",
    channel: "allhands",
    from: "The Skip",
    avatar: "🕴️",
    text: `📣 Company-wide: ${state.company} has been acquired. “This is an exciting outcome for everyone.” Nobody is smiling.`,
    choices: [{ label: "Open the email 📩", end }],
  };
}

export function applyChoice(state: State, idx: number): Fx {
  const card = state.card!;
  const ch = card.choices[idx];
  const before = { clout: state.clout, cred: state.cred, receipts: state.receipts };
  let toast: string | undefined;

  // base effect
  if (ch.effect) {
    const e = ch.effect;
    if (e.clout) state.clout += e.clout;
    if (e.cred) state.cred += e.cred;
    if (e.receipts) state.receipts += e.receipts;
    if (e.flag) state.flags[e.flag] = true;
    if (e.note) state.record.push(e.note);
  }

  // dramatic exit baked into a choice (quit / finale)
  if (ch.end) {
    state.status = ch.end.status;
    state.endTitle = ch.end.title;
    state.endReason = ch.end.reason;
  }

  // performance review outcome
  if (card.kind === "review") {
    // The clever bit: you CAN'T fail upward on one maxed meter. Promotion is
    // scored on your WEAKER stat — leadership (clout) AND peers (cred) both have
    // to be there. Each option shores up one meter a little (flavor, plus a
    // tie-breaker that can tip a close call toward the stat you leaned on).
    if (idx === 1) state.clout += 5; // self-advocacy reads as confidence
    else if (idx === 2) state.cred += 6; // crediting the team builds trust
    state.clout = clamp(state.clout);
    state.cred = clamp(state.cred);
    const need = 56 + state.rankIdx * 6; // each rung up demands more, on BOTH meters
    const score = Math.min(state.clout, state.cred); // your weakest area is the one they see
    if (score >= need) {
      state.rankIdx = Math.min(RANKS.length - 1, state.rankIdx + 1);
      state.record.push(`got promoted to ${currentTitle(state)}`);
      toast = `⬆️ PROMOTED — ${currentTitle(state)}`;
      if (state.rankIdx === RANKS.length - 1) {
        state.status = "ceo";
        state.endTitle = "You Made CEO";
        state.endReason = "you failed upward, relentlessly, all the way to the top";
      }
    } else if (score <= 30) {
      if (state.flags.pip) {
        state.status = "fired";
        state.endTitle = "Performance-Improved Out";
        state.endReason = "I did not survive the PIP I was already on";
      } else {
        state.flags.pip = true;
        state.clout = Math.max(1, state.clout - 8);
        state.record.push("survived a PIP (a 'performance improvement plan')");
        toast = "⚠️ PIP";
      }
    } else {
      state.clout += 2;
      toast = MEETS_TOASTS[state.reviewsDone % MEETS_TOASTS.length];
    }
    state.reviewsDone++;
  }

  state.clout = clamp(state.clout);
  state.cred = clamp(state.cred);
  state.receipts = clamp(state.receipts);

  // meter-driven endings
  if (state.status === "alive") {
    if (state.clout <= 0) {
      state.status = "fired";
      state.endTitle = "Let Go";
      state.endReason = "my Clout hit zero — leadership 'just didn't see a path'";
    } else if (state.cred <= 0) {
      state.status = "pushed";
      state.endTitle = "Managed Out";
      state.endReason = "the team stopped covering for me and I became 'not a culture fit'";
    } else if (state.receipts >= 100) {
      state.status = "fired";
      state.endTitle = "Escorted Out";
      state.endReason = "the receipts went viral internally and legal got involved";
    }
  }

  // onboarding all sits on "Day 1"; resolving the LAST onboard card ticks over to
  // Day 2, so the real deck (8am standups, etc.) never collides with your 9am
  // first morning. Real cards advance the day normally.
  if (card.kind !== "onboard" || state.onboard.length === 0) state.day++;

  state.card = state.status === "alive" ? drawCard(state) : null;

  return {
    dClout: state.clout - before.clout,
    dCred: state.cred - before.cred,
    dReceipts: state.receipts - before.receipts,
    result: ch.result,
    toast,
  };
}

// --- score + share -----------------------------------------------------------
export function scoreLine(s: State): string {
  return `${currentTitle(s)} · survived ${s.day - 1} day${s.day - 1 === 1 ? "" : "s"}`;
}

const dedupe = (a: string[]) => Array.from(new Set(a));

function highlights(s: State, n = 4): string[] {
  const notes = dedupe(s.record).filter((x) => !x.startsWith("got promoted"));
  const picks = notes.slice(-n);
  const padding = [
    "maintained a load-bearing green Slack dot",
    "attended several meetings as a small grey circle",
    "showed up (mostly)",
  ];
  let i = 0;
  while (picks.length < 3 && i < padding.length) {
    if (!picks.includes(padding[i])) picks.push(padding[i]);
    i++;
  }
  return picks;
}

export interface Artifact {
  headline: string;
  stats: { label: string; value: string }[];
  post: string[]; // lines (bullets begin with "• ")
}

export function generateArtifact(s: State): Artifact {
  const rnd = mulberry32(xfnv1a(s.seed + "::" + s.status + s.day));
  const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const buzz = pick(["synergy", "alignment", "bandwidth", "a north star", "value-add", "leverage"]);
  const title = currentTitle(s);
  const days = s.day - 1;
  const hs = highlights(s);
  const promos = dedupe(s.record).filter((x) => x.startsWith("got promoted")).length;

  const stats = [
    { label: "Final title", value: title },
    { label: "Tenure", value: `${days} day${days === 1 ? "" : "s"}` },
    { label: "Promotions", value: String(promos) },
    { label: "Receipts on file", value: String(s.receipts) },
  ];

  if (s.status === "ceo") {
    return {
      headline: "🎉 You made CEO.",
      stats,
      post: [
        `🚀 Humbled, honored, and frankly unstoppable to announce that after just ${days} days I am the new Chief Synergy Officer of ${s.company}.`,
        ``,
        `They said you can't fail upward this fast. They were wrong, and they no longer work here.`,
        ``,
        `The journey:`,
        ...hs.map((h) => `• ${h}`),
        ``,
        `To everyone I stepped on on the way up: we did this together. 🙏`,
        `#blessed #leadership #synergy`,
      ],
    };
  }

  const leaveVerb =
    s.status === "quit"
      ? "step away from"
      : s.status === "acquired"
        ? "close this chapter at"
        : s.status === "pushed"
          ? "transition out of"
          : "move on from";

  const opener =
    s.status === "quit"
      ? `💼 Thrilled — and a little terrified — to share that I've decided to ${leaveVerb} ${s.company} after ${days} days as ${title}.`
      : `💼 It is with mixed emotions that I share I'll ${leaveVerb} ${s.company} after ${days} days as ${title}.`;

  return {
    headline: s.endTitle ?? "The End",
    stats,
    post: [
      opener,
      ``,
      `When I started I didn't know what ${buzz} meant. I still don't — but now I have it in my title.`,
      ``,
      `A few highlights I'll carry with me:`,
      ...hs.map((h) => `• ${h}`),
      ``,
      `Officially: “pursuing new opportunities.” Unofficially: ${s.endReason}.`,
      ``,
      `To Brad: per my last email.`,
      `#opentowork #blessed #synergy`,
    ],
  };
}

export function shareText(s: State): string {
  const head = "Managing Up";
  const verdict =
    s.status === "ceo" ? "👑 made CEO" : `🪦 ${s.endTitle ?? "out"}`;
  return `${head} @ ${s.company}\n${verdict} — ${currentTitle(s)}, ${s.day - 1} days\nclout ${s.clout} · cred ${s.cred} · 🧾 ${s.receipts}\nplay → liamhowell.com/games/managing-up`;
}

// --- persistence (localStorage-friendly) -------------------------------------
// The live `card` holds a function (requires) and can't be JSON'd, so we store a
// tiny reference and rebuild the card on load.
type CardRef =
  | { t: "deck" | "onboard"; id: string }
  | { t: "review" }
  | { t: "finale" };
type SavedRun = Omit<State, "card"> & { cardRef: CardRef | null; v: number };

export function serializeRun(s: State): SavedRun {
  const c = s.card;
  let cardRef: CardRef | null = null;
  if (c) {
    if (c.kind === "review") cardRef = { t: "review" };
    else if (c.kind === "finale") cardRef = { t: "finale" };
    else if (c.kind === "onboard") cardRef = { t: "onboard", id: c.id };
    else cardRef = { t: "deck", id: c.id };
  }
  const rest = { ...s } as Partial<State>;
  delete rest.card;
  return { ...(rest as Omit<State, "card">), cardRef, v: SAVE_V };
}

export function reviveRun(o: unknown): State | null {
  try {
    const saved = o as SavedRun;
    if (!saved || saved.v !== SAVE_V || !Array.isArray(saved.pile)) return null;
    const rest = { ...saved } as Partial<SavedRun>;
    delete rest.cardRef;
    delete rest.v;
    const s = rest as unknown as State;
    const ref = saved.cardRef;
    if (!ref) s.card = null;
    else if (ref.t === "review") s.card = makeReview(s);
    else if (ref.t === "finale") s.card = makeFinale(s);
    else if (ref.t === "onboard") s.card = ONBOARD_BY_ID[ref.id] ?? null;
    else s.card = BY_ID[ref.id] ?? null;
    return s;
  } catch {
    return null;
  }
}
