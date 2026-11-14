/* Deterministic frame renderer. render(t) draws one frame at time t seconds. */
const INK = "#12110F";
const CREAM = "#F3EEE6";
const DIM = "#A89F93";
const FAINT = "rgba(243,238,230,0.16)";
const RED = "#FF3B30";

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

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
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

function drawBoard(ctx, w, h) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = FAINT;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.fillStyle = RED;
  ctx.fillRect(40, 40, 28, 6);
  ctx.fillRect(40, 40, 6, 28);
  ctx.fillRect(w - 68, 40, 28, 6);
  ctx.fillRect(w - 46, 40, 6, 28);
  ctx.fillRect(40, h - 46, 28, 6);
  ctx.fillRect(40, h - 68, 6, 28);
  ctx.fillRect(w - 68, h - 46, 28, 6);
  ctx.fillRect(w - 46, h - 68, 6, 28);
}

function drawChrome(ctx, episode, t) {
  const w = episode.width;
  const h = episode.height;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = font(28, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText("01", 88, 168);
  ctx.textAlign = "right";
  ctx.fillStyle = RED;
  ctx.fillText("4C", w - 88, 168);
  ctx.textAlign = "left";

  const x = 88;
  const y = h - 132;
  const width = w - 176;
  ctx.fillStyle = "rgba(243,238,230,0.18)";
  ctx.fillRect(x, y, width, 4);
  ctx.fillStyle = RED;
  ctx.fillRect(x, y, width * clamp(t / episode.duration, 0, 1), 4);

  ctx.font = font(24, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(episode.series, 88, h - 88);
  ctx.textAlign = "right";
  ctx.fillText(formatClock(t), w - 88, h - 88);
  ctx.textAlign = "left";
}

function formatClock(t) {
  const safe = Math.max(0, t);
  const m = Math.floor(safe / 60);
  const s = safe - m * 60;
  const whole = Math.floor(s);
  return m + ":" + String(whole).padStart(2, "0");
}

function drawKicker(ctx, text, x, y, reveal) {
  ctx.globalAlpha *= reveal.p;
  ctx.fillStyle = RED;
  ctx.fillRect(x, y - 22, 18, 18);
  ctx.font = font(30, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(text, x + 32, y);
}

function drawOpen(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.05);
  const a = enter(local, span, 0.12);
  const b = enter(local, span, 0.22);
  const c = enter(local, span, 0.4);
  const d = enter(local, span, 0.55);

  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 560 + k.dy, k);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= a.p;
  ctx.font = font(148, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title[0], 88, 780 + a.dy);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= b.p;
  ctx.font = font(148, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title[1], 88, 960 + b.dy);
  ctx.fillStyle = RED;
  ctx.fillRect(88, 1010 + b.dy, 148, 10);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= c.p;
  ctx.font = font(28, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.officialLabel, 88, 1140 + c.dy);
  ctx.font = font(46, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.officialName, 88, 1212 + c.dy);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= d.p;
  ctx.font = font(32, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.meta, 88, 1340 + d.dy);
  ctx.restore();
}

function drawWhat(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.1);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 360 + k.dy, k);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(104, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 520 + title.dy);
  ctx.restore();

  scene.points.forEach(function (point, index) {
    const row = enter(local, span, 0.28 + index * 0.12);
    const y = 760 + index * 210 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.fillStyle = index === 0 ? RED : "rgba(243,238,230,0.09)";
    roundRect(ctx, 88, y, 904, 168, 8);
    ctx.fill();
    ctx.font = font(28, 700);
    ctx.fillStyle = index === 0 ? CREAM : RED;
    ctx.fillText(String(index + 1).padStart(2, "0"), 120, y + 64);
    ctx.font = font(40, 700);
    ctx.fillStyle = CREAM;
    wrapText(ctx, point, 120, y + 116, 820, 48);
    ctx.restore();
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = Array.from(text);
  let line = "";
  let lineY = y;
  for (let i = 0; i < chars.length; i++) {
    const next = line + chars[i];
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = chars[i];
      lineY += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
}

function drawWho(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const num = enter(local, span, 0.1, 0.5);
  const cap = enter(local, span, 0.28);

  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 340 + k.dy, k);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= num.p;
  ctx.font = font(280, 700);
  ctx.fillStyle = CREAM;
  const y = 700 + num.dy;
  ctx.fillText("2", 88, y);
  const w2 = ctx.measureText("2").width;
  const barX = 88 + w2 + 36;
  ctx.fillStyle = RED;
  ctx.fillRect(barX, y - 132, 96, 14);
  ctx.fillStyle = CREAM;
  ctx.fillText("9", barX + 96 + 36, y);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= cap.p;
  ctx.font = font(36, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.caption, 88, 790 + cap.dy);
  ctx.restore();

  scene.points.forEach(function (point, index) {
    const row = enter(local, span, 0.4 + index * 0.1);
    const y = 1080 + index * 175 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.fillStyle = RED;
    ctx.fillRect(88, y - 28, 8, 42);
    ctx.font = font(42, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(point, 120, y);
    ctx.restore();
  });
}

function drawPath(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.08);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 320 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(84, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 450 + title.dy);
  ctx.restore();

  const travel = smooth(clamp(local / 0.78, 0, 1));
  const x = 128;
  const y0 = 620;
  const gap = 250;
  ctx.strokeStyle = FAINT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y0 + gap * 2);
  ctx.stroke();
  ctx.strokeStyle = RED;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y0 + gap * 2 * travel);
  ctx.stroke();

  scene.steps.forEach(function (step, index) {
    const row = enter(local, span, 0.16 + index * 0.08);
    const y = y0 + index * gap;
    const on = travel + 0.04 >= index / 2;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.fillStyle = on ? RED : "#2A2724";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(52, 700);
    ctx.fillStyle = on ? CREAM : DIM;
    ctx.fillText(step[0], 180, y + 8);
    ctx.font = font(32, 700);
    ctx.fillStyle = DIM;
    ctx.fillText(step[1], 180, y + 64);
    ctx.restore();
  });

  const foot = enter(local, span, 0.55);
  ctx.save();
  ctx.globalAlpha *= foot.p;
  ctx.font = font(34, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.foot, 88, 1420 + foot.dy);
  ctx.restore();

  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(x, y0 + gap * 2 * travel, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawTracks(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const num = enter(local, span, 0.08);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 280 + k.dy, k);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= num.p;
  ctx.font = font(168, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.count, 88, 500 + num.dy);
  const countWidth = ctx.measureText(scene.count).width;
  ctx.font = font(40, 700);
  ctx.fillStyle = RED;
  ctx.fillText(scene.unit, 108 + countWidth, 500 + num.dy);
  ctx.restore();

  scene.items.forEach(function (item, index) {
    const col = index % 2;
    const rowIndex = Math.floor(index / 2);
    const row = enter(local, span, 0.18 + index * 0.03);
    const x = 88 + col * 470;
    const y = 660 + rowIndex * 168 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.font = font(26, 700);
    ctx.fillStyle = RED;
    ctx.fillText(String(index + 1).padStart(2, "0"), x, y);
    ctx.font = font(32, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(item, x, y + 52);
    ctx.restore();
  });
}

function drawStart(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.02);
  const title = enter(local, span, 0.1);
  ctx.save();
  drawKicker(ctx, scene.kicker, 88, 340 + k.dy, k);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(104, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 510 + title.dy);
  ctx.restore();

  scene.steps.forEach(function (step, index) {
    const row = enter(local, span, 0.24 + index * 0.12);
    const y = 700 + index * 250 + row.dy;
    ctx.save();
    ctx.globalAlpha *= row.p;
    ctx.font = font(72, 700);
    ctx.fillStyle = RED;
    ctx.fillText(String(index + 1).padStart(2, "0"), 88, y + 64);
    ctx.font = font(48, 700);
    ctx.fillStyle = CREAM;
    ctx.fillText(step, 250, y + 58);
    ctx.fillStyle = FAINT;
    ctx.fillRect(250, y + 96, 700, 2);
    ctx.restore();
  });
}

function drawEnd(ctx, scene, local) {
  const span = scene.end - scene.start;
  const k = enter(local, span, 0.05);
  const title = enter(local, span, 0.16);
  const sub = enter(local, span, 0.32);
  const next = enter(local, span, 0.48);
  const source = enter(local, span, 0.6);
  ctx.save();
  ctx.globalAlpha *= k.p;
  ctx.font = font(30, 700);
  ctx.fillStyle = RED;
  ctx.fillText(scene.kicker, 88, 760 + k.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= title.p;
  ctx.font = font(92, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.title, 88, 900 + title.dy);
  ctx.fillStyle = RED;
  ctx.fillRect(88, 940 + title.dy, 120, 8);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= sub.p;
  ctx.font = font(36, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.sub, 88, 1040 + sub.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= next.p;
  ctx.font = font(40, 700);
  ctx.fillStyle = CREAM;
  ctx.fillText(scene.next, 88, 1160 + next.dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= source.p;
  ctx.font = font(28, 700);
  ctx.fillStyle = DIM;
  ctx.fillText(scene.source, 88, 1288 + source.dy);
  ctx.restore();
}

const DRAW = {
  open: drawOpen,
  what: drawWhat,
  who: drawWho,
  path: drawPath,
  tracks: drawTracks,
  start: drawStart,
  end: drawEnd,
};

function drawFrame(ctx, episode, time) {
  const t = clamp(time, 0, episode.duration - 1e-4);
  ctx.clearRect(0, 0, episode.width, episode.height);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawBoard(ctx, episode.width, episode.height);
  const layers = pairAt(episode.scenes, t);
  layers.forEach(function (layer) {
    const draw = DRAW[layer.scene.id];
    if (!draw) return;
    useAlpha(ctx, layer.alpha, function () {
      draw(ctx, layer.scene, layer.local);
    });
  });
  drawChrome(ctx, episode, t);
}

window.drawFrame = drawFrame;
