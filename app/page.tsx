"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startRun,
  applyChoice,
  generateArtifact,
  shareText,
  currentTitle,
  dateKeyOf,
  serializeRun,
  reviveRun,
} from "@/lib/engine";
import { RANKS } from "@/lib/deck";
import { renderShareCard } from "@/lib/sharecard";
import type { State, Fx, Channel } from "@/lib/types";

type MeterKey = "clout" | "cred" | "receipts";

const CH: Record<Channel, { tag: string; cls: string; emoji: string }> = {
  slack: { tag: "#general", cls: "ch-slack", emoji: "💬" },
  dm: { tag: "Direct message", cls: "ch-dm", emoji: "💬" },
  email: { tag: "Email", cls: "ch-email", emoji: "✉️" },
  irl: { tag: "IRL", cls: "ch-irl", emoji: "🏢" },
  calendar: { tag: "Calendar", cls: "ch-cal", emoji: "📅" },
  hr: { tag: "HR", cls: "ch-hr", emoji: "📋" },
  review: { tag: "Performance review", cls: "ch-review", emoji: "📈" },
  allhands: { tag: "All-hands", cls: "ch-all", emoji: "📣" },
};

const LEGEND: Record<MeterKey, string> = {
  clout: "👔 Clout — how much leadership likes you. Hits zero, you're fired.",
  cred: "🤝 Cred — how much your team trusts you. Hits zero, you're managed out.",
  receipts: "🧾 Receipts — the screenshots pile up. Hits 100, you're escorted out.",
};

const SEEN_KEY = "mu_seen_v1";
const RUN_KEY = "mu_run_v1";

export default function Page() {
  const [run, setRun] = useState<State | null>(null);
  const [started, setStarted] = useState(false);
  const [help, setHelp] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [revealed, setRevealed] = useState<Record<MeterKey, boolean>>({
    clout: true,
    cred: true,
    receipts: true,
  });
  const [callouts, setCallouts] = useState<MeterKey[]>([]);
  const [fx, setFx] = useState<Fx | null>(null);
  const [fxKey, setFxKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const seedRef = useRef<string>("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const d = p.get("d");
    const key = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : dateKeyOf(new Date());
    seedRef.current = key;

    // resume today's run (mid-game or finished) across reloads
    try {
      const raw = window.localStorage.getItem(RUN_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.seed === key) {
          const revived = reviveRun(saved.run);
          if (revived) {
            setRun(revived);
            setStarted(true);
            setRevealed({ clout: true, cred: true, receipts: true });
            setTutorial(false);
            return;
          }
        }
      }
    } catch {}

    const firstTime = !window.localStorage.getItem(SEEN_KEY);
    setTutorial(firstTime);
    setRevealed({ clout: !firstTime, cred: !firstTime, receipts: !firstTime });
    setRun(startRun(key, false));
  }, []);

  // dev-only: lets the preview render a share card for visual QA (stripped in prod)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __mu?: unknown }).__mu = { renderShareCard, getRun: () => run };
  });

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  const choose = (idx: number) => {
    if (!run || run.status !== "alive" || busyRef.current) return;
    setCallouts([]);
    const next: State = {
      ...run,
      flags: { ...run.flags },
      record: [...run.record],
      pile: [...run.pile],
    };
    const f = applyChoice(next, idx);
    setRun(next);
    setFx(f);
    setFxKey((k) => k + 1);

    // progressive disclosure: reveal each meter the first time it moves
    if (tutorial) {
      const newly: MeterKey[] = [];
      (["clout", "cred", "receipts"] as MeterKey[]).forEach((m) => {
        const dk = m === "clout" ? f.dClout : m === "cred" ? f.dCred : f.dReceipts;
        if (dk !== 0 && !revealed[m]) newly.push(m);
      });
      if (newly.length) {
        setRevealed((r) => {
          const u = { ...r };
          newly.forEach((m) => (u[m] = true));
          return u;
        });
        setCallouts(newly);
      }
    }

    busyRef.current = true;
    clearTimers();
    timers.current.push(window.setTimeout(() => (busyRef.current = false), 280));
    if (f.toast) {
      setToast(f.toast);
      timers.current.push(window.setTimeout(() => setToast(null), 1700));
    }

    if (next.status !== "alive" && tutorial) {
      window.localStorage.setItem(SEEN_KEY, "1");
      setTutorial(false);
    }

    // persist the daily run so reloads resume exactly here
    if (!next.practice) {
      try {
        window.localStorage.setItem(
          RUN_KEY,
          JSON.stringify({ seed: next.seed, run: serializeRun(next) }),
        );
      } catch {}
    }
  };

  const flash = (m: string) => {
    setCopyToast(m);
    window.setTimeout(() => setCopyToast(null), 1600);
  };
  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(msg);
    } catch {
      flash("Long-press to copy");
    }
  };

  const shareFarewell = async () => {
    if (!run) return;
    const text = shareText(run);
    const blob = await renderShareCard(run);
    if (blob) {
      const file = new File([blob], "managing-up.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], text });
        } catch {
          /* user dismissed the share sheet */
        }
        return;
      }
      // desktop / no file-share: download the image + copy the caption
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "managing-up.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
      flash("Image saved · caption copied");
      return;
    }
    copy(text, "Copied!");
  };

  const reset = (s: State) => {
    clearTimers();
    setFx(null);
    setToast(null);
    setCallouts([]);
    setRevealed({ clout: true, cred: true, receipts: true });
    busyRef.current = false;
    setRun(s);
  };

  if (!run) {
    return (
      <main className="mu grid-bg">
        <div className="boot">Managing Up…</div>
      </main>
    );
  }

  // ---------- INTRO ----------
  if (!started) {
    return (
      <main className="mu grid-bg">
        <div className="intro">
          <div className="intro-kicker">Managing Up</div>
          <div className="intro-tag">a daily office survival game</div>
          <div className="welcome">
            <div className="welcome-head">📋 Welcome to {run.company}!</div>
            <p>
              You&apos;re our newest <b>{RANKS[run.rankIdx]}</b>. We&apos;re thrilled to have
              you. (We say that to everyone.)
            </p>
            <p>
              Your only real job is <b>managing up</b>: keep leadership happy, keep your team
              happy, and climb the ladder — without getting walked out by Friday.
            </p>
            <p className="muted">
              Every message is a decision. You&apos;ll figure out the rest on the job. How high
              can you get? 👑
            </p>
          </div>
          <button className="big-btn" onClick={() => setStarted(true)}>
            Start Day 1 →
          </button>
          <button className="linklike" onClick={() => setHelp(true)}>
            how it works
          </button>
        </div>
        {help && <HelpOverlay onClose={() => setHelp(false)} />}
      </main>
    );
  }

  // ---------- ENDING ----------
  if (run.status !== "alive") {
    const art = generateArtifact(run);
    const win = run.status === "ceo";
    const rungs = RANKS.length - 1 - run.rankIdx;
    const likes = 180 + run.day * 64 + run.clout * 7;
    return (
      <main className="mu grid-bg">
        <div className="end">
          <div className={`verdict ${win ? "win" : "lose"}`}>{art.headline}</div>
          <div className="peak">
            {win
              ? "You reached the top. 👑"
              : `Peaked at ${currentTitle(run)} — ${rungs} rung${rungs === 1 ? "" : "s"} from the crown 👑`}
          </div>

          <div className="post">
            <div className="post-head">
              <div className="pf-av">🧑‍💼</div>
              <div className="pf-id">
                <div className="pf-name">You</div>
                <div className="pf-sub">
                  {win
                    ? `Chief Synergy Officer at ${run.company}`
                    : `former ${currentTitle(run)} at ${run.company} · #opentowork`}
                </div>
              </div>
              <div className="pf-in">in</div>
            </div>
            <div className="post-body">
              {art.post.map((line, i) =>
                line === "" ? (
                  <div key={i} className="gap" />
                ) : line.startsWith("• ") ? (
                  <div key={i} className="bullet">
                    {line}
                  </div>
                ) : line.startsWith("#") ? (
                  <p key={i} className="tags">
                    {line}
                  </p>
                ) : (
                  <p key={i}>{line}</p>
                ),
              )}
            </div>
            <div className="post-engage">
              👏🔥👍 {likes.toLocaleString()} · {Math.round(likes / 6)} comments ·{" "}
              {Math.round(likes / 11)} reposts
            </div>
          </div>

          <div className="stats">
            {art.stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="sv">{s.value}</div>
                <div className="sl">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="end-actions">
            <button className="btn-share" onClick={shareFarewell}>
              Share my farewell post 📸
            </button>
            <button
              className="btn-2"
              onClick={() =>
                reset(startRun("practice-" + Math.random().toString(36).slice(2, 9), true))
              }
            >
              Play again →
            </button>
            <div className="end-foot">
              <button className="linklike" onClick={() => copy(shareText(run), "Caption copied")}>
                copy as text
              </button>
              <span className="dot">·</span>
              <a className="linklike" href="/games/">
                the arcade
              </a>
            </div>
          </div>
        </div>
        {copyToast && <div className="toast">{copyToast}</div>}
      </main>
    );
  }

  // ---------- PLAYING ----------
  const card = run.card!;
  const chan = CH[card.channel];
  const rungsLeft = RANKS.length - 1 - run.rankIdx;
  return (
    <main className="mu grid-bg">
      <div className="hud">
        <div className="hud-top">
          <span className="co">{run.company}</span>
          <div className="hud-right">
            <span className="rank">
              {currentTitle(run)} · Day {run.day}
              {run.practice ? " · practice" : ""}
            </span>
            <button className="help-btn" onClick={() => setHelp(true)} aria-label="How it works">
              ?
            </button>
          </div>
        </div>

        <div className="ladder" title="Climb to CEO">
          {RANKS.map((r, i) => (
            <span
              key={i}
              className={`pip ${i <= run.rankIdx ? "on" : ""} ${i === run.rankIdx ? "cur" : ""}`}
            />
          ))}
          <span className="crown">👑</span>
          <span className="rungs">{rungsLeft === 0 ? "you're CEO" : `${rungsLeft} to go`}</span>
        </div>

        {revealed.clout && (
          <Meter icon="👔" name="Clout" val={run.clout} delta={fx?.dClout} fxKey={fxKey} color="clout" />
        )}
        {revealed.cred && (
          <Meter icon="🤝" name="Cred" val={run.cred} delta={fx?.dCred} fxKey={fxKey} color="cred" />
        )}
        {revealed.receipts && (
          <div className={`receipts ${run.receipts >= 60 ? "hot" : ""}`}>
            <span>🧾 Receipts</span>
            <b>{run.receipts}</b>
            {fx && fx.dReceipts !== 0 && (
              <span key={fxKey} className="rdelta">
                {fx.dReceipts > 0 ? `+${fx.dReceipts}` : fx.dReceipts}
              </span>
            )}
          </div>
        )}
      </div>

      {callouts.length > 0 && (
        <div className="callouts">
          {callouts.map((m) => (
            <div className="callout" key={m}>
              {LEGEND[m]}
            </div>
          ))}
        </div>
      )}

      <div className="stage">
        {toast && <div className="banner">{toast}</div>}

        <div key={card.id} className={`card ${chan.cls}`}>
          <div className="card-head">
            <span className="avatar">{card.avatar ?? chan.emoji}</span>
            <div className="ch-id">
              <div className="from">{card.from ?? "Office"}</div>
              <div className="chtag">{chan.tag}</div>
            </div>
          </div>
          <div className="card-text">
            {card.text.split("\n").map((t, i) =>
              t === "" ? <div key={i} className="tgap" /> : <p key={i}>{t}</p>,
            )}
          </div>
        </div>

        {fx?.result && (
          <div key={fxKey} className="resultcap">
            {fx.result}
          </div>
        )}

        <div className="choices">
          {card.choices.map((c, i) => (
            <button
              key={i}
              className={`choice ${c.replyAll ? "chaos" : ""} ${c.end ? "exit" : ""}`}
              onClick={() => choose(i)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {help && <HelpOverlay onClose={() => setHelp(false)} />}
      {copyToast && <div className="toast">{copyToast}</div>}
    </main>
  );
}

function Meter({
  icon,
  name,
  val,
  delta,
  fxKey,
  color,
}: {
  icon: string;
  name: string;
  val: number;
  delta?: number;
  fxKey: number;
  color: "clout" | "cred";
}) {
  return (
    <div className="meter reveal">
      <span className="m-icon">{icon}</span>
      <span className="m-name">{name}</span>
      <div className="m-track">
        <div className={`m-fill ${color}`} style={{ width: `${val}%` }} />
      </div>
      <span className="m-val">{val}</span>
      {delta != null && delta !== 0 && (
        <span key={fxKey} className={`m-delta ${delta > 0 ? "up" : "down"}`}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-card" onClick={(e) => e.stopPropagation()}>
        <h3>How it works</h3>
        <p>Every message is a decision. Your choices change how people see you — there&apos;s no right answer, just consequences.</p>
        <div className="help-row">{LEGEND.clout}</div>
        <div className="help-row">{LEGEND.cred}</div>
        <div className="help-row">{LEGEND.receipts}</div>
        <p>Pass your <b>performance reviews</b> to climb the ladder. Reach the top 👑 — or end up #opentowork with a farewell post to share.</p>
        <button className="big-btn" onClick={onClose}>
          got it
        </button>
      </div>
    </div>
  );
}
