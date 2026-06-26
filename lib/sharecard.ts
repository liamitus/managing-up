// Renders the farewell post to a shareable PNG on a <canvas> — no dependencies,
// so it works in the static export. Returns a PNG Blob (or null on failure, so
// callers can fall back to text).
import { generateArtifact, currentTitle } from "./engine";
import type { State } from "./types";

const W = 1080;
const PAD = 56; // outer margin
const CPAD = 48; // card inner padding
const cardX = PAD;
const cardW = W - PAD * 2;
const innerX = cardX + CPAD;
const innerW = cardW - CPAD * 2;
const LINE = 44;

const font = (size: number, weight = 400) =>
  `${weight} ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

interface BodyLine {
  text: string;
  font: string;
  color: string;
  bullet?: boolean;
  blank?: boolean;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(s: State): Promise<Blob | null> {
  try {
    const art = generateArtifact(s);
    const win = s.status === "ceo";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const bodyFont = font(30);
    const boldFont = font(30, 700);

    // wrap the post into lines (measured on the default-size context — valid)
    const wrap = (text: string, f: string, maxW: number): string[] => {
      ctx.font = f;
      const words = text.split(" ");
      const out: string[] = [];
      let line = "";
      for (const w of words) {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = t;
      }
      if (line) out.push(line);
      return out;
    };

    const body: BodyLine[] = [];
    for (const raw of art.post) {
      if (raw === "") {
        body.push({ text: "", font: bodyFont, color: "#000", blank: true });
        continue;
      }
      const bullet = raw.startsWith("• ");
      const tag = raw.startsWith("#");
      const f = bullet ? boldFont : bodyFont;
      const color = tag ? "#0a66c2" : "#1a1f2e";
      for (const ln of wrap(raw, f, bullet ? innerW - 16 : innerW)) {
        body.push({ text: ln, font: f, color, bullet });
      }
    }

    const likes = 180 + s.day * 64 + s.clout * 7;
    const engage = `👏🔥👍 ${likes.toLocaleString()} · ${Math.round(likes / 6)} comments · ${Math.round(likes / 11)} reposts`;

    // ---- layout walk (draw=false measures, draw=true renders) ----
    const walk = (draw: boolean): number => {
      let y = PAD + CPAD;

      // verdict pill
      const stampText = win ? "👑 You made CEO" : art.headline;
      if (draw) {
        ctx.font = font(40, 800);
        const tw = ctx.measureText(stampText).width;
        const sw = tw + 56;
        const sx = (W - sw) / 2;
        roundRect(ctx, sx, y, sw, 66, 16);
        ctx.fillStyle = win ? "#dcfce7" : "#fee2e2";
        ctx.fill();
        ctx.fillStyle = win ? "#15803d" : "#b91c1c";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stampText, W / 2, y + 35);
        ctx.textAlign = "left";
      }
      y += 66 + 30;

      // header: avatar + name + sub + "in"
      if (draw) {
        ctx.beginPath();
        ctx.arc(innerX + 38, y + 38, 38, 0, Math.PI * 2);
        ctx.fillStyle = "#eef1f6";
        ctx.fill();
        ctx.font = font(40);
        ctx.fillStyle = "#1a1f2e";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💼", innerX + 38, y + 40);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = font(30, 800);
        ctx.fillStyle = "#1a1f2e";
        ctx.fillText("You", innerX + 96, y + 6);
        ctx.font = font(23);
        ctx.fillStyle = "#6b7280";
        const sub = win
          ? `Chief Synergy Officer at ${s.company}`
          : `former ${currentTitle(s)} at ${s.company} · #opentowork`;
        ctx.fillText(sub, innerX + 96, y + 46);
        // "in" badge
        roundRect(ctx, cardX + cardW - CPAD - 50, y + 14, 50, 50, 11);
        ctx.fillStyle = "#0a66c2";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = font(30, 800);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("in", cardX + cardW - CPAD - 25, y + 40);
        ctx.textAlign = "left";
      }
      y += 100;

      // divider
      if (draw) {
        ctx.strokeStyle = "#e6e9f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(innerX, y);
        ctx.lineTo(innerX + innerW, y);
        ctx.stroke();
      }
      y += 28;

      // body
      for (const l of body) {
        if (l.blank) {
          y += 18;
          continue;
        }
        if (draw) {
          ctx.font = l.font;
          ctx.fillStyle = l.color;
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          ctx.fillText(l.text, l.bullet ? innerX + 12 : innerX, y);
        }
        y += LINE;
      }
      y += 12;

      // divider
      if (draw) {
        ctx.strokeStyle = "#e6e9f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(innerX, y);
        ctx.lineTo(innerX + innerW, y);
        ctx.stroke();
      }
      y += 26;

      // engagement
      if (draw) {
        ctx.font = font(22);
        ctx.fillStyle = "#6b7280";
        ctx.textBaseline = "top";
        ctx.fillText(engage, innerX, y);
      }
      y += 50;

      // stats row
      const colW = innerW / 4;
      if (draw) {
        art.stats.forEach((st, i) => {
          const cx = innerX + colW * i + colW / 2;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.font = font(30, 800);
          ctx.fillStyle = "#1a1f2e";
          ctx.fillText(String(st.value), cx, y, colW - 8);
          ctx.font = font(17, 700);
          ctx.fillStyle = "#9aa3b2";
          ctx.fillText(st.label.toUpperCase(), cx, y + 40, colW - 6);
          ctx.textAlign = "left";
        });
      }
      y += 84;

      return y; // bottom of card content
    };

    const contentBottom = walk(false);
    const cardBottom = contentBottom + CPAD;
    const H = cardBottom + 96; // footer area

    canvas.width = W;
    canvas.height = H;

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#eef1f6");
    bg.addColorStop(1, "#e1e6f0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // card
    roundRect(ctx, cardX, PAD, cardW, cardBottom - PAD, 36);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    walk(true);

    // footer brand line
    ctx.font = font(24, 700);
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Managing Up · liamhowell.com/games/managing-up", W / 2, cardBottom + 48);
    ctx.textAlign = "left";

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
  } catch {
    return null;
  }
}
