import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episodeDir = path.join(root, "episodes", "01");
const timeline = JSON.parse(fs.readFileSync(path.join(episodeDir, "timeline.json"), "utf8"));

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1];
}

const timesArg = arg("--times", "");
const times = timesArg
  ? timesArg.split(",").map(Number)
  : null;
const outDir = path.resolve(root, arg("--out", times ? "episodes/01/dist/stills" : "episodes/01/dist/frames"));
fs.mkdirSync(outDir, { recursive: true });

const port = Number(arg("--port", "4173"));
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/episodes/01/timeline.json");
      if (response.ok) return;
    } catch {
      await sleep(150);
    }
  }
  throw new Error("preview server did not start");
}

const frames = times
  ? times.map((t) => ({ t, name: "t-" + t.toFixed(2).replace(".", "_") + ".jpg" }))
  : Array.from({ length: timeline.fps * timeline.duration }, (_, i) => ({
      t: i / timeline.fps,
      name: String(i).padStart(5, "0") + ".jpg",
    }));

const browser = await chromium.launch({ headless: true });
try {
  await waitForServer();
  const page = await browser.newPage({
    viewport: { width: timeline.width, height: timeline.height },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:" + port + "/episodes/01/index.html?export=1", {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(async () => {
    await document.fonts.load('700 148px "WenQuanYi Micro Hei"');
    await document.fonts.ready;
  });

  const started = Date.now();
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const dataUrl = await page.evaluate((t) => {
      window.render(t);
      return document.querySelector("canvas").toDataURL("image/jpeg", 0.92);
    }, frame.t);
    const body = dataUrl.split(",")[1];
    fs.writeFileSync(path.join(outDir, frame.name), Buffer.from(body, "base64"));
    if (i % 100 === 0 || i === frames.length - 1) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      console.log(i + 1 + "/" + frames.length + " " + elapsed + "s");
    }
  }
  console.log("wrote " + frames.length + " frames to " + outDir);
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
