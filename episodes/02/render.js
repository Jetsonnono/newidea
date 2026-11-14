/* Deterministic frame renderer for episode 02. */
const INK = "#16140F";
const CREAM = "#F6F1E6";
const DIM = "#B7AA96";
const FAINT = "rgba(246,241,230,0.16)";
const GOLD = "#E4B15A";
const CINNABAR = "#E23D32";
const FIELD = "#8FA56A";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function smooth(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function font(px, weight) {
  return (weight || 700) + " " + px + 'px "WenQuanYi Micro Hei", "文泉驿微米黑", sans-serif';
}

function enter(local, duration, delay, span) {
  const p = smooth(clamp((local * duration - delay) / (span || 0.42), 0, 1));
  return { p: p, dy: (1 - p) * 26 };
}

function useAlpha(ctx, alpha, draw) {
  ctx.save();
  ctx.globalAlpha = alpha;
  draw();
  ctx.restore();
}

function pairAt(scenes, t) {
  const fade = 0.34;
  let index = scenes.length - 1;
  for (let i = 0; i < scenes.length; i++) {
    if (t >= scenes[i].start && t < scenes[i].end) {
      index = i;
      break;
    }
  }
  const scene = scenes[index];
  const span = scene.end - scene.start;
  const local = clamp((t - scene.start) / span, 0, 1);
  if (index > 0 && t - scene.start < fade) {
    const mix = smooth((t - scene.start) / fade);
    return [
      { scene: scenes[index - 1], alpha: 1 - mix, local: 1 },
      { scene: scene, alpha: mix, local: local },
    ];
  }
  return [{ scene: scene, alpha: 1, local: local }];
}

function drawRing(ctx, cx, cy, radius, progress) {
  const count = 24;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    const on = i / count <= progress;
    const inner = radius - 14;
    const outer = radius + (on ? 22 : 8);
    ctx.strokeStyle = on ? GOLD : "rgba(246,241,230,0.22)";
    ctx.lineWidth = i % 6 === 0 ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
}

function drawBoard(ctx, w, h) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = FAINT;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.fillStyle = GOLD;
  ctx.fillRect(40, 40, 28, 6);
  ctx.fillRect(40, 40, 6, 28);
  ctx.fillRect(w - 68, 40, 28, 6);
  ctx.fillRect(w - 46, 40, 6, 28);
  ctx.fillRect(40, h - 46, 28, 6);
  ctx.fillRect(40, h - 68, 6, 28);
  ctx.fillRect(w - 68, h - 46, 28, 6);
  ctx.fillRect(w - 46, h - 68, 6, 28);
}

function formatClock(t) {
  const safe = Math.max(0, t);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe - m * 60);
  return m + ":" + String(s).padStart(2, "0");
}

function drawChrome(ctx, episode, t) {
  const w = episode.width;
  const h = episode.height;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = font(28, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText("02", 88, 168);
  ctx.textAlign = "right";
  ctx.fillStyle = GOLD;
  ctx.fillText("4C", w - 88, 168);
  ctx.textAlign = "left";

  const x = 88;
  const y = h - 132;
  const width = w - 176;
  ctx.fillStyle = "rgba(246,241,230,0.16)";
  ctx.fillRect(x, y, width, 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, width * clamp(t / episode.duration, 0, 1), 4);
  ctx.font = font(24, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(episode.series, 88, h - 88);
  ctx.textAlign = "right";
  ctx.fillText(formatClock(t), w - 88, h - 88);
  ctx.textAlign = "left";
}

function drawKicker(ctx, text, x, y, reveal) {
  ctx.globalAlpha *= reveal.p;
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y - 22, 18, 18);
  ctx.font = font(30, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(text, x + 32, y);
}

function drawOpen(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.05);
  const mark = enter(local, span, 0.12);
  const title = enter(local, span, 0.2);
  const sub = enter(local, span, 0.34);
  const hook = enter(local, span, 0.5);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 390 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= mark.p;
  ctx.font = font(32, 700);
  ctx.fillStyle = GOLD;
  ctx.fillText(scene.mark, 88, 500 + mark.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(112, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 660 + title.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= sub.p;
  ctx.font = font(48, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.sub, 88, 780 + sub.dy);
  ctx.fillStyle = GOLD;
  ctx.fillRect(88, 820 + sub.dy, 140, 8);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= hook.p;
  ctx.font = font(40, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.hook, 88, 930 + hook.dy);
  ctx.restore();
  drawRing(ctx, 540, 1360, 210, smooth(local));
}

function drawLogic(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.1);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 300 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(92, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 450 + title.dy);
  ctx.restore();
  scene.points.forEach(function (point, index) {
    const row = enter(local, span, 0.22 + index * 0.08);
    const y = 580 + index * 130 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.fillStyle = GOLD;
    ctx.fillRect(88, y - 36, 8, 48);
    ctx.font = font(52, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(point, 120, y);
    ctx.restore();
  });
  const cards = enter(local, span, 0.55);
  const y = 1040 + cards.dy;
  ctx.save();
  ctx.globalAlpha *= cards.p;
  ctx.fillStyle = "rgba(228,177,90,0.14)";
  ctx.fillRect(88, y, 430, 240);
  ctx.fillStyle = "rgba(143,165,106,0.18)";
  ctx.fillRect(542, y, 450, 240);
  ctx.font = font(28, 700);
  ctx.fillStyle = GOLD;
  ctx.fillText("北", 120, y + 70);
  ctx.fillStyle = FIELD;
  ctx.fillText("南", 574, y + 70);
  ctx.font = font(44, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.north, 120, y + 150);
  ctx.fillText(scene.south, 574, y + 150);
  ctx.restore();
  const foot = enter(local, span, 0.7);
  ctx.save();
  ctx.globalAlpha *= foot.p;
  ctx.font = font(36, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.foot, 88, 1420 + foot.dy);
  ctx.restore();
}

function drawBooks(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.08);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 300 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(84, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 450 + title.dy);
  ctx.restore();
  scene.rows.forEach(function (row, index) {
    const item = enter(local, span, 0.2 + index * 0.1);
    const y = 620 + index * 230 + item.dy;
    ctx.save();
    ctx.globalAlpha *= item.p;
    ctx.font = font(28, 700);
    ctx.fillStyle = GOLD;
    ctx.fillText(String(index + 1).padStart(2, "0"), 88, y);
    ctx.font = font(52, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(row[0], 88, y + 72);
    ctx.font = font(32, 700);
    ctx.fillStyle = DIM;
    ctx.fillText(row[1], 88, y + 130);
    ctx.restore();
  });
  const foot = enter(local, span, 0.62);
  ctx.save();
  ctx.globalAlpha *= foot.p;
  ctx.font = font(32, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.foot, 88, 1480 + foot.dy);
  ctx.restore();
}

function drawTech(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.1);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 300 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(84, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 460 + title.dy);
  ctx.restore();
  scene.items.forEach(function (item, index) {
    const row = enter(local, span, 0.22 + index * 0.08);
    const y = 620 + index * 170 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.fillStyle = "rgba(246,241,230,0.08)";
    ctx.fillRect(88, y, 904, 130);
    ctx.fillStyle = GOLD;
    ctx.fillRect(88, y, 8, 130);
    ctx.font = font(40, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(item, 140, y + 80);
    ctx.restore();
  });
  const foot = enter(local, span, 0.62);
  ctx.save();
  ctx.globalAlpha *= foot.p;
  ctx.font = font(36, 700);
  ctx.fillStyle = GOLD;
  ctx.fillText(scene.foot, 88, 1400 + foot.dy);
  ctx.restore();
}

function drawLine(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.1);
  const year = enter(local, span, 0.2, 0.5);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 300 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(80, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 450 + title.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= year.p;
  ctx.font = font(200, 700);
  ctx.fillStyle = CREAM;
  const y = 760 + year.dy;
  ctx.fillText("1911", 88, y);
  const width = ctx.measureText("1911").width;
  ctx.fillStyle = CINNABAR;
  ctx.fillRect(88, y + 28, Math.min(width, 820), 12);
  ctx.restore();
  const allow = enter(local, span, 0.4);
  ctx.save();
  ctx.globalAlpha *= allow.p;
  ctx.font = font(28, 700);
  ctx.fillStyle = FIELD;
  ctx.fillText("可以写", 88, 980 + allow.dy);
  ctx.font = font(42, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.allow, 88, 1050 + allow.dy);
  ctx.restore();
  scene.forbid.forEach(function (item, index) {
    const row = enter(local, span, 0.55 + index * 0.1);
    const lineY = 1220 + index * 140 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.font = font(48, 700);
    ctx.fillStyle = DIM;
    ctx.fillText(item, 88, lineY);
    const textWidth = ctx.measureText(item).width;
    ctx.strokeStyle = CINNABAR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, lineY - 16);
    ctx.lineTo(100 + textWidth, lineY - 16);
    ctx.stroke();
    ctx.restore();
  });
}

function drawForms(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.08);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 300 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(84, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 450 + title.dy);
  ctx.restore();
  scene.items.forEach(function (item, index) {
    const row = enter(local, span, 0.16 + index * 0.07);
    const y = 600 + index * 175 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.font = font(32, 700);
    ctx.fillStyle = GOLD;
    ctx.fillText(String(index + 1).padStart(2, "0"), 88, y);
    ctx.font = font(46, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(item, 180, y);
    ctx.restore();
  });
}

function drawEnd(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.05);
  ctx.save();
  ctx.globalAlpha *= k.p;
  ctx.font = font(30, 700);
  ctx.fillStyle = GOLD;
  ctx.fillText(scene.kicker, 88, 680 + k.dy);
  ctx.restore();
  scene.lines.forEach(function (line, index) {
    const row = enter(local, span, 0.14 + index * 0.1);
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.font = font(72, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(line, 88, 860 + index * 130 + row.dy);
    ctx.restore();
  });
  const note = enter(local, span, 0.55);
  ctx.save();
  ctx.globalAlpha *= note.p;
  ctx.fillStyle = GOLD;
  ctx.fillRect(88, 1280 + note.dy, 120, 8);
  ctx.font = font(32, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.note, 88, 1360 + note.dy);
  ctx.restore();
}

const DRAW = {
  open: drawOpen,
  logic: drawLogic,
  books: drawBooks,
  tech: drawTech,
  line: drawLine,
  forms: drawForms,
  end: drawEnd,
};

function drawFrame(ctx, episode, time) {
  const t = clamp(time, 0, episode.duration - 1e-4);
  ctx.clearRect(0, 0, episode.width, episode.height);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawBoard(ctx, episode.width, episode.height);
  pairAt(episode.scenes, t).forEach(function (layer) {
    const draw = DRAW[layer.scene.id];
    if (!draw) return;
    useAlpha(ctx, layer.alpha, function () {
      draw(ctx, layer.scene, layer.local);
    });
  });
  drawChrome(ctx, episode, t);
}

window.drawFrame = drawFrame;
