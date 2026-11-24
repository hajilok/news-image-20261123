import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const STORIES_PATH = resolve(SCRIPT_DIR, 'stories.json');
const ART_DIR = process.env.ART_DIR ?? '/tmp/news-art';
const OUT_DIR = process.env.CANDIDATES_DIR ?? '/tmp/news-candidates';

function imgDataUri(fileName) {
  const fullPath = join(ART_DIR, fileName);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing staged illustration: ${fullPath}`);
  }
  const b64 = readFileSync(fullPath).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
}

function renderHeroStory(story) {
  const imgSrc = imgDataUri(story.art);
  return `
    <article style="display:flex;flex-direction:column;gap:7px;height:100%;">
      <div style="
        width:100%;height:204px;overflow:hidden;
        background:#111926;border:1px solid #B9AB92;
      ">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;padding-top:1px;">
        <div style="display:flex;align-items:center;gap:7px;">
          <span style="width:14px;height:3.5px;background:${story.accent};display:inline-block;"></span>
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:15px;font-weight:900;letter-spacing:0.08em;
            color:${story.accent};text-transform:uppercase;line-height:1;
          ">${story.kicker}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:28px;font-weight:900;line-height:1.06;
          letter-spacing:-0.02em;color:#0B1018;
          white-space:nowrap;
        ">${story.headline}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:17.5px;font-weight:600;line-height:1.22;
          color:#1B2432;
        ">${story.subline}</p>
      </div>
    </article>
  `;
}

function renderMidStory(story) {
  const imgSrc = imgDataUri(story.art);
  const headlineHtml = story.headlineLines.join('<br/>');
  return `
    <article style="display:flex;flex-direction:column;gap:7px;height:100%;">
      <div style="
        width:100%;height:160px;overflow:hidden;
        background:#111926;border:1px solid #B9AB92;
      ">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;padding-top:1px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:12px;height:3.5px;background:${story.accent};display:inline-block;"></span>
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:14.5px;font-weight:900;letter-spacing:0.06em;
            color:${story.accent};text-transform:uppercase;line-height:1;
            white-space:nowrap;
          ">${story.kicker}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:22.5px;font-weight:900;line-height:1.08;
          letter-spacing:-0.018em;color:#0B1018;
        ">${headlineHtml}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:16px;font-weight:600;line-height:1.22;
          color:#1B2432;
        ">${story.subline}</p>
      </div>
    </article>
  `;
}

function renderBottomStory(story) {
  const imgSrc = imgDataUri(story.art);
  return `
    <article style="display:flex;flex-direction:column;gap:6px;height:100%;">
      <div style="
        width:100%;height:142px;overflow:hidden;
        background:#111926;border:1px solid #B9AB92;
      ">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
      </div>
      <div style="display:flex;flex-direction:column;gap:3.5px;padding-top:1px;">
        <div style="display:flex;align-items:center;gap:7px;">
          <span style="width:13px;height:3.5px;background:${story.accent};display:inline-block;"></span>
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:14.5px;font-weight:900;letter-spacing:0.07em;
            color:${story.accent};text-transform:uppercase;line-height:1;
          ">${story.kicker}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:23px;font-weight:900;line-height:1.06;
          letter-spacing:-0.022em;color:#0B1018;
          white-space:nowrap;
        ">${story.headline}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:16.2px;font-weight:600;line-height:1.2;
          color:#1B2432;
        ">${story.subline}</p>
      </div>
    </article>
  `;
}

function buildMasthead(data, styleVariant) {
  if (styleVariant === 'navy') {
    return `
      <header style="
        background:#111C2D;
        border-top:4.5px solid #C83E2B;
        padding:12px 20px 10px;
        height:94px;
        display:flex;flex-direction:column;justify-content:center;align-items:center;
        gap:5px;
      ">
        <div style="display:flex;align-items:center;gap:14px;width:100%;">
          <span style="height:1.2px;flex:1;background:rgba(243,220,158,0.5);"></span>
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:16.5px;font-weight:900;letter-spacing:0.16em;
            color:#F3DC9E;text-transform:uppercase;line-height:1;
          ">${data.edition}</span>
          <span style="height:1.2px;flex:1;background:rgba(243,220,158,0.5);"></span>
        </div>
        <h1 style="
          margin:0;
          font-family:'C059','P052','Liberation Serif',Georgia,serif;
          font-size:51px;font-weight:700;line-height:1.0;
          letter-spacing:0.01em;color:#FAF6EE;
          white-space:nowrap;
        ">${data.dateLabel}</h1>
      </header>
    `;
  }

  return `
    <header style="
      border-top:4.5px solid #11161F;
      border-bottom:2.5px solid #11161F;
      padding:7px 0 8px;
      height:88px;
      display:flex;flex-direction:column;justify-content:center;align-items:center;
      gap:3px;
    ">
      <div style="display:flex;align-items:center;gap:14px;width:100%;">
        <span style="height:1.5px;flex:1;background:#B83826;opacity:0.55;"></span>
        <span style="
          font-family:'Liberation Sans',sans-serif;
          font-size:15px;font-weight:900;letter-spacing:0.16em;
          color:#B83826;text-transform:uppercase;line-height:1;
        ">${data.edition}</span>
        <span style="height:1.5px;flex:1;background:#B83826;opacity:0.55;"></span>
      </div>
      <h1 style="
        margin:0;
        font-family:'C059','P052','Liberation Serif',Georgia,serif;
        font-size:54px;font-weight:700;line-height:1.0;
        letter-spacing:0.005em;color:#0B1018;
        white-space:nowrap;
      ">${data.dateLabel}</h1>
    </header>
  `;
}

function buildBroadsheetHtml(data, styleVariant = 'archival') {
  const heroes = data.stories.filter((s) => s.tier === 'hero');
  const mids = data.stories.filter((s) => s.tier === 'mid');
  const bottoms = data.stories.filter((s) => s.tier === 'bottom');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 1024px;
    height: 1024px;
    overflow: hidden;
    background: #F5EFE2;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
</style>
</head>
<body>
  <div style="
    width:1024px;height:1024px;
    padding:12px 16px 12px;
    display:flex;flex-direction:column;
    background:#F5EFE2;
  ">
    ${buildMasthead(data, styleVariant)}

    <main style="display:flex;flex-direction:column;flex:1;margin-top:11px;">
      <!-- Tier 1: Dual Hero Leads -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr;
        column-gap:12px;
        height:332px;
        padding-bottom:10px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderHeroStory(heroes[0])}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderHeroStory(heroes[1])}
      </section>

      <!-- Tier 2: Three-Column Global Dispatch -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr 1px 1fr;
        column-gap:10px;
        height:326px;
        padding-top:10px;
        padding-bottom:10px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderMidStory(mids[0])}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderMidStory(mids[1])}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderMidStory(mids[2])}
      </section>

      <!-- Tier 3: Two-Column Wide World Row -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr;
        column-gap:12px;
        flex:1;
        padding-top:11px;
      ">
        ${renderBottomStory(bottoms[0])}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderBottomStory(bottoms[1])}
      </section>
    </main>
  </div>
</body>
</html>`;
}

function renderVariant(data, styleVariant, outImagePath, thumbPath, quality = 90) {
  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `r2_${styleVariant}.html`);
  const rawPngPath = join(OUT_DIR, `r2_${styleVariant}_2x.png`);

  writeFileSync(htmlPath, buildBroadsheetHtml(data, styleVariant), 'utf8');

  execFileSync(
    'chromium',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--window-size=1024,1024',
      '--force-device-scale-factor=2',
      `--screenshot=${rawPngPath}`,
      `file://${htmlPath}`
    ],
    { stdio: 'pipe', timeout: 30000 }
  );

  execFileSync(
    'python3',
    [
      '-c',
      `
import os
from PIL import Image
im = Image.open("${rawPngPath}").convert("RGB")
im1024 = im.resize((1024, 1024), Image.Resampling.LANCZOS)
im1024.save("${outImagePath}", format="JPEG", quality=${quality}, subsampling=0, optimize=True)
im300 = im1024.resize((300, 300), Image.Resampling.LANCZOS)
im300.save("${thumbPath}", format="PNG", optimize=True)
print("Rendered:", "${outImagePath}", im1024.size, os.path.getsize("${outImagePath}"), "bytes")
`
    ],
    { stdio: 'inherit' }
  );
}

const data = JSON.parse(readFileSync(STORIES_PATH, 'utf8'));
const cmd = process.argv[2] ?? 'compare';

if (cmd === 'compare') {
  renderVariant(
    data,
    'archival',
    join(OUT_DIR, 'r2_V3A_archival.jpg'),
    join(OUT_DIR, 'r2_V3A_archival_300px.png'),
    90
  );
  renderVariant(
    data,
    'navy',
    join(OUT_DIR, 'r2_V3B_navy.jpg'),
    join(OUT_DIR, 'r2_V3B_navy_300px.png'),
    90
  );
} else if (cmd === 'ship-archival') {
  renderVariant(data, 'archival', resolve(REPO_ROOT, 'entry.png'), join(OUT_DIR, 'r2_shipped_300px.png'), 89);
} else if (cmd === 'ship-navy') {
  renderVariant(data, 'navy', resolve(REPO_ROOT, 'entry.png'), join(OUT_DIR, 'r2_shipped_300px.png'), 89);
} else {
  throw new Error(`Unknown render command: ${cmd}`);
}
